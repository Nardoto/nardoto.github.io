// firebase-api.js
// Integração com Firebase usando REST API (compatível com Chrome Extensions)

console.log("🔥 Firebase API: Carregando...");

// Configuração do Firebase
const FIREBASE_CONFIG = {
  projectId: "veo3automator",
  apiKey: "AIzaSyCeh-SnpsmOcpxgJHirM_volJloRuzBzC4",
  databaseURL: "https://firestore.googleapis.com/v1/projects/veo3automator/databases/(default)/documents"
};

/**
 * Verifica se uma licença já existe no Firebase
 */
async function checkLicenseInFirebase(licenseKey) {
  try {
    const url = `${FIREBASE_CONFIG.databaseURL}/licenses/${licenseKey}?key=${FIREBASE_CONFIG.apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      console.log("⚠️ Licença não encontrada no Firebase:", licenseKey);
      return null;
    }

    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Licença encontrada no Firebase:", licenseKey);

    // Verifica se a licença foi deletada
    const status = data.fields.status?.stringValue || 'active';
    if (status === 'deleted') {
      console.warn("🗑️ Esta licença foi deletada!");
      return null; // Retorna null para licenças deletadas
    }

    // Converte dados do Firebase para formato usado pela extensão
    return {
      licenseKey: data.fields.licenseKey?.stringValue || '',
      username: data.fields.username?.stringValue || '',
      deviceFingerprint: data.fields.deviceFingerprint?.stringValue || '',
      plan: data.fields.plan?.stringValue || 'Automação Acelerada',
      expiresAt: {
        toMillis: () => parseInt(data.fields.expiresAt?.integerValue || Date.now() + (180 * 24 * 60 * 60 * 1000))
      },
      status: status,
      activatedAt: data.fields.activatedAt?.timestampValue || data.fields.createdAt?.timestampValue || new Date().toISOString(),
      message: data.fields.message?.stringValue || '',
      messageUpdatedAt: data.fields.messageUpdatedAt?.timestampValue || null
    };

  } catch (error) {
    console.error("❌ Erro ao buscar licença no Firebase:", error);
    throw error;
  }
}

/**
 * Registra uma nova licença no Firebase (atualiza apenas campos necessários)
 */
async function registerLicenseInFirebase(licenseData) {
  try {
    // IMPORTANTE: Usa updateMask para atualizar APENAS os campos especificados
    // Isso preserva name, email, phone, password, notes, tags, message, etc.
    const url = `${FIREBASE_CONFIG.databaseURL}/licenses/${licenseData.licenseKey}?key=${FIREBASE_CONFIG.apiKey}&updateMask.fieldPaths=deviceFingerprint&updateMask.fieldPaths=status&updateMask.fieldPaths=activatedAt`;

    // Envia APENAS os campos que precisam ser atualizados durante ativação
    const firebaseDoc = {
      fields: {
        deviceFingerprint: { stringValue: licenseData.deviceFingerprint || '' },
        status: { stringValue: "active" },
        activatedAt: { timestampValue: new Date().toISOString() }
      }
    };

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(firebaseDoc)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Erro do Firebase:", error);
      throw new Error(`Firebase error: ${response.status}`);
    }

    console.log("✅ Licença atualizada no Firebase (preservando dados existentes):", licenseData.licenseKey);
    return true;

  } catch (error) {
    console.error("❌ Erro ao atualizar licença no Firebase:", error);
    throw error;
  }
}

/**
 * Valida licença no Firebase (verifica fingerprint)
 */
async function validateLicenseInFirebase(licenseKey, deviceFingerprint) {
  try {
    const licenseData = await checkLicenseInFirebase(licenseKey);

    if (!licenseData) {
      return {
        valid: false,
        message: "Licença não encontrada"
      };
    }

    // Verifica se o fingerprint bate
    if (licenseData.deviceFingerprint !== deviceFingerprint) {
      console.warn("🚫 Fingerprint não confere!");
      console.warn("Esperado:", licenseData.deviceFingerprint.substring(0, 16) + '...');
      console.warn("Recebido:", deviceFingerprint.substring(0, 16) + '...');

      return {
        valid: false,
        message: "Esta licença está vinculada a outro computador"
      };
    }

    // Verifica expiração
    const expiresAt = licenseData.expiresAt.toMillis();
    if (Date.now() > expiresAt) {
      return {
        valid: false,
        message: "Licença expirada"
      };
    }

    console.log("✅ Licença válida no Firebase!");
    return {
      valid: true,
      userData: {
        username: licenseData.username,
        plan: licenseData.plan,
        expiresAt: expiresAt,
        message: licenseData.message || '',
        messageUpdatedAt: licenseData.messageUpdatedAt || null
      }
    };

  } catch (error) {
    console.error("❌ Erro ao validar licença:", error);
    throw error;
  }
}

console.log("✅ Firebase API: Pronto para uso!");
