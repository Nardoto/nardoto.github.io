// license-system.js
// Sistema de licenciamento com validação de máquina

console.log("🔐 License System: Carregado!");

// Configuração
const LICENSE_CONFIG = {
    STORAGE_KEY: 'veo3_license_data',
    VALIDATION_INTERVAL: 24 * 60 * 60 * 1000, // Valida a cada 24 horas
    MAX_OFFLINE_DAYS: 7 // Permite usar offline por até 7 dias
};

// Estado da licença
let licenseState = {
    isValid: false,
    licenseKey: null,
    deviceFingerprint: null,
    lastValidation: null,
    userData: null
};

/**
 * Inicializa o sistema de licença
 */
async function initLicenseSystem() {
    console.log("🔄 Inicializando sistema de licença...");

    try {
        // Carrega dados salvos
        const savedData = await loadLicenseData();

        if (savedData && savedData.licenseKey) {
            console.log("📦 Dados de licença encontrados, validando...");

            // Gera fingerprint da máquina atual
            const currentFingerprint = await generateDeviceFingerprint();

            // Valida a licença
            const validation = await validateLicense(
                savedData.licenseKey,
                currentFingerprint
            );

            if (validation.valid) {
                licenseState = {
                    isValid: true,
                    licenseKey: savedData.licenseKey,
                    deviceFingerprint: currentFingerprint,
                    lastValidation: Date.now(),
                    userData: validation.userData
                };

                await saveLicenseData(licenseState);
                console.log("✅ Licença válida!");
                return true;
            } else {
                console.warn("⚠️ Licença inválida:", validation.message);
                return false;
            }
        } else {
            console.log("⚠️ Nenhuma licença encontrada");
            return false;
        }

    } catch (error) {
        console.error("❌ Erro ao inicializar licença:", error);
        return false;
    }
}

/**
 * Ativa uma nova licença
 */
async function activateLicense(licenseKey, username, password) {
    console.log("🔓 Tentando ativar licença...");

    try {
        // Valida formato da chave
        if (!isValidLicenseKeyFormat(licenseKey)) {
            return {
                success: false,
                message: "Formato de chave inválido. Use: XXXX-XXXX-XXXX-XXXX"
            };
        }

        // Gera fingerprint da máquina
        const deviceFingerprint = await generateDeviceFingerprint();

        // Valida com Firebase
        const validation = await validateAndActivateLicense(
            licenseKey,
            username,
            password,
            deviceFingerprint
        );

        if (validation.valid) {
            // Salva localmente
            licenseState = {
                isValid: true,
                licenseKey: licenseKey,
                deviceFingerprint: deviceFingerprint,
                lastValidation: Date.now(),
                userData: validation.userData
            };

            await saveLicenseData(licenseState);

            console.log("✅ Licença ativada com sucesso!");
            return {
                success: true,
                message: "Licença ativada com sucesso!",
                userData: validation.userData
            };

        } else {
            console.warn("❌ Falha na ativação:", validation.message);
            return {
                success: false,
                message: validation.message
            };
        }

    } catch (error) {
        console.error("❌ Erro ao ativar licença:", error);
        return {
            success: false,
            message: "Erro ao conectar com servidor de validação"
        };
    }
}

/**
 * Valida uma licença com o servidor Firebase
 */
