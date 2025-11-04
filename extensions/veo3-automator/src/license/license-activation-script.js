// license-activation-script.js
// Script separado para a página de ativação (resolve CSP)

console.log('🔐 Script de ativação carregado');

// Auto-formatação da chave de licença
const licenseInput = document.getElementById('licenseKey');
if (licenseInput) {
    licenseInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
        let formatted = '';

        for (let i = 0; i < value.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) formatted += '-';
            formatted += value[i];
        }

        e.target.value = formatted;
    });
}

// Form submission
const form = document.getElementById('activationForm');
const button = document.getElementById('activateButton');
const message = document.getElementById('message');

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const licenseKey = document.getElementById('licenseKey').value.trim();

        // Validações
        if (!username || !password || !licenseKey) {
            showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        if (!isValidLicenseKeyFormat(licenseKey)) {
            showMessage('Formato de chave inválido', 'error');
            document.getElementById('licenseKey').classList.add('error');
            setTimeout(() => {
                document.getElementById('licenseKey').classList.remove('error');
            }, 500);
            return;
        }

        // Ativa licença
        button.disabled = true;
        button.classList.add('loading');
        message.style.display = 'none';

        try {
            console.log('🔄 Tentando ativar licença...');
            const result = await activateLicense(licenseKey, username, password);

            if (result.success) {
                showMessage('✅ Licença ativada! Pode fechar esta aba e recarregar a página do Google Labs.', 'success');
                console.log('✅ Ativação bem-sucedida!');

                // Mostra mensagem do admin se existir
                if (result.userData && result.userData.message && result.userData.message.trim() !== '') {
                    console.log('📢 Mensagem do admin encontrada:', result.userData.message);
                    showAdminMessage(result.userData.message);
                }

                // Salva flag indicando que acabou de ativar
                await chrome.storage.local.set({ 'veo3_just_activated': true });

                // Aguarda 5 segundos e fecha (mais tempo para ler mensagem)
                setTimeout(() => {
                    window.close();
                }, 5000);

            } else {
                showMessage('❌ ' + result.message, 'error');
                button.disabled = false;
                button.classList.remove('loading');
            }

        } catch (error) {
            console.error('Erro ao ativar:', error);
            showMessage('❌ Erro ao conectar com servidor', 'error');
            button.disabled = false;
            button.classList.remove('loading');
        }
    });
}

function showMessage(text, type) {
    if (message) {
        message.textContent = text;
        message.className = 'message ' + type;
        message.style.display = 'block';
    }
}

function showAdminMessage(messageText) {
    const adminMessageEl = document.getElementById('adminMessage');
    const adminMessageTextEl = document.getElementById('adminMessageText');

    if (adminMessageEl && adminMessageTextEl) {
        adminMessageTextEl.textContent = messageText;
        adminMessageEl.style.display = 'flex';
    }
}

// Log de inicialização
console.log('🔐 Tela de ativação carregada');
if (typeof generateLicenseKey === 'function') {
    console.log('📝 Exemplo de chave válida:', generateLicenseKey());
}

// Modal de Termos de Uso
const termsModal = document.getElementById('termsModal');
const openTermsLink1 = document.getElementById('openTermsLink1');
const openTermsLink2 = document.getElementById('openTermsLink2');
const closeModalBtn = document.getElementById('closeModalBtn');

function openTermsModal() {
    if (termsModal) {
        termsModal.classList.add('active');
    }
}

function closeTermsModal() {
    if (termsModal) {
        termsModal.classList.remove('active');
    }
}

// Event listeners para abrir modal
if (openTermsLink1) {
    openTermsLink1.addEventListener('click', openTermsModal);
}
if (openTermsLink2) {
    openTermsLink2.addEventListener('click', openTermsModal);
}

// Event listener para fechar modal
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeTermsModal);
}

// Fechar modal ao clicar fora dele
if (termsModal) {
    termsModal.addEventListener('click', function(e) {
        if (e.target === termsModal) {
            closeTermsModal();
        }
    });
}
