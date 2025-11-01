/**
 * Sistema de Validação de Licença Privacy-First
 * NÃO rastreia uso, NÃO envia dados, NÃO monitora atividade
 * Validação LOCAL sempre que possível
 */

class LicenseValidator {
    constructor() {
        this.LICENSE_KEY = 'veo3_license_data';
        this.API_URL = 'https://nardoto.com.br/api/verify-license'; // Endpoint minimalista
        this.license = null;
        this.init();
    }

    // Inicialização
    async init() {
        await this.loadLicense();

        // Verifica licença ao iniciar
        const isValid = await this.validate();

        if (!isValid) {
            this.showActivationUI();
        } else {
            this.showLicenseStatus();
        }
    }

    // Carrega licença do armazenamento local
    async loadLicense() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.LICENSE_KEY], (result) => {
                this.license = result[this.LICENSE_KEY] || null;
                resolve(this.license);
            });
        });
    }

    // Salva licença localmente
    async saveLicense(licenseData) {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                [this.LICENSE_KEY]: licenseData
            }, () => {
                this.license = licenseData;
                resolve();
            });
        });
    }

    // Validação principal (offline primeiro)
    async validate() {
        // Se não tem licença, inválido
        if (!this.license) {
            return false;
        }

        // Validação LOCAL primeiro
        const localValidation = this.validateOffline();

        if (!localValidation.valid) {
            return false;
        }

        // Verifica se precisa validação online
        if (this.needsOnlineCheck()) {
            const onlineValidation = await this.validateOnline();
            if (!onlineValidation) {
                // Se falhou online mas está válido offline, mantém funcionando
                console.log('Validação online falhou, usando cache local');
                return localValidation.valid;
            }
        }

        return true;
    }

    // Validação offline (sem internet)
    validateOffline() {
        if (!this.license) {
            return { valid: false, reason: 'No license' };
        }

        const now = new Date();
        const expiresAt = new Date(this.license.expiresAt);

        // Verifica se expirou
        if (expiresAt < now) {
            return { valid: false, reason: 'Expired' };
        }

        // Verifica se está suspensa
        if (this.license.status === 'suspended') {
            return { valid: false, reason: 'Suspended' };
        }

        // Calcula dias restantes
        const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        return {
            valid: true,
            daysLeft: daysLeft,
            type: this.license.type,
            expiresAt: this.license.expiresAt
        };
    }

    // Verifica se precisa check online
    needsOnlineCheck() {
        if (!this.license) return true;

        const checkFrequency = this.license.checkFrequency || 'weekly';
        const lastCheck = this.license.lastOnlineCheck ? new Date(this.license.lastOnlineCheck) : null;

        if (!lastCheck) return true;

        const now = new Date();
        const daysSinceCheck = Math.floor((now - lastCheck) / (1000 * 60 * 60 * 24));

        // Define intervalo baseado no tipo de licença
        const intervals = {
            'never': Infinity,      // Vitalícia - nunca verifica
            'once': Infinity,        // Trial - verifica só na ativação
            'weekly': 7,             // Mensal - 1x por semana
            'biweekly': 14,          // Trimestral - 2x por mês
            'monthly': 30,           // Anual - 1x por mês
            'quarterly': 90          // Vitalícia backup - 1x por trimestre
        };

        const interval = intervals[checkFrequency] || 7;
        return daysSinceCheck >= interval;
    }

    // Validação online (mínima)
    async validateOnline() {
        if (!this.license || !this.license.key) return false;

        try {
            // Envia APENAS a chave da licença
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: this.license.key,
                    // NÃO enviamos:
                    // - IP
                    // - Device ID
                    // - Quantidade de uso
                    // - Horários
                    // - Prompts
                    // - NADA além da chave
                })
            });

            if (!response.ok) {
                throw new Error('Network error');
            }

            const data = await response.json();

            if (data.valid) {
                // Atualiza dados locais
                this.license.expiresAt = data.expiresAt;
                this.license.type = data.type || this.license.type;
                this.license.status = 'active';
                this.license.lastOnlineCheck = new Date().toISOString();

                await this.saveLicense(this.license);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Erro na validação online:', error);
            // Em caso de erro, usa validação offline
            return null;
        }
    }

    // Ativa nova licença
    async activateLicense(key, email) {
        try {
            // Busca dados da licença
            const response = await fetch(this.API_URL + '/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: key,
                    email: email
                    // Só isso, nada mais
                })
            });

            if (!response.ok) {
                throw new Error('Activation failed');
            }

            const licenseData = await response.json();

            // Salva localmente
            await this.saveLicense({
                key: key,
                email: email,
                type: licenseData.type,
                expiresAt: licenseData.expiresAt,
                checkFrequency: licenseData.checkFrequency || 'weekly',
                status: 'active',
                activatedAt: new Date().toISOString(),
                lastOnlineCheck: new Date().toISOString()
            });

            return { success: true };

        } catch (error) {
            console.error('Erro na ativação:', error);
            return { success: false, error: error.message };
        }
    }

    // UI de ativação
    showActivationUI() {
        // Cria popup de ativação
        const html = `
            <div id="license-activation" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 32px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                z-index: 999999;
                max-width: 400px;
                width: 90%;
            ">
                <h2 style="color: #fff; margin-bottom: 8px;">Ativar Licença</h2>
                <p style="color: #94a3b8; margin-bottom: 24px; font-size: 14px;">
                    🔒 Sistema Privacy-First<br>
                    Sem rastreamento • Validação local • Seus dados são seus
                </p>

                <input type="text" id="license-key-input" placeholder="XXXX-XXXX-XXXX-XXXX" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: #fff;
                    margin-bottom: 12px;
                    font-family: monospace;
                    text-align: center;
                    font-size: 16px;
                ">

                <input type="email" id="license-email-input" placeholder="seu@email.com" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: #fff;
                    margin-bottom: 20px;
                ">

                <button id="activate-btn" style="
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 16px;
                ">
                    Ativar Licença
                </button>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #334155;">
                    <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
                        <strong>Política de Privacidade:</strong><br>
                        ✅ NÃO rastreamos quantas imagens você gera<br>
                        ✅ NÃO salvamos seus prompts<br>
                        ✅ NÃO monitoramos horários de uso<br>
                        ✅ Validação acontece no SEU computador<br>
                        ✅ Check online apenas 1x por semana
                    </p>
                </div>
            </div>
        `;

        // Adiciona ao DOM
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        // Event listener para ativação
        document.getElementById('activate-btn').addEventListener('click', async () => {
            const key = document.getElementById('license-key-input').value;
            const email = document.getElementById('license-email-input').value;

            if (!key || !email) {
                alert('Por favor, preencha a chave e email');
                return;
            }

            const result = await this.activateLicense(key, email);

            if (result.success) {
                alert('Licença ativada com sucesso!');
                container.remove();
                location.reload();
            } else {
                alert('Erro ao ativar licença: ' + result.error);
            }
        });
    }

    // Mostra status da licença
    showLicenseStatus() {
        const validation = this.validateOffline();

        // Cria badge de status
        const badge = document.createElement('div');
        badge.id = 'license-status-badge';
        badge.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${validation.daysLeft > 7 ? '#10b981' : '#f59e0b'};
            color: #fff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 999999;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        const typeLabels = {
            'trial': 'Trial',
            'monthly': 'Mensal',
            'quarterly': 'Trimestral',
            'annual': 'Anual',
            'lifetime': 'Vitalícia'
        };

        badge.innerHTML = `
            🔒 ${typeLabels[this.license.type] || 'Licença'}
            ${validation.daysLeft !== 36500 ? `• ${validation.daysLeft} dias` : '• ∞'}
        `;

        // Adiciona tooltip ao passar o mouse
        badge.title = `
Licença ${typeLabels[this.license.type]}
Válida até: ${new Date(validation.expiresAt).toLocaleDateString('pt-BR')}
🔒 Privacy-First: Sem rastreamento de uso
        `.trim();

        // Click para mostrar detalhes
        badge.addEventListener('click', () => {
            alert(`
🔒 STATUS DA LICENÇA

Tipo: ${typeLabels[this.license.type]}
Email: ${this.license.email}
Válida até: ${new Date(validation.expiresAt).toLocaleDateString('pt-BR')}
Dias restantes: ${validation.daysLeft !== 36500 ? validation.daysLeft : 'Vitalícia'}

✅ Política Privacy-First:
• Sem rastreamento de uso
• Sem coleta de dados
• Validação local
• Seus dados são seus

Última verificação online: ${this.license.lastOnlineCheck ? new Date(this.license.lastOnlineCheck).toLocaleDateString('pt-BR') : 'Nunca'}
            `.trim());
        });

        // Remove badge anterior se existir
        const oldBadge = document.getElementById('license-status-badge');
        if (oldBadge) oldBadge.remove();

        // Adiciona ao DOM
        document.body.appendChild(badge);

        // Aviso se está expirando
        if (validation.daysLeft <= 7 && validation.daysLeft > 0) {
            this.showExpirationWarning(validation.daysLeft);
        }
    }

    // Aviso de expiração
    showExpirationWarning(daysLeft) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f59e0b;
            color: #fff;
            padding: 16px 20px;
            border-radius: 8px;
            max-width: 300px;
            z-index: 999999;
            box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
            animation: slideIn 0.3s ease;
        `;

        warning.innerHTML = `
            <strong>⚠️ Licença Expirando</strong><br>
            <span style="font-size: 14px;">
                Sua licença expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}.
                <br><br>
                <a href="https://nardoto.com.br" target="_blank" style="
                    color: #fff;
                    text-decoration: underline;
                    font-weight: bold;
                ">Renovar Agora</a>
            </span>
        `;

        document.body.appendChild(warning);

        // Remove após 10 segundos
        setTimeout(() => warning.remove(), 10000);
    }
}

// Inicializa o validador quando a extensão carrega
const licenseValidator = new LicenseValidator();

// Exporta para uso em outros scripts da extensão
window.LicenseValidator = LicenseValidator;