async function validateAndActivateLicense(licenseKey, username, password, deviceFingerprint) {
    console.log("🔍 Validando e ativando licença com Firebase:", {
        key: licenseKey,
        username: username,
        fingerprint: deviceFingerprint.substring(0, 16) + '...'
    });

    try {
        // Valida formato
        if (!isValidLicenseKeyFormat(licenseKey)) {
            return {
                valid: false,
                message: "Formato de chave inválido"
            };
        }

        // Verifica se licença já existe no Firebase
        const existingLicense = await checkLicenseInFirebase(licenseKey);

        if (existingLicense) {
            // Se não tem fingerprint salvo (string vazia ou null), é primeira ativação
            if (!existingLicense.deviceFingerprint || existingLicense.deviceFingerprint === '') {
                console.log("✅ Primeira ativação desta licença - vinculando ao dispositivo");

                // Atualiza o fingerprint no Firebase
                const updatedLicense = {
                    licenseKey: licenseKey,
                    username: username,
                    deviceFingerprint: deviceFingerprint,
                    plan: existingLicense.plan || "Automação Acelerada",
                    expiresAt: existingLicense.expiresAt.toMillis ? existingLicense.expiresAt.toMillis() : existingLicense.expiresAt
                };

                // Registra o fingerprint
                await registerLicenseInFirebase(updatedLicense);

                return {
                    valid: true,
                    userData: {
                        username: existingLicense.username,
                        plan: existingLicense.plan || "Automação Acelerada",
                        expiresAt: existingLicense.expiresAt.toMillis ? existingLicense.expiresAt.toMillis() : existingLicense.expiresAt,
                        message: existingLicense.message || '',
                        messageUpdatedAt: existingLicense.messageUpdatedAt || null
                    }
                };
            }
            // Se tem fingerprint e é o mesmo dispositivo
            else if (existingLicense.deviceFingerprint === deviceFingerprint) {
                // Mesmo dispositivo - permite reativação
                console.log("✅ Licença sendo reativada no mesmo dispositivo");
                return {
                    valid: true,
                    userData: {
                        username: existingLicense.username,
                        plan: existingLicense.plan || "Automação Acelerada",
                        expiresAt: existingLicense.expiresAt.toMillis ? existingLicense.expiresAt.toMillis() : existingLicense.expiresAt,
                        message: existingLicense.message || '',
                        messageUpdatedAt: existingLicense.messageUpdatedAt || null
                    }
                };
            }
            // Se tem fingerprint e é dispositivo diferente
            else {
                // Dispositivo diferente - BLOQUEIA!
                console.warn("🚫 Licença já vinculada a outro dispositivo!");
                console.warn("Fingerprint salvo:", existingLicense.deviceFingerprint.substring(0, 16) + '...');
                console.warn("Fingerprint atual:", deviceFingerprint.substring(0, 16) + '...');
                return {
                    valid: false,
                    message: "❌ Esta licença já está ativada em outro computador. Cada licença só funciona em 1 máquina."
                };
            }
        } else {
            // Licença não encontrada no Firebase
            console.error("❌ Licença não encontrada no sistema!");
            console.error("Esta licença pode ter sido deletada ou nunca existiu.");
            console.error("Entre em contato com o suporte para obter uma licença válida.");

            return {
                valid: false,
                message: "❌ Licença não encontrada no sistema.\n\nEsta licença pode ter sido deletada ou nunca foi criada.\n\nEntre em contato com o suporte."
            };
        }
    } catch (error) {
        console.error("❌ Erro ao validar com Firebase:", error);
        return {
            valid: false,
            message: "Erro ao conectar com servidor. Verifique sua conexão com a internet."
        };
    }
}

/**
 * Valida licença existente no Firebase
 */
async function validateLicense(licenseKey, deviceFingerprint) {
    console.log("🔍 Validando licença existente no Firebase...");
    console.log("Fingerprint atual:", deviceFingerprint.substring(0, 16) + '...');

    try {
        // Valida com Firebase
        return await validateLicenseInFirebase(licenseKey, deviceFingerprint);
    } catch (error) {
        console.error("❌ Erro ao validar licença:", error);

        // Se falhar no Firebase, tenta validação offline (fallback)
        console.log("⚠️ Tentando validação offline...");
        const savedData = await loadLicenseData();

        if (savedData && savedData.deviceFingerprint === deviceFingerprint) {
            console.log("✅ Validação offline bem-sucedida");
            return {
                valid: true,
                userData: savedData.userData
            };
        }

        return {
            valid: false,
            message: "Não foi possível validar a licença"
        };
    }
}

/**
 * Verifica se a extensão está licenciada
 */
