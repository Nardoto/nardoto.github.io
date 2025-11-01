/**
 * Popup Script - VEO3 Automator Pro
 * Sistema de autenticação completo: Email + Senha
 * Privacy-First: Validação local sempre que possível
 */

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', async () => {
    const session = await getSession();

    if (session && session.loggedIn) {
        // Usuário já está logado
        showDashboard(session.userData);
    } else {
        // Mostrar tela de login
        document.getElementById('loginScreen').classList.add('active');
    }
});

// Handle login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    // Disable button
    btn.disabled = true;
    btn.textContent = 'Validando...';

    try {
        // Busca credenciais salvas
        const result = await chrome.storage.local.get(['veo3_users']);
        const users = result.veo3_users || [];

        // Procura usuário
        const user = users.find(u => u.email === email);

        if (!user) {
            showLoginError('Email não encontrado. Ative sua licença primeiro.');
            btn.disabled = false;
            btn.textContent = 'Entrar';
            return;
        }

        // Verifica senha (hash simples)
        const passwordHash = hashPassword(password);
        if (user.password !== passwordHash) {
            showLoginError('Senha incorreta!');
            btn.disabled = false;
            btn.textContent = 'Entrar';
            return;
        }

        // Verifica se a licença está válida
        const now = new Date();
        const expiresAt = new Date(user.expiresAt);

        if (expiresAt < now) {
            showLoginError('Sua licença expirou! Renove em nardoto.com.br');
            btn.disabled = false;
            btn.textContent = 'Entrar';
            return;
        }

        // Login bem-sucedido!
        // Salva sessão
        await chrome.storage.local.set({
            veo3_session: {
                loggedIn: true,
                email: email,
                loginAt: new Date().toISOString()
            },
            veo3_license_data: {
                key: user.licenseKey,
                type: user.licenseType,
                email: user.email,
                name: user.name,
                expiresAt: user.expiresAt,
                status: 'active',
                lastOnlineCheck: new Date().toISOString()
            }
        });

        // Mostra dashboard
        showDashboard(user);

    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Erro ao fazer login. Tente novamente.');
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
}

// Show login error
function showLoginError(message) {
    const alert = document.getElementById('loginAlert');
    alert.textContent = message;
    alert.style.display = 'block';

    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Get session
async function getSession() {
    const result = await chrome.storage.local.get(['veo3_session', 'veo3_license_data']);

    if (result.veo3_session && result.veo3_session.loggedIn) {
        // Busca dados completos do usuário
        const usersResult = await chrome.storage.local.get(['veo3_users']);
        const users = usersResult.veo3_users || [];
        const userData = users.find(u => u.email === result.veo3_session.email);

        return {
            loggedIn: true,
            userData: userData || result.veo3_license_data
        };
    }

    return null;
}

// Show dashboard
function showDashboard(userData) {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');

    // Preenche informações do usuário
    document.getElementById('userName').textContent = userData.name || 'Usuário';
    document.getElementById('userEmail').textContent = userData.email;

    // Calcula dias restantes
    const now = new Date();
    const expiresAt = new Date(userData.expiresAt);
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    // Define status
    let statusBadge = '';
    let statusClass = 'badge-active';

    if (userData.licenseType === 'trial') {
        statusClass = 'badge-trial';
        statusBadge = 'Trial';
    } else if (daysLeft <= 0) {
        statusClass = 'badge-expired';
        statusBadge = 'Expirada';
    } else if (daysLeft <= 7) {
        statusClass = 'badge-expiring';
        statusBadge = 'Expirando';
    } else {
        statusBadge = 'Ativa';
    }

    document.getElementById('licenseStatus').innerHTML =
        `<span class="badge ${statusClass}">${statusBadge}</span>`;

    // Tipos de licença
    const licenseTypes = {
        'trial': 'Trial (7 dias)',
        'monthly': 'Mensal',
        'quarterly': 'Trimestral',
        'annual': 'Anual',
        'lifetime': 'Vitalícia'
    };

    document.getElementById('licenseType').textContent =
        licenseTypes[userData.licenseType] || userData.licenseType;

    document.getElementById('licenseExpiry').textContent =
        expiresAt.toLocaleDateString('pt-BR');

    document.getElementById('licenseDays').textContent =
        userData.licenseType === 'lifetime' ? '∞ Vitalícia' : `${daysLeft} dias`;
}

// Handle logout
async function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        // Remove sessão
        await chrome.storage.local.remove(['veo3_session']);

        // Mostra tela de login
        document.getElementById('dashboardScreen').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');

        // Limpa campos
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    }
}

// Refresh license
async function refreshLicense() {
    const session = await getSession();
    if (session && session.userData) {
        showDashboard(session.userData);

        // Mostra feedback
        alert('Licença atualizada com sucesso!');
    }
}

// Toggle password visibility
function togglePassword() {
    const input = document.getElementById('loginPassword');
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Simple password hash (same as activation page)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(36);
}

// Helpers para abrir links
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: link.href });
    });
});