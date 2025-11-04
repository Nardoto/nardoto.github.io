// gemini-fix.js - Fix para Trusted Types no Gemini
if (window.location.hostname.includes('gemini.google.com')) {
    console.log('🔧 Aplicando fix para Gemini - Trusted Types');
    
    // Override do trustedTypes para o Gemini
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try {
            window.trustedTypes.createPolicy('default', {
                createHTML: (string) => string,
                createScriptURL: (string) => string,
                createScript: (string) => string,
            });
            console.log('✅ Trusted Types policy configurada para Gemini');
        } catch (error) {
            console.log('⚠️ Trusted Types policy já existe:', error.message);
        }
    }
    
    // Configuração adicional para melhor compatibilidade
    window.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Gemini DOM carregado - Gemini LoopLess 2.5 compatível');
    });
}