function isLicensed() {
    return licenseState.isValid;
}

/**
 * Obtém informações do usuário
 */
function getUserData() {
    return licenseState.userData;
}

/**
 * Desativa a licença (logout)
 */
async function deactivateLicense() {
    licenseState = {
        isValid: false,
        licenseKey: null,
        deviceFingerprint: null,
        lastValidation: null,
        userData: null
    };

    await chrome.storage.local.remove(LICENSE_CONFIG.STORAGE_KEY);
    console.log("🚪 Licença desativada");
}

/**
 * Valida formato da chave (XXXX-XXXX-XXXX-XXXX)
 */
function isValidLicenseKeyFormat(key) {
    const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(key);
}

/**
 * Salva dados da licença no storage local
 */
async function saveLicenseData(data) {
    try {
        await chrome.storage.local.set({
            [LICENSE_CONFIG.STORAGE_KEY]: {
                licenseKey: data.licenseKey,
                deviceFingerprint: data.deviceFingerprint,
                lastValidation: data.lastValidation,
                userData: data.userData
            }
        });
        console.log("💾 Licença salva no storage local");
    } catch (error) {
        console.error("❌ Erro ao salvar licença:", error);
    }
}

/**
 * Carrega dados da licença do storage local
 */
async function loadLicenseData() {
    try {
        const result = await chrome.storage.local.get(LICENSE_CONFIG.STORAGE_KEY);
        return result[LICENSE_CONFIG.STORAGE_KEY] || null;
    } catch (error) {
        console.error("❌ Erro ao carregar licença:", error);
        return null;
    }
}

/**
 * Carrega registro global de todas as licenças ativadas
 * Este registro compartilhado impede que a mesma licença seja usada em múltiplos dispositivos
 */
async function loadGlobalLicenseRegistry() {
    try {
        const result = await chrome.storage.local.get('veo3_global_license_registry');
        return result.veo3_global_license_registry || {};
    } catch (error) {
        console.error("❌ Erro ao carregar registro global:", error);
        return {};
    }
}

/**
 * Salva registro global de licenças
 */
async function saveGlobalLicenseRegistry(registry) {
    try {
        await chrome.storage.local.set({
            'veo3_global_license_registry': registry
        });
        console.log("💾 Registro global de licenças atualizado");
        console.log("📊 Total de licenças registradas:", Object.keys(registry).length);
    } catch (error) {
        console.error("❌ Erro ao salvar registro global:", error);
    }
}

/**
 * Gera uma chave de licença (para você usar no admin)
 */
function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;

    const key = [];
    for (let i = 0; i < segments; i++) {
        let segment = '';
        for (let j = 0; j < segmentLength; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        key.push(segment);
    }

    return key.join('-');
}

/**
 * Cache de verificação de licença
 */
let licenseCheckCache = {
    lastCheck: 0,
    isValid: false,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    warningCount: 0,
    MAX_WARNINGS: 1, // Permite 1 aviso antes de contar envios
    submissionCount: 0, // Contador de envios após revogação
    MAX_SUBMISSIONS_AFTER_REVOKE: 20, // Máximo de envios após revogação
    isRevoked: false // Flag para indicar se está em modo revogado
};

/**
 * Verificação rápida de licença com cache e sistema de avisos
 */
