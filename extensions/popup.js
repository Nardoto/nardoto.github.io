/**
 * Popup Script
 * Gerencia a interface do popup da extensão
 */

document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content');

    // Carrega dados da licença
    const license = await loadLicense();

    if (!license) {
        showNoLicense();
    } else {
        showLicenseInfo(license);
    }
});

// Carrega licença do storage
async function loadLicense() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['veo3_license_data'], (result) => {
            resolve(result.veo3_license_data);
        });
    });
}

// Mostra tela quando não há licença
function showNoLicense() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div class="license-status">
            <h2>❌ Nenhuma Licença Ativa</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Para usar o VEO3 Automator Pro, você precisa de uma licença válida.
            </p>
        </div>

        <div class="actions">
            <a href="https://nardoto.com.br/geradores/gerador-pro.html" target="_blank" class="btn btn-primary">
                Ativar Licença
            </a>
            <a href="https://nardoto.com.br#pricing" target="_blank" class="btn btn-secondary">
                Ver Planos
            </a>
        </div>

        <div class="tools-list">
            <h3>🛠️ Ferramentas Incluídas:</h3>
            <ul>
                <li>VEO3 Video Generator</li>
                <li>Suno AI Music Automator</li>
                <li>Wisk Video Automator</li>
                <li>ChatGPT Prompt Sender</li>
                <li>Claude Prompt Automator</li>
                <li>Gemini Prompt Sender</li>
                <li>CapCut Script Sender</li>
                <li>Midjourney Automator</li>
                <li>Google Speech Automator</li>
                <li>E muito mais...</li>
            </ul>
        </div>

        <div class="footer">
            Suporte: nardoto.com.br
        </div>
    `;
}

// Mostra informações da licença
function showLicenseInfo(license) {
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    // Determina status e badge
    let badgeClass = 'badge-active';
    let badgeText = 'Ativa';
    let statusEmoji = '✅';

    if (license.type === 'trial') {
        badgeClass = 'badge-trial';
        badgeText = 'Trial';
        statusEmoji = '🎯';
    }

    if (daysLeft <= 7 && daysLeft > 0) {
        badgeClass = 'badge-expiring';
        badgeText = 'Expirando';
        statusEmoji = '⚠️';
    }

    if (daysLeft <= 0) {
        badgeClass = 'badge-expired';
        badgeText = 'Expirada';
        statusEmoji = '❌';
    }

    const licenseTypes = {
        'trial': 'Trial (7 dias)',
        'monthly': 'Mensal',
        'quarterly': 'Trimestral',
        'annual': 'Anual',
        'lifetime': 'Vitalícia'
    };

    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div class="license-status">
            <h2>${statusEmoji} Status da Licença</h2>

            <div class="license-info">
                <span class="label">Tipo:</span>
                <span class="value">${licenseTypes[license.type] || license.type}</span>
            </div>

            <div class="license-info">
                <span class="label">Email:</span>
                <span class="value" style="font-size: 12px;">${license.email || 'N/A'}</span>
            </div>

            <div class="license-info">
                <span class="label">Status:</span>
                <span class="license-badge ${badgeClass}">${badgeText}</span>
            </div>

            ${license.type !== 'lifetime' ? `
                <div class="license-info">
                    <span class="label">Expira em:</span>
                    <span class="value">${daysLeft > 0 ? daysLeft + ' dias' : 'Expirada'}</span>
                </div>

                <div class="license-info">
                    <span class="label">Válida até:</span>
                    <span class="value">${expiresAt.toLocaleDateString('pt-BR')}</span>
                </div>
            ` : `
                <div class="license-info">
                    <span class="label">Validade:</span>
                    <span class="value">∞ Vitalícia</span>
                </div>
            `}

            <div class="license-info">
                <span class="label">Chave:</span>
                <span class="value" style="font-family: monospace; font-size: 10px;">
                    ${license.key ? license.key.substring(0, 4) + '****' : 'N/A'}
                </span>
            </div>
        </div>

        <div class="actions">
            ${daysLeft <= 7 || daysLeft <= 0 ? `
                <a href="https://nardoto.com.br#pricing" target="_blank" class="btn btn-primary">
                    ${daysLeft <= 0 ? 'Renovar Licença' : 'Renovar Agora'}
                </a>
            ` : ''}

            <button id="copy-key" class="btn btn-secondary">
                📋 Copiar Chave
            </button>

            <a href="https://nardoto.com.br" target="_blank" class="btn btn-secondary">
                🌐 Visitar Site
            </a>
        </div>

        <div class="privacy-banner" style="margin: 16px; background: rgba(99, 102, 241, 0.1); border-left-color: #6366f1;">
            <strong>📊 Seus Dados Protegidos:</strong><br>
            ✓ Não rastreamos uso<br>
            ✓ Não salvamos prompts<br>
            ✓ Não monitoramos atividade<br>
            ✓ Validação 100% local
        </div>

        <div class="footer">
            Última verificação: ${license.lastOnlineCheck ? new Date(license.lastOnlineCheck).toLocaleDateString('pt-BR') : 'Nunca'}<br>
            Suporte: nardoto.com.br
        </div>
    `;

    // Adiciona event listener para copiar chave
    document.getElementById('copy-key')?.addEventListener('click', () => {
        if (license.key) {
            navigator.clipboard.writeText(license.key).then(() => {
                const btn = document.getElementById('copy-key');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copiado!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        }
    });
}