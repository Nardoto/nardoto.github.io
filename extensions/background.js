/**
 * Background Service Worker
 * Gerencia o ciclo de vida da extensão e validação de licença
 * Privacy-First: NÃO rastreia atividade do usuário
 */

// Importa o validador de licença
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('VEO3 Automator Pro instalado/atualizado');

    if (details.reason === 'install') {
        // Primeira instalação - abre página de ativação
        chrome.tabs.create({
            url: 'https://nardoto.com.br/geradores/gerador-pro.html'
        });
    }
});

// Escuta mensagens do content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkLicense') {
        // Verifica licença no storage
        chrome.storage.local.get(['veo3_license_data'], (result) => {
            const license = result.veo3_license_data;

            if (!license) {
                sendResponse({ valid: false, needsActivation: true });
                return;
            }

            // Validação local básica
            const now = new Date();
            const expiresAt = new Date(license.expiresAt);
            const isValid = expiresAt > now && license.status === 'active';

            sendResponse({
                valid: isValid,
                license: license,
                daysLeft: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
            });
        });

        return true; // Mantém canal aberto para resposta assíncrona
    }

    if (request.action === 'openActivation') {
        // Abre página de ativação
        chrome.tabs.create({
            url: 'https://nardoto.com.br/geradores/gerador-pro.html'
        });
    }
});

// Verifica licença periodicamente (1x por dia)
chrome.alarms.create('checkLicense', { periodInMinutes: 24 * 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkLicense') {
        // Validação silenciosa em background
        chrome.storage.local.get(['veo3_license_data'], (result) => {
            const license = result.veo3_license_data;

            if (license) {
                const now = new Date();
                const expiresAt = new Date(license.expiresAt);
                const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

                // Aviso apenas se estiver expirando
                if (daysLeft <= 3 && daysLeft > 0) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon128.png',
                        title: 'Licença Expirando',
                        message: `Sua licença expira em ${daysLeft} dias. Renove em nardoto.com.br`
                    });
                }
            }
        });
    }
});

// Privacy-First: NÃO rastreamos:
// - Quantas vezes você usa a extensão
// - Quais sites você visita
// - Quais prompts você usa
// - Horários de uso
// - Quantidade de gerações
// Apenas validamos se a licença está ativa e válida