async function quickLicenseCheck(forceCheck = false) {
    console.log("⚡ Verificação rápida de licença...");

    const now = Date.now();

    // Usa cache se ainda válido e não forçado
    if (!forceCheck &&
        licenseCheckCache.lastCheck &&
        (now - licenseCheckCache.lastCheck) < licenseCheckCache.CACHE_DURATION &&
        licenseCheckCache.isValid) {
        console.log("✅ Usando cache de licença válida");
        return true;
    }

    try {
        // Carrega dados salvos
        const savedData = await loadLicenseData();

        if (!savedData || !savedData.licenseKey) {
            console.warn("⚠️ Nenhuma licença encontrada");
            return false;
        }

        // Gera fingerprint atual
        const currentFingerprint = await generateDeviceFingerprint();

        // Tenta validar online primeiro
        try {
            const validation = await validateLicenseInFirebase(savedData.licenseKey, currentFingerprint);

            if (!validation.valid) {
                // Licença inválida ou revogada
                console.warn("🚫 Licença inválida ou revogada:", validation.message);

                // Marcar como revogado se ainda não estava
                if (!licenseCheckCache.isRevoked) {
                    licenseCheckCache.isRevoked = true;
                    licenseCheckCache.submissionCount = 0; // Resetar contador ao detectar revogação
                    await saveLicenseCheckCache(); // Salvar estado
                }

                // Sistema de avisos - Primeiro aviso
                if (licenseCheckCache.warningCount < licenseCheckCache.MAX_WARNINGS) {
                    licenseCheckCache.warningCount++;
                    console.log(`⚠️ Primeiro aviso de revogação`);

                    const message = `⚠️ ATENÇÃO: Sua licença foi revogada!\n\n` +
                                  `📊 Você ainda pode:\n` +
                                  `✅ PROCESSAR prompts ilimitadamente (organizar)\n` +
                                  `⚠️ ENVIAR até ${licenseCheckCache.MAX_SUBMISSIONS_AFTER_REVOKE} vídeos para geração\n\n` +
                                  `📢 Após ${licenseCheckCache.MAX_SUBMISSIONS_AFTER_REVOKE} envios, o acesso será bloqueado totalmente.\n\n` +
                                  `💡 Entre em contato com o suporte para renovar:\n` +
                                  `📧 Suporte: nardoto@suporte.com`;

                    alert(message);

                    // Salvar estado
                    await saveLicenseCheckCache();

                    // Ainda permite usar
                    licenseCheckCache.lastCheck = now;
                    return true;
                }

                // Já passou do primeiro aviso - verificar contador de envios
                if (licenseCheckCache.submissionCount < licenseCheckCache.MAX_SUBMISSIONS_AFTER_REVOKE) {
                    console.log(`📊 Envios restantes: ${licenseCheckCache.MAX_SUBMISSIONS_AFTER_REVOKE - licenseCheckCache.submissionCount}`);

                    // Ainda tem envios disponíveis
                    licenseCheckCache.lastCheck = now;
                    return true;
                } else {
                    // Esgotou todos os envios
                    console.error("❌ Licença bloqueada após esgotar envios");
                    licenseCheckCache.isValid = false;

                    alert(`🚫 ACESSO BLOQUEADO\n\n` +
                          `Você utilizou todos os ${licenseCheckCache.MAX_SUBMISSIONS_AFTER_REVOKE} envios permitidos após a revogação.\n\n` +
                          `Para continuar usando a extensão, entre em contato com o suporte:\n` +
                          `📧 nardoto@suporte.com`);

                    // Limpa dados e força reload
                    await deactivateLicense();
                    return false;
                }
            }

            // Licença válida - reseta contador de avisos
            licenseCheckCache.warningCount = 0;
            licenseCheckCache.lastCheck = now;
            licenseCheckCache.isValid = true;

            console.log("✅ Licença validada online");
            return true;

        } catch (error) {
            console.warn("⚠️ Erro ao validar online, usando fallback offline:", error);

            // Fallback offline - verifica fingerprint
            if (savedData.deviceFingerprint === currentFingerprint) {
                // Verifica se não está offline há muito tempo
                const daysSinceLastValidation = (now - savedData.lastValidation) / (1000 * 60 * 60 * 24);

                if (daysSinceLastValidation <= LICENSE_CONFIG.MAX_OFFLINE_DAYS) {
                    console.log("✅ Validação offline aceita");
                    licenseCheckCache.lastCheck = now;
                    licenseCheckCache.isValid = true;
                    return true;
                } else {
                    console.warn("⚠️ Muito tempo offline, requer validação online");
                    return false;
                }
            } else {
                console.warn("⚠️ Fingerprint não coincide");
                return false;
            }
        }

    } catch (error) {
        console.error("❌ Erro na verificação rápida:", error);

        // Em caso de erro, permite continuar se já estava válido
        if (licenseState.isValid) {
            console.log("✅ Mantendo estado anterior válido");
            return true;
        }

        return false;
    }
}

