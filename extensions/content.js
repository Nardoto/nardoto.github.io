/**
 * Content Script Principal
 * Executa automações nos sites suportados
 * Privacy-First: NÃO envia dados de uso para servidor
 */

// Inicialização
(async function() {
    console.log('VEO3 Automator Pro - Iniciando...');

    // Verifica licença antes de ativar funcionalidades
    const licenseStatus = await checkLicense();

    if (!licenseStatus.valid) {
        showLicenseWarning();
        return;
    }

    // Ativa automações baseado no site atual
    const currentSite = window.location.hostname;

    if (currentSite.includes('veo-3.vercel.app')) {
        initVEO3Automation();
    } else if (currentSite.includes('suno.ai')) {
        initSunoAutomation();
    } else if (currentSite.includes('wisk.com')) {
        initWiskAutomation();
    } else if (currentSite.includes('chat.openai.com')) {
        initGPTAutomation();
    } else if (currentSite.includes('claude.ai')) {
        initClaudeAutomation();
    } else if (currentSite.includes('gemini.google.com')) {
        initGeminiAutomation();
    } else if (currentSite.includes('capcut.com')) {
        initCapCutAutomation();
    } else if (currentSite.includes('discord.com')) {
        initMidjourneyAutomation();
    } else if (currentSite.includes('translate.google.com')) {
        initGoogleSpeechAutomation();
    }

    // Mostra badge de status da licença
    showLicenseBadge(licenseStatus);
})();

// Verifica licença com o background
async function checkLicense() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'checkLicense' }, (response) => {
            resolve(response || { valid: false });
        });
    });
}

// Mostra aviso de licença inválida
function showLicenseWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        z-index: 999999;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    `;
    warning.innerHTML = `
        <strong>⚠️ Licença Necessária</strong><br>
        <span style="font-size: 14px;">
            VEO3 Automator Pro requer uma licença válida.
            <br><br>
            <a href="#" id="activate-license" style="
                color: white;
                text-decoration: underline;
                font-weight: bold;
            ">Ativar Licença</a>
        </span>
    `;

    document.body.appendChild(warning);

    document.getElementById('activate-license').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'openActivation' });
    });
}

// Mostra badge de status da licença
function showLicenseBadge(status) {
    const badge = document.createElement('div');
    badge.id = 'veo3-license-badge';
    badge.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${status.daysLeft > 7 ? '#10b981' : '#f59e0b'};
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        z-index: 999998;
        cursor: pointer;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const licenseType = {
        'trial': 'Trial',
        'monthly': 'Mensal',
        'quarterly': 'Trimestral',
        'annual': 'Anual',
        'lifetime': 'Vitalícia'
    };

    badge.innerHTML = `
        <span style="font-size: 16px;">🔒</span>
        <span>
            ${licenseType[status.license?.type] || 'Licença'}
            ${status.daysLeft !== 36500 ? `• ${status.daysLeft} dias` : '• ∞'}
        </span>
    `;

    badge.title = 'VEO3 Automator Pro - Click para detalhes';

    badge.addEventListener('click', () => {
        alert(`
VEO3 AUTOMATOR PRO
Sistema Privacy-First

Tipo: ${licenseType[status.license?.type]}
Válida até: ${new Date(status.license?.expiresAt).toLocaleDateString('pt-BR')}
Dias restantes: ${status.daysLeft !== 36500 ? status.daysLeft : 'Vitalícia'}

✅ Política de Privacidade:
• Sem rastreamento de uso
• Sem coleta de prompts
• Sem monitoramento de atividade
• Validação local sempre que possível
• Seus dados são seus

Suporte: nardoto.com.br
        `.trim());
    });

    document.body.appendChild(badge);
}

// === IMPLEMENTAÇÃO DAS AUTOMAÇÕES ===

// VEO3 Video Generator
function initVEO3Automation() {
    console.log('VEO3 Automation ativada');
    // Adiciona botões de automação para VEO3
    // Implementação específica aqui
}

// Suno AI Music
function initSunoAutomation() {
    console.log('Suno Automation ativada');
    // Automação para Suno.ai
}

// Wisk Video
function initWiskAutomation() {
    console.log('Wisk Automation ativada');
    // Automação para Wisk
}

// ChatGPT
function initGPTAutomation() {
    console.log('GPT Automation ativada');
    // Automação para ChatGPT
}

// Claude AI
function initClaudeAutomation() {
    console.log('Claude Automation ativada');
    // Automação para Claude
}

// Google Gemini
function initGeminiAutomation() {
    console.log('Gemini Automation ativada');
    // Automação para Gemini
}

// CapCut
function initCapCutAutomation() {
    console.log('CapCut Automation ativada');
    // Automação para CapCut
}

// Midjourney (via Discord)
function initMidjourneyAutomation() {
    console.log('Midjourney Automation ativada');
    // Automação para Midjourney no Discord
}

// Google Speech
function initGoogleSpeechAutomation() {
    console.log('Google Speech Automation ativada');
    // Automação para Google Tradutor/Speech
}

// === HELPERS ===

// Aguarda elemento aparecer
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found`));
            } else {
                setTimeout(checkElement, 100);
            }
        };

        checkElement();
    });
}

// Injeta botão customizado
function injectButton(text, onClick, parentSelector) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        font-family: system-ui, -apple-system, sans-serif;
        transition: transform 0.2s;
    `;
    button.addEventListener('click', onClick);
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });

    const parent = document.querySelector(parentSelector);
    if (parent) {
        parent.appendChild(button);
    }

    return button;
}