/**
 * API de Verificação de Licença - Privacy First
 * Endpoint minimalista para validação de licenças
 *
 * IMPORTANTE: Este é um template de exemplo
 * Deploy em seu servidor Node.js/Express ou Vercel/Netlify Functions
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database simulado (use MongoDB, PostgreSQL, etc em produção)
const LICENSES_DB = {
    // Exemplo de estrutura de licença
    'XXXX-XXXX-XXXX-XXXX': {
        email: 'user@example.com',
        type: 'monthly',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-02-01T00:00:00Z',
        status: 'active',
        checkFrequency: 'weekly'
    }
};

// === ENDPOINTS PRIVACY-FIRST ===

/**
 * POST /api/verify-license
 * Verifica apenas se a licença é válida
 * NÃO rastreia: IP, device, uso, horários, prompts
 */
app.post('/api/verify-license', (req, res) => {
    const { key } = req.body;

    // Valida apenas a chave
    if (!key) {
        return res.status(400).json({
            valid: false,
            error: 'License key required'
        });
    }

    // Busca licença no banco
    const license = LICENSES_DB[key];

    if (!license) {
        return res.status(404).json({
            valid: false,
            error: 'License not found'
        });
    }

    // Verifica se expirou
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);

    if (expiresAt < now) {
        return res.json({
            valid: false,
            reason: 'expired'
        });
    }

    // Verifica status
    if (license.status !== 'active') {
        return res.json({
            valid: false,
            reason: license.status
        });
    }

    // Retorna APENAS informações essenciais
    // NÃO salvamos: timestamp, IP, user-agent, nada!
    res.json({
        valid: true,
        type: license.type,
        expiresAt: license.expiresAt,
        checkFrequency: license.checkFrequency
    });

    // NÃO fazemos:
    // - Log de acesso
    // - Contador de verificações
    // - Salvar último IP
    // - Rastrear frequência de uso
    // - Analytics
});

/**
 * POST /api/verify-license/activate
 * Ativa uma nova licença
 */
app.post('/api/verify-license/activate', async (req, res) => {
    const { key, email } = req.body;

    if (!key || !email) {
        return res.status(400).json({
            success: false,
            error: 'Key and email required'
        });
    }

    // Verifica se a chave existe e não foi ativada
    const license = LICENSES_DB[key];

    if (!license) {
        return res.status(404).json({
            success: false,
            error: 'Invalid license key'
        });
    }

    if (license.status === 'activated') {
        return res.status(400).json({
            success: false,
            error: 'License already activated'
        });
    }

    // Ativa a licença
    license.status = 'active';
    license.activatedAt = new Date().toISOString();
    license.email = email; // Associa ao email

    // Calcula data de expiração baseado no tipo
    const now = new Date();
    const expirationDays = {
        'trial': 7,
        'monthly': 30,
        'quarterly': 90,
        'annual': 365,
        'lifetime': 36500 // 100 anos
    };

    const daysToAdd = expirationDays[license.type] || 30;
    const expiresAt = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    license.expiresAt = expiresAt.toISOString();

    // Define frequência de verificação baseado no tipo
    const checkFrequencies = {
        'trial': 'once',        // Só na ativação
        'monthly': 'weekly',    // 1x por semana
        'quarterly': 'biweekly', // 2x por mês
        'annual': 'monthly',    // 1x por mês
        'lifetime': 'never'     // Nunca
    };

    license.checkFrequency = checkFrequencies[license.type] || 'weekly';

    // Retorna dados da licença ativada
    res.json({
        success: true,
        type: license.type,
        expiresAt: license.expiresAt,
        checkFrequency: license.checkFrequency
    });

    // NÃO salvamos:
    // - IP de ativação
    // - Device ID
    // - Browser info
    // - Localização
});

/**
 * POST /api/admin/create-license
 * Endpoint administrativo para criar licenças
 * PROTEJA COM AUTENTICAÇÃO!
 */
app.post('/api/admin/create-license', (req, res) => {
    const { adminKey, type, email } = req.body;

    // Verificação simples de admin (use JWT em produção)
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Gera chave única
    const key = generateLicenseKey();

    // Cria entrada no banco
    LICENSES_DB[key] = {
        email: email || '',
        type: type || 'monthly',
        createdAt: new Date().toISOString(),
        expiresAt: null, // Será definido na ativação
        status: 'pending', // Aguardando ativação
        checkFrequency: 'weekly'
    };

    res.json({
        success: true,
        key: key,
        type: type
    });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'VEO3 License API',
        privacy: 'No tracking, no analytics, no user data collection'
    });
});

// === HELPERS ===

/**
 * Gera chave de licença no formato XXXX-XXXX-XXXX-XXXX
 */
function generateLicenseKey() {
    const segments = 4;
    const segmentLength = 4;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let key = '';
    for (let i = 0; i < segments; i++) {
        if (i > 0) key += '-';
        for (let j = 0; j < segmentLength; j++) {
            key += charset.charAt(Math.floor(Math.random() * charset.length));
        }
    }

    return key;
}

// === IMPORTANTE: POLÍTICA DE PRIVACIDADE ===
/**
 * Este sistema NÃO coleta ou armazena:
 *
 * ❌ Endereços IP
 * ❌ User agents / informações do navegador
 * ❌ Timestamps de acesso
 * ❌ Frequência de uso
 * ❌ Quantidade de verificações
 * ❌ Localização geográfica
 * ❌ Device IDs
 * ❌ Prompts ou conteúdo gerado
 * ❌ Analytics ou métricas
 *
 * ✅ Armazenamos APENAS:
 * - Chave da licença
 * - Email (para suporte)
 * - Tipo e validade
 * - Status (ativa/suspensa)
 *
 * Filosofia: "Seus dados são seus. Ponto final."
 */

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   VEO3 License API - Privacy First     ║
    ║   Running on port ${PORT}                  ║
    ║   No tracking • No analytics           ║
    ║   Your data is yours                   ║
    ╚════════════════════════════════════════╝
    `);
});