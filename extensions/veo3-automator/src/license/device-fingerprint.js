// device-fingerprint.js
// Gera um ID único baseado nas características da máquina do usuário

console.log("🔒 Device Fingerprint: Carregado!");

/**
 * Gera um fingerprint único da máquina
 * Combina múltiplos fatores para criar um ID difícil de falsificar
 */
async function generateDeviceFingerprint() {
    const components = [];

    try {
        // 1. User Agent (navegador + sistema operacional)
        components.push(navigator.userAgent);

        // 2. Idioma do navegador
        components.push(navigator.language);

        // 3. Timezone
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

        // 4. Resolução da tela
        components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

        // 5. Hardware Concurrency (núcleos do processador)
        components.push(navigator.hardwareConcurrency || 0);

        // 6. Device Memory (RAM)
        components.push(navigator.deviceMemory || 0);

        // 7. Canvas Fingerprint (mais difícil de falsificar)
        const canvasFingerprint = await getCanvasFingerprint();
        components.push(canvasFingerprint);

        // 8. WebGL Fingerprint
        const webglFingerprint = getWebGLFingerprint();
        components.push(webglFingerprint);

        // 9. Plugins instalados
        const plugins = Array.from(navigator.plugins || [])
            .map(p => p.name)
            .sort()
            .join(',');
        components.push(plugins);

        // 10. Platform
        components.push(navigator.platform);

        // Combina tudo e gera hash
        const combined = components.join('|');
        const fingerprint = await hashString(combined);

        console.log('🔑 Fingerprint gerado:', fingerprint.substring(0, 16) + '...');
        return fingerprint;

    } catch (error) {
        console.error('❌ Erro ao gerar fingerprint:', error);
        // Fallback: usa apenas componentes básicos
        const basicFingerprint = `${navigator.userAgent}|${screen.width}x${screen.height}`;
        return await hashString(basicFingerprint);
    }
}

/**
 * Gera fingerprint baseado em Canvas (desenho)
 */
function getCanvasFingerprint() {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 200;
            canvas.height = 50;

            // Desenha texto com características específicas
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Nardoto VEO3 🎬', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Nardoto VEO3 🎬', 4, 17);

            // Converte para data URL
            const dataURL = canvas.toDataURL();
            resolve(dataURL);

        } catch (e) {
            resolve('canvas-not-supported');
        }
    });
}

/**
 * Gera fingerprint baseado em WebGL (placa de vídeo)
 */
function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) return 'webgl-not-supported';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'webgl-no-debug-info';

        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        return `${vendor}|${renderer}`;

    } catch (e) {
        return 'webgl-error';
    }
}

/**
 * Gera hash SHA-256 de uma string
 */
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Valida se o fingerprint é válido (tamanho e formato)
 */
function isValidFingerprint(fingerprint) {
    return fingerprint &&
           typeof fingerprint === 'string' &&
           fingerprint.length === 64; // SHA-256 sempre gera 64 caracteres
}

console.log("✅ Device Fingerprint: Pronto para uso!");