/**
 * Reseta o contador de avisos (útil após renovação de licença)
 */
function resetWarningCounter() {
    licenseCheckCache.warningCount = 0;
    console.log("🔄 Contador de avisos resetado");
}

/**
 * Verifica quantas chances restam antes do bloqueio
 */
function getRemainingWarnings() {
    return licenseCheckCache.MAX_WARNINGS - licenseCheckCache.warningCount;
}

/**
 * Salva o cache de verificação no storage
 */
async function saveLicenseCheckCache() {
    try {
        await chrome.storage.local.set({
            'veo3_license_check_cache': {
                warningCount: licenseCheckCache.warningCount,
                submissionCount: licenseCheckCache.submissionCount,
                isRevoked: licenseCheckCache.isRevoked,
                lastUpdate: Date.now()
            }
        });
        console.log("💾 Cache de verificação salvo");
    } catch (error) {
        console.error("❌ Erro ao salvar cache:", error);
    }
}

/**
 * Carrega o cache de verificação do storage
 */
async function loadLicenseCheckCache() {
    try {
        const result = await chrome.storage.local.get('veo3_license_check_cache');
        if (result.veo3_license_check_cache) {
            const cache = result.veo3_license_check_cache;
            licenseCheckCache.warningCount = cache.warningCount || 0;
            licenseCheckCache.submissionCount = cache.submissionCount || 0;
            licenseCheckCache.isRevoked = cache.isRevoked || false;
            console.log("📦 Cache de verificação carregado:", {
                warnings: licenseCheckCache.warningCount,
                submissions: licenseCheckCache.submissionCount,
                revoked: licenseCheckCache.isRevoked
            });
        }
    } catch (error) {
        console.error("❌ Erro ao carregar cache:", error);
    }
}

/**
 * Incrementa o contador de envios e retorna se ainda pode enviar
 */
async function incrementSubmissionCount() {
    if (licenseCheckCache.isRevoked) {
        licenseCheckCache.submissionCount++;
        await saveLicenseCheckCache();

        const remaining = licenseCheckCache.MAX_SUBMISSIONS_AFTER_REVOKE - licenseCheckCache.submissionCount;
        console.log(`📊 Envio registrado. Restantes: ${remaining}`);

        // Mostrar aviso quando estiver acabando
        if (remaining === 5) {
            alert(`⚠️ ATENÇÃO: Você tem apenas ${remaining} envios restantes!\n\n` +
                  `Após esgotar os envios, o acesso será bloqueado.\n` +
                  `Entre em contato com o suporte: nardoto@suporte.com`);
        } else if (remaining === 1) {
            alert(`🚨 ÚLTIMO ENVIO!\n\n` +
                  `Este é seu último envio permitido.\n` +
                  `Após este envio, o acesso será bloqueado.\n` +
                  `Entre em contato urgente: nardoto@suporte.com`);
        }

        return remaining > 0;
    }
    return true; // Se não está revogado, sempre pode enviar
}

/**
 * Verifica se a licença está revogada (para mostrar status na interface)
 */
function isLicenseRevoked() {
    return licenseCheckCache.isRevoked;
}

/**
 * Obtém o número de envios restantes
 */
function getRemainingSubmissions() {
    if (licenseCheckCache.isRevoked) {
        return licenseCheckCache.MAX_SUBMISSIONS_AFTER_REVOKE - licenseCheckCache.submissionCount;
    }
    return -1; // -1 indica ilimitado
}

// Carregar cache ao inicializar
(async function initCache() {
    await loadLicenseCheckCache();
})();

console.log("✅ License System: Pronto para uso!");

// Exemplo de uso:
console.log("📝 Exemplo de chave válida:", generateLicenseKey());
