// background.js
// Service Worker para verificação periódica de licença e notificações

console.log("🔔 Background Service Worker: Iniciando...");

// Importar scripts necessários
importScripts(
  '../license/device-fingerprint.js',
  '../license/firebase-api.js',
  '../license/license-system.js'
);

// Configurações
const BACKGROUND_CONFIG = {
  CHECK_INTERVAL: 4 * 60 * 60 * 1000, // Verifica a cada 4 horas
  ALARM_NAME: 'licenseCheck'
};

/**
 * Inicializa o serviço quando a extensão é instalada ou atualizada
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extensão instalada/atualizada:", details.reason);

  // Cria alarme para verificação periódica
  await setupPeriodicCheck();

  // Faz primeira verificação imediatamente
  if (details.reason === 'install') {
    console.log("✅ Primeira instalação - aguardando ativação de licença");
  } else if (details.reason === 'update') {
    console.log("🔄 Atualização detectada - verificando licença...");
    await checkLicenseAndNotify();
  }
});

/**
 * Configura verificação periódica usando Chrome Alarms API
 */
async function setupPeriodicCheck() {
  // Remove alarme anterior se existir
  await chrome.alarms.clear(BACKGROUND_CONFIG.ALARM_NAME);

  // Cria novo alarme (a cada 4 horas)
  chrome.alarms.create(BACKGROUND_CONFIG.ALARM_NAME, {
    periodInMinutes: 240 // 4 horas
  });

  console.log("⏰ Alarme de verificação configurado (a cada 4 horas)");
}

/**
 * Listener para alarmes
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === BACKGROUND_CONFIG.ALARM_NAME) {
    console.log("⏰ Alarme disparado - verificando licença...");
    await checkLicenseAndNotify();
  }
});

/**
 * Verifica licença e envia notificação se necessário
 */
async function checkLicenseAndNotify() {
  try {
    console.log("🔍 Verificando status da licença...");

    // Carrega dados da licença do storage
    const licenseData = await loadLicenseData();

    if (!licenseData || !licenseData.licenseKey) {
      console.log("⚠️ Nenhuma licença ativada");
      return;
    }

    // Gera fingerprint
    const currentFingerprint = await generateDeviceFingerprint();

    // Valida no Firebase
    const validation = await validateLicenseInFirebase(
      licenseData.licenseKey,
      currentFingerprint
    );

    if (!validation.valid) {
      // Licença inválida ou expirada
      console.warn("🚫 Licença inválida:", validation.message);
      await showNotification(
        "❌ Licença Inválida",
        validation.message || "Sua licença não está mais ativa. Entre em contato com o suporte.",
        'error'
      );
      return;
    }

    console.log("✅ Licença válida");

    // Verifica se há mensagem do admin
    if (validation.userData.message && validation.userData.message.trim() !== '') {
      console.log("📢 Mensagem do admin encontrada:", validation.userData.message);

      // Verifica se já mostrou essa mensagem antes
      const lastShownMessage = await getLastShownMessage();

      if (lastShownMessage !== validation.userData.message) {
        // Nova mensagem - mostrar notificação
        await showNotification(
          "📢 Mensagem do Administrador",
          validation.userData.message,
          'message'
        );

        // Salva que já mostrou essa mensagem
        await saveLastShownMessage(validation.userData.message);
      }
    }

    // Verifica dias restantes
    const daysLeft = Math.ceil((validation.userData.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 7 && daysLeft > 0) {
      console.log(`⚠️ Licença expira em ${daysLeft} dias`);
      await showNotification(
        "⚠️ Licença Próxima do Vencimento",
        `Sua licença expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}. Renove para continuar usando.`,
        'warning'
      );
    }

  } catch (error) {
    console.error("❌ Erro ao verificar licença:", error);
  }
}

/**
 * Exibe notificação do Chrome
 */
async function showNotification(title, message, type = 'info') {
  const iconMap = {
    'info': 'icon128.png',
    'warning': 'icon128.png',
    'error': 'icon128.png',
    'message': 'icon128.png'
  };

  const options = {
    type: 'basic',
    iconUrl: `../../assets/icons/${iconMap[type]}`,
    title: title,
    message: message,
    priority: type === 'error' ? 2 : 1,
    requireInteraction: type === 'message' || type === 'error'
  };

  await chrome.notifications.create(`veo3-${type}-${Date.now()}`, options);
  console.log("🔔 Notificação enviada:", title);
}

/**
 * Salva última mensagem mostrada
 */
async function saveLastShownMessage(message) {
  try {
    await chrome.storage.local.set({
      'veo3_last_shown_message': message,
      'veo3_last_shown_message_time': Date.now()
    });
  } catch (error) {
    console.error("❌ Erro ao salvar última mensagem:", error);
  }
}

/**
 * Recupera última mensagem mostrada
 */
async function getLastShownMessage() {
  try {
    const result = await chrome.storage.local.get('veo3_last_shown_message');
    return result.veo3_last_shown_message || null;
  } catch (error) {
    console.error("❌ Erro ao recuperar última mensagem:", error);
    return null;
  }
}

/**
 * Listener para mensagens do content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLicenseNow') {
    // Força verificação imediata
    console.log("📲 Verificação forçada solicitada");
    checkLicenseAndNotify().then(() => {
      sendResponse({ success: true });
    });
    return true; // Indica resposta assíncrona
  }

  if (request.action === 'getLicenseStatus') {
    // Retorna status atual da licença
    loadLicenseData().then(data => {
      sendResponse({
        licensed: data && data.licenseKey ? true : false,
        userData: data ? data.userData : null
      });
    });
    return true;
  }
});

console.log("✅ Background Service Worker: Pronto!");
