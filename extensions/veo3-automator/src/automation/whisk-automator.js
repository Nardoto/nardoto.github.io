// whisk-automator.js - Automatizador independente para o Google Labs Whisk
// Desenvolvido por Nardoto - Funciona separadamente do VEO3 Automator
//
// NOVAS FUNCIONALIDADES:
// ✅ Switch elegante para marcar prompts que devem ser pulados
// ✅ Botão "GERAR IMAGEM" individual igual ao VEO3
// ✅ Lógica inteligente para não reenviar prompts já processados
// ✅ Estatísticas em tempo real dos prompts
// ✅ Interface otimizada com sidebar lateral
// ✅ Layout IDÊNTICO ao VEO3 com prompts FIXOS
// ✅ Aparência do Whisk mantida (cores, estilos)
// ✅ Status e prompts colados diretamente no fundo cinza

console.log("🎯 Whisk Automator: Iniciando...");

// Configurações do Whisk
const WHISK_CONFIG = {
    textAreaSelectors: [
        'textarea[placeholder="Descreva sua ideia ou veja ideias de comandos"]', // Seletor mais específico por placeholder
        'textarea.sc-18deeb1d-8.DwQls', // Campo atual do Whisk (atualizado)
        'textarea#whisk-prompts-input', // Campo alternativo
        'textarea.sc-b572b03-8.hmOywV', // Campo normal (fallback)
        'textarea.sc-b572b03-8.kVaRsV'  // Campo com imagem e referência (fallback)
    ],
    submitButtonSelector: 'i.sc-95c4f607-0.bgdmBR.google-symbols.sc-bece3008-1.hBAkTP',
    delayBetweenPrompts: 2000, // 2 segundos entre prompts
    maxRetries: 3
};

// Estado da automação
let whiskQueue = [];
let isWhiskAutomating = false;
let currentWhiskIndex = 0;
let skippedPrompts = new Set(); // Prompts marcados para pular
let individuallySentPrompts = new Set(); // Prompts enviados individualmente
let whiskFindReplaceManager = null; // Manager de localizar e substituir

// Função principal de inicialização
function initializeWhiskAutomator() {
    // Verificar se estamos na página do Flow. Se sim, não inicializar o Whisk Automator.
    const isFlowPage = window.location.href.includes('/tools/flow/');
    if (isFlowPage) {
        console.log("🎯 Whisk Automator: Página do Flow detectada. O Whisk Automator não será iniciado aqui.");
        return;
    }

    console.log("🎯 Whisk Automator: Inicializando interface...");

    // Injetar estilos globais para ajuste da página
    injectGlobalStyles();

    // Criar botão toggle
    createToggleButton();

    // Criar interface principal
    createWhiskInterface();

    console.log("🎯 Whisk Automator: Interface criada com sucesso!");
}

// Injetar estilos globais para transições suaves
function injectGlobalStyles() {
    const styleId = 'whisk-automator-global-styles';

    // Verificar se já foi injetado
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Estilos globais do Whisk Automator */
        body.whisk-automator-open {
            transition: margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Ajustar apenas o elemento específico do header */
        body.whisk-automator-open .sc-9a417730-3,
        body.whisk-automator-open .efEjXB {
            transition: margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Garantir que conteúdo principal se ajusta */
        body.whisk-automator-open main,
        body.whisk-automator-open [role="main"],
        body.whisk-automator-open .sc-6fe1c1c9-3 {
            transition: margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Garantir que grid de imagens se ajusta */
        body.whisk-automator-open .sc-7165b472-0,
        body.whisk-automator-open .sc-6ace6b2a-0,
        body.whisk-automator-open .sc-12e568c9-0,
        body.whisk-automator-open .sc-3c44e5a1-4,
        body.whisk-automator-open .sc-a74e00b7-0 {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Ajustar containers de imagens geradas */
        body.whisk-automator-open .sc-6fe1c1c9-2,
        body.whisk-automator-open .sc-b05ab5a6-0,
        body.whisk-automator-open .sc-af1d3a84-0 {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Prevenir quebras de layout */
        body.whisk-automator-open {
            overflow-x: hidden !important;
        }

        html.whisk-automator-active {
            overflow-x: hidden !important;
        }
    `;

    document.head.appendChild(style);
    console.log('✅ Estilos globais injetados');
}

// Criar botão toggle para abrir/fechar a interface
function createToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'whisk-automator-toggle';
    toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9L12 0Z"/>
        </svg>
    `;
    toggleButton.title = 'Whisk Automator - Abrir/Fechar';
    toggleButton.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10001;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #000000;
        color: #fbbc04;
        border: none;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: all 0.3s ease;
        backdrop-filter: blur(20px);
    `;
    
    // Adicionar hover effect
    toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.transform = 'scale(1.1)';
        toggleButton.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
        toggleButton.style.background = '#fbbc04';
        toggleButton.style.color = '#000000';
    });
    
    toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.transform = 'scale(1)';
        toggleButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        toggleButton.style.background = '#000000';
        toggleButton.style.color = '#fbbc04';
    });
    
    document.body.appendChild(toggleButton);
    toggleButton.addEventListener('click', toggleWhiskInterface);
}

// Criar interface principal do Whisk
function createWhiskInterface() {
    const whiskContainer = document.createElement('div');
    whiskContainer.id = 'whisk-automator-interface';
    whiskContainer.style.cssText = `
        position: fixed;
        top: 0;
        right: -500px;
        z-index: 10000;
        width: 500px;
        height: 100vh;
        background: #f8f9fa;
        border-left: 1px solid #e8eaed;
        font-family: 'Google Sans', 'Roboto', Arial, sans-serif;
        display: flex;
        flex-direction: column;
        transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(20px);
        overflow-y: auto;
    `;
    
    whiskContainer.innerHTML = `
        <div style="
            padding: 32px 32px 24px 32px;
            border-bottom: 1px solid #e8eaed;
            background: #ffffff;
            flex-shrink: 0;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="
                        width: 44px;
                        height: 44px;
                        background: #000000;
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fbbc04;
                        font-size: 22px;
                        font-weight: 600;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    ">🎯</div>
                    <div>
                        <h3 style="margin: 0; color: #000000; font-size: 26px; font-weight: 700;">Whisk Automator</h3>
                        <p style="margin: 8px 0 0 0; color: #5f6368; font-size: 16px;">Automatize a criação de imagens</p>
                    </div>
                </div>
                
            </div>
        </div>
        
        <div style="
            padding: 32px;
            flex: 1;
            overflow-y: auto;
        ">
            <div style="margin-bottom: 28px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                    <label style="font-weight: 600; color: #000000; font-size: 17px;">
                        📝 Prompts para automatizar
                    </label>
                    <button id="whisk-find-replace-btn" style="
                        background: #ffffff;
                        color: #5f6368;
                        border: 1px solid #e8eaed;
                        border-radius: 12px;
                        padding: 8px 16px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    " title="Localizar e substituir texto">
                        🔍 Localizar e Substituir
                    </button>
                </div>

                <!-- Barra de localizar e substituir -->
                <div id="whisk-find-replace-bar" style="
                    background: #f8f9fa;
                    border: 1px solid #e8eaed;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 12px;
                    display: none;
                ">
                    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                        <input type="text" id="whisk-find-input" placeholder="Localizar..." style="
                            flex: 1;
                            background: #ffffff;
                            border: 1px solid #e8eaed;
                            border-radius: 8px;
                            padding: 10px 12px;
                            font-size: 14px;
                            font-family: 'Courier New', monospace;
                            outline: none;
                            transition: all 0.2s ease;
                        ">
                        <button id="whisk-find-prev-btn" style="
                            background: #ffffff;
                            border: 1px solid #e8eaed;
                            border-radius: 6px;
                            padding: 8px 12px;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            min-width: 36px;
                        " title="Anterior">⬆</button>
                        <button id="whisk-find-next-btn" style="
                            background: #ffffff;
                            border: 1px solid #e8eaed;
                            border-radius: 6px;
                            padding: 8px 12px;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            min-width: 36px;
                        " title="Próximo">⬇</button>
                        <span id="whisk-find-count" style="
                            color: #5f6368;
                            font-size: 12px;
                            font-weight: 500;
                            min-width: 40px;
                            text-align: center;
                        ">0/0</span>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <input type="text" id="whisk-replace-input" placeholder="Substituir por..." style="
                            flex: 1;
                            background: #ffffff;
                            border: 1px solid #e8eaed;
                            border-radius: 8px;
                            padding: 10px 12px;
                            font-size: 14px;
                            font-family: 'Courier New', monospace;
                            outline: none;
                            transition: all 0.2s ease;
                        ">
                        <button id="whisk-replace-btn" style="
                            background: #fbbc04;
                            color: #000000;
                            border: none;
                            border-radius: 8px;
                            padding: 8px 16px;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Substituir</button>
                        <button id="whisk-replace-all-btn" style="
                            background: #34a853;
                            color: #ffffff;
                            border: none;
                            border-radius: 8px;
                            padding: 8px 16px;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Substituir Tudo</button>
                        <button id="whisk-close-find-btn" style="
                            background: #ea4335;
                            color: #ffffff;
                            border: none;
                            border-radius: 6px;
                            padding: 8px 12px;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            min-width: 36px;
                        ">✕</button>
                    </div>
                </div>

                <textarea
                    id="whisk-prompts-input"
                    placeholder="Descreva sua ideia ou veja ideias de comandos..."
                    style="
                        width: 100%;
                        height: 300px;
                        max-height: 500px;
                        border: 1px solid #e8eaed;
                        border-radius: 18px;
                        padding: 24px;
                        font-family: 'Courier New', monospace;
                        font-size: 16px;
                        resize: vertical;
                        box-sizing: border-box;
                        background: #ffffff;
                        transition: all 0.3s ease;
                        color: #000000;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                        line-height: 1.6;
                    "
                ></textarea>
            </div>
            
            <div style="margin-bottom: 24px;">
                <p style="margin: 0; color: #5f6368; font-size: 14px; line-height: 1.5;">
                    Formatação é removida automaticamente, quebras de linha são mantidas para separar prompts
                </p>
            </div>
            
            <div style="display: flex; gap: 18px; margin-bottom: 32px;">
                <button id="whisk-analyze-btn" style="
                    flex: 1;
                    background: #fbbc04;
                    color: #000000;
                    border: none;
                    border-radius: 18px;
                    padding: 20px 24px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(251, 188, 4, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">🔍 Analisar Prompts</button>
                <button id="whisk-clear-btn" style="
                    flex: 1;
                    background: #000000;
                    color: #ffffff;
                    border: none;
                    border-radius: 18px;
                    padding: 20px 24px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">🗑️ Limpar</button>
            </div>
            
            <!-- INFORMAÇÕES FIXAS + PROMPTS (igual ao VEO3) -->
            <div id="whisk-info-section" style="
                margin-bottom: 28px;
                display: none;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h4 style="margin: 0; color: #000000; font-size: 19px; font-weight: 700;">📊 Status da Automação</h4>
                    <button id="whisk-show-stats-btn" style="
                        background: #f8f9fa;
                        color: #5f6368;
                        border: 1px solid #e8eaed;
                        border-radius: 12px;
                        padding: 8px 16px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " title="Mostrar estatísticas detalhadas">📊 Estatísticas</button>
                </div>
                
                <div style="display: flex; gap: 18px; margin-bottom: 24px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #000000; font-size: 15px;">
                            ⏱️ Delay entre prompts (segundos)
                        </label>
                        <input 
                            type="number" 
                            id="whisk-delay-input" 
                            value="2" 
                            min="1" 
                            max="10"
                            style="
                                width: 100%;
                                padding: 12px 16px;
                                border: 1px solid #e8eaed;
                                border-radius: 12px;
                                font-size: 14px;
                                background: #ffffff;
                                transition: all 0.3s ease;
                                color: #000000;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                            "
                        >
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #000000; font-size: 15px;">
                            📈 Total de prompts
                        </label>
                        <div style="
                            padding: 12px 16px;
                            background: #f8f9fa;
                            border: 1px solid #e8eaed;
                            border-radius: 12px;
                            font-size: 14px;
                            color: #5f6368;
                            text-align: center;
                            font-weight: 600;
                        ">
                            <span id="whisk-total-count">0</span> prompts
                        </div>
                    </div>
                </div>
                
                <div id="whisk-automation-controls" style="display: none;">
                    <div style="display: flex; gap: 18px; margin-bottom: 24px;">
                        <button id="whisk-start-btn" style="
                            flex: 1;
                            background: #fbbc04;
                            color: #000000;
                            border: none;
                            border-radius: 16px;
                            padding: 18px 20px;
                            cursor: pointer;
                            font-weight: 700;
                            font-size: 15px;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 20px rgba(251, 188, 4, 0.3);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">▶️ Iniciar Automação</button>
                        <button id="whisk-stop-btn" style="
                            flex: 1;
                            background: #000000;
                            color: #ffffff;
                            border: none;
                            border-radius: 16px;
                            padding: 18px 20px;
                            cursor: pointer;
                            font-weight: 700;
                            font-size: 15px;
                            display: none;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">⏹️ Parar</button>
                    </div>
                    
                    <div id="whisk-progress" style="
                        background: #f8f9fa;
                        border: 1px solid #e8eaed;
                        border-radius: 16px;
                        padding: 20px;
                        text-align: center;
                        display: none;
                    ">
                        <div style="margin-bottom: 16px; font-weight: 700; color: #000000; font-size: 16px;">
                            Processando: <span id="whisk-current-prompt" style="color: #fbbc04;">-</span>
                        </div>
                        <div style="color: #5f6368; font-size: 15px; margin-bottom: 20px;">
                            <span id="whisk-progress-count" style="font-weight: 700; color: #fbbc04;">0</span> de <span id="whisk-total-count-progress">0</span> prompts
                        </div>
                        
                        <!-- BARRA DE PROGRESSO VISUAL -->
                        <div style="
                            width: 100%;
                            background: #e8eaed;
                            border-radius: 12px;
                            height: 12px;
                            overflow: hidden;
                            margin-bottom: 16px;
                        ">
                            <div id="whisk-progress-bar" style="
                                width: 0%;
                                height: 100%;
                                background: linear-gradient(90deg, #fbbc04 0%, #f9ab00 100%);
                                border-radius: 12px;
                                transition: width 0.5s ease;
                                box-shadow: 0 2px 8px rgba(251, 188, 4, 0.3);
                            "></div>
                        </div>
                        
                        <!-- PERCENTUAL DE PROGRESSO -->
                        <div style="
                            color: #fbbc04;
                            font-size: 18px;
                            font-weight: 700;
                            font-family: monospace;
                        ">
                            <span id="whisk-progress-percentage">0%</span>
                        </div>
                    </div>
                </div>
                
                
                <!-- PROMPTS FIXOS (igual ao VEO3) -->
                <div id="whisk-prompts-container" style="
                    margin-top: 24px;
                    max-height: 400px;
                    overflow-y: auto;
                "></div>
            </div>
            
            <div id="whisk-status" style="
                padding: 12px;
                border-radius: 8px;
                font-size: 15px;
                text-align: center;
                display: none;
            "></div>
        </div>
    `;
    
    document.body.appendChild(whiskContainer);
    
    // Adicionar event listeners
    attachWhiskListeners();
}

// Adicionar event listeners para a interface
function attachWhiskListeners() {
    const analyzeBtn = document.getElementById('whisk-analyze-btn');
    const clearBtn = document.getElementById('whisk-clear-btn');
    const startBtn = document.getElementById('whisk-start-btn');
    const stopBtn = document.getElementById('whisk-stop-btn');
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeWhiskPrompts);
        analyzeBtn.addEventListener('mouseenter', () => {
            analyzeBtn.style.transform = 'translateY(-3px)';
            analyzeBtn.style.boxShadow = '0 6px 20px rgba(251, 188, 4, 0.4)';
        });
        analyzeBtn.addEventListener('mouseleave', () => {
            analyzeBtn.style.transform = 'translateY(0)';
            analyzeBtn.style.boxShadow = '0 4px 16px rgba(251, 188, 4, 0.3)';
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearWhiskInterface);
        clearBtn.addEventListener('mouseenter', () => {
            clearBtn.style.transform = 'translateY(-3px)';
            clearBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        });
        clearBtn.addEventListener('mouseleave', () => {
            clearBtn.style.transform = 'translateY(0)';
            clearBtn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', startWhiskAutomation);
        startBtn.addEventListener('mouseenter', () => {
            startBtn.style.transform = 'translateY(-3px)';
            startBtn.style.boxShadow = '0 6px 20px rgba(251, 188, 4, 0.4)';
        });
        startBtn.addEventListener('mouseleave', () => {
            startBtn.style.transform = 'translateY(0)';
            startBtn.style.boxShadow = '0 4px 16px rgba(251, 188, 4, 0.3)';
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopWhiskAutomation);
        stopBtn.addEventListener('mouseenter', () => {
            stopBtn.style.transform = 'translateY(-3px)';
            stopBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        });
        stopBtn.addEventListener('mouseleave', () => {
            stopBtn.style.transform = 'translateY(0)';
            stopBtn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        });
    }
    
    // Botão de estatísticas
    const statsBtn = document.getElementById('whisk-show-stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            showDetailedStatistics();
        });
        
        statsBtn.addEventListener('mouseenter', () => {
            statsBtn.style.background = '#e8eaed';
            statsBtn.style.transform = 'translateY(-1px)';
        });
        
        statsBtn.addEventListener('mouseleave', () => {
            statsBtn.style.background = '#f8f9fa';
            statsBtn.style.transform = 'translateY(0)';
        });
    }
    
    // REMOVIDO: Listeners de download de imagens

    // Configurar funcionalidade de localizar e substituir
    setupWhiskFindReplaceListeners();
}

// Alternar visibilidade da interface
function toggleWhiskInterface() {
    const interface = document.getElementById('whisk-automator-interface');
    const toggleButton = document.getElementById('whisk-automator-toggle');

    if (interface && toggleButton) {
        const isVisible = interface.style.right === '0px';
        const sidebarWidth = 500;

        if (isVisible) {
            // Fechar sidebar
            interface.style.right = `-${sidebarWidth}px`;

            // Restaurar página
            adjustPageForSidebar(false, sidebarWidth);

            // Mover botão toggle de volta
            toggleButton.style.right = '20px';
        } else {
            // Abrir sidebar
            interface.style.right = '0px';

            // Ajustar página
            adjustPageForSidebar(true, sidebarWidth);

            // Mover botão toggle junto com a sidebar
            toggleButton.style.right = `${sidebarWidth + 20}px`;
        }
    }
}

// Ajustar elementos da página quando sidebar abre/fecha
function adjustPageForSidebar(isOpen, sidebarWidth) {
    const body = document.body;
    const htmlElement = document.documentElement;

    // Selectors para elementos que precisam ser ajustados
    const header = document.querySelector('header.sc-9a417730-0, header.gESWFH');
    const mainContent = document.querySelector('.sc-6fe1c1c9-3, main, [role="main"]');
    const imageGrid = document.querySelector('.sc-7165b472-0, .sc-6ace6b2a-0');

    if (isOpen) {
        // Adicionar classes para identificar que sidebar está aberta
        htmlElement.classList.add('whisk-automator-active');
        body.classList.add('whisk-automator-open');

        // Adicionar transição suave
        body.style.transition = 'margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        // Ajustar body
        body.style.marginRight = `${sidebarWidth}px`;

        // Ajustar apenas o elemento específico do header (links e botões à direita)
        const headerRightSection = document.querySelector('.sc-9a417730-3, .efEjXB');
        if (headerRightSection) {
            headerRightSection.style.transition = 'margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            headerRightSection.style.marginRight = `${sidebarWidth + 20}px`;
        }

        // Ajustar conteúdo principal
        if (mainContent) {
            mainContent.style.transition = 'margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.marginRight = `${sidebarWidth}px`;
        }

        // Ajustar container secundário - redimensionar para caber no espaço disponível
        const secondaryWrapper = document.querySelector('.sc-6fe1c1c9-2');
        if (secondaryWrapper) {
            secondaryWrapper.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            secondaryWrapper.style.width = `calc(100% - ${sidebarWidth}px)`;
            secondaryWrapper.style.maxWidth = `calc(100vw - ${sidebarWidth}px)`;
        }

        // Ajustar containers de grid - redimensionar para caber
        const gridContainers = document.querySelectorAll('.sc-7165b472-0, .sc-6ace6b2a-0, .sc-af1d3a84-0, .sc-b05ab5a6-0');
        gridContainers.forEach(container => {
            container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            container.style.maxWidth = `calc(100vw - ${sidebarWidth + 40}px)`;
            container.style.width = '100%';
        });

        // Ajustar campo de entrada de prompt - mover apenas um pouco para não ficar coberto
        const promptInputContainer = document.querySelector('.sc-18deeb1d-0, [class*="prompt-input"]');
        if (promptInputContainer) {
            promptInputContainer.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            // Mover apenas 30px para a esquerda - o suficiente para não ficar coberto
            promptInputContainer.style.transform = 'translateX(-30px)';
        }

        // Ajustar Whisk Downloader (outra extensão) - mover levemente para não interferir
        const whiskDownloader = document.getElementById('whisk-downloader-container');
        if (whiskDownloader) {
            whiskDownloader.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            whiskDownloader.style.transform = 'translateX(-30px)';
        }

        // Ajustar menus de hover das imagens
        const hoverMenus = document.querySelectorAll('.show_on_hover, .sc-7e4f5fb9-1, .sc-d17917c8-0, .sc-a74e00b7-1');
        hoverMenus.forEach(menu => {
            menu.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        // Prevenir scroll horizontal
        htmlElement.style.overflowX = 'hidden';
        body.style.overflowX = 'hidden';

        console.log('✅ Página ajustada para sidebar aberta');
    } else {
        // Remover classes
        htmlElement.classList.remove('whisk-automator-active');
        body.classList.remove('whisk-automator-open');

        // Restaurar body
        body.style.marginRight = '0px';

        // Restaurar apenas o elemento específico do header
        const headerRightSection = document.querySelector('.sc-9a417730-3, .efEjXB');
        if (headerRightSection) {
            headerRightSection.style.marginRight = '';
            headerRightSection.style.transition = '';
        }

        // Restaurar conteúdo principal
        if (mainContent) {
            mainContent.style.marginRight = '0px';
        }

        // Restaurar wrappers de imagens
        const secondaryWrapper = document.querySelector('.sc-6fe1c1c9-2');
        if (secondaryWrapper) {
            secondaryWrapper.style.width = '';
            secondaryWrapper.style.maxWidth = '';
        }

        // Restaurar containers de grid
        const gridContainers = document.querySelectorAll('.sc-7165b472-0, .sc-6ace6b2a-0, .sc-af1d3a84-0, .sc-b05ab5a6-0');
        gridContainers.forEach(container => {
            container.style.maxWidth = '';
            container.style.width = '';
        });

        // Restaurar campo de entrada de prompt
        const promptInputContainer = document.querySelector('.sc-18deeb1d-0, [class*="prompt-input"]');
        if (promptInputContainer) {
            promptInputContainer.style.transform = '';
        }

        // Restaurar Whisk Downloader
        const whiskDownloader = document.getElementById('whisk-downloader-container');
        if (whiskDownloader) {
            whiskDownloader.style.transform = '';
        }

        // Restaurar scroll
        setTimeout(() => {
            htmlElement.style.overflowX = '';
            body.style.overflowX = '';
        }, 400);

        console.log('✅ Página restaurada');
    }
}

// Analisar prompts inseridos
function analyzeWhiskPrompts() {
    const input = document.getElementById('whisk-prompts-input');
    if (!input || !input.value.trim()) {
        showWhiskStatus('⚠️ Por favor, insira prompts para analisar.', 'warning');
        return;
    }
    
    const prompts = parseWhiskPrompts(input.value);
    if (prompts.length === 0) {
        showWhiskStatus('❌ Nenhum prompt válido encontrado.', 'error');
        return;
    }
    
    whiskQueue = prompts;
    renderWhiskPromptsList(prompts);
    showWhiskStatus(`✅ ${prompts.length} prompts analisados com sucesso!`, 'success');
    
    // Mostrar seção de informações fixas
    document.getElementById('whisk-info-section').style.display = 'block';
    
    // Mostrar controles de automação
    document.getElementById('whisk-automation-controls').style.display = 'block';
    document.getElementById('whisk-total-count').textContent = prompts.length;
    document.getElementById('whisk-total-count-progress').textContent = prompts.length;
    
    // Mostrar estatísticas
    updatePromptStatistics();
}

// Parsear prompts do texto inserido
function parseWhiskPrompts(rawText) {
    const prompts = [];

    // Dividir por quebras duplas (parágrafos)
    const blocks = rawText.split(/\n\s*\n/).filter(block => block.trim() !== '');

    for (const block of blocks) {
        const content = block.trim();
        if (content) {
            // Usar todo o bloco como prompt completo (sem dividir título)
            // O título é apenas um preview dos primeiros 50 caracteres
            prompts.push({
                title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                prompt: content  // Todo o conteúdo, incluindo primeira linha
            });
        }
    }

    return prompts;
}

// Renderizar lista de prompts
function renderWhiskPromptsList(prompts) {
    const container = document.getElementById('whisk-prompts-container');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    prompts.forEach((prompt, index) => {
        const promptDiv = document.createElement('div');
        promptDiv.id = `whisk-prompt-${index}`;
        promptDiv.style.cssText = `
            padding: 24px;
            border: 1px solid #e8eaed;
            border-radius: 18px;
            margin-bottom: 20px;
            background: #ffffff;
            transition: all 0.3s ease;
            box-shadow: 0 2px 16px rgba(0,0,0,0.08);
            position: relative;
            cursor: pointer;
        `;
        
        // Adicionar hover effect
        promptDiv.addEventListener('mouseenter', () => {
            promptDiv.style.transform = 'translateY(-2px)';
            promptDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            promptDiv.style.borderColor = '#fbbc04';
        });
        
        promptDiv.addEventListener('mouseleave', () => {
            promptDiv.style.transform = 'translateY(0)';
            promptDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            promptDiv.style.borderColor = '#e8eaed';
        });
        
        promptDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <div style="color: #202124; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${prompt.prompt.substring(0, 200)}${prompt.prompt.length > 200 ? '...' : ''}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #5f6368;">
                        <span id="whisk-skip-text-${index}">Pular</span>
                        <label class="switch" style="
                            position: relative;
                            display: inline-block;
                            width: 44px;
                            height: 24px;
                            cursor: pointer;
                        ">
                            <input type="checkbox" id="whisk-skip-${index}" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="
                                position: absolute;
                                cursor: pointer;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background-color: #dadce0;
                                transition: .3s;
                                border-radius: 24px;
                            "></span>
                        </label>
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div id="whisk-prompt-status-${index}" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    color: #5f6368;
                    font-weight: 500;
                ">
                    <span style="
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background: #dadce0;
                        display: inline-block;
                    "></span>
                    Aguardando
                </div>
                <button id="whisk-send-individual-${index}" style="
                    background: #fbbc04;
                    color: #000000;
                    border: none;
                    border-radius: 16px;
                    padding: 12px 24px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 16px rgba(251, 188, 4, 0.3);
                " title="Gerar imagem individualmente">
                    🎨 GERAR IMAGEM
                </button>
            </div>
        `;
        container.appendChild(promptDiv);
        
        // Adicionar event listeners para os novos controles
        const skipCheckbox = document.getElementById(`whisk-skip-${index}`);
        const individualButton = document.getElementById(`whisk-send-individual-${index}`);
        const slider = promptDiv.querySelector('.slider');
        
        if (skipCheckbox) {
            skipCheckbox.addEventListener('change', () => {
                updateSkipStatus(index, skipCheckbox.checked);
                
                // Atualizar visual do switch e texto
                const skipText = document.getElementById(`whisk-skip-text-${index}`);
                if (skipCheckbox.checked) {
                    slider.style.background = '#fbbc04';
                    promptDiv.style.opacity = '0.6';
                    individualButton.style.background = '#fbbc04';
                    if (skipText) {
                        skipText.textContent = 'PULADO';
                        skipText.style.color = '#fbbc04';
                        skipText.style.fontWeight = '700';
                    }
                } else {
                    slider.style.background = '#dadce0';
                    promptDiv.style.opacity = '1';
                    individualButton.style.background = '#fbbc04';
                    if (skipText) {
                        skipText.textContent = 'Pular';
                        skipText.style.color = '#5f6368';
                        skipText.style.fontWeight = '400';
                    }
                }
            });
        }
        
        if (individualButton) {
            individualButton.addEventListener('click', () => {
                sendIndividualPrompt(index);
            });
            
            // Adicionar hover effect
            individualButton.addEventListener('mouseenter', () => {
                individualButton.style.transform = 'translateY(-1px)';
                individualButton.style.boxShadow = '0 2px 8px rgba(251, 188, 4, 0.3)';
            });
            
            individualButton.addEventListener('mouseleave', () => {
                individualButton.style.transform = 'translateY(0)';
                individualButton.style.boxShadow = 'none';
            });
        }
    });
}

// Iniciar automação do Whisk
async function startWhiskAutomation() {
    if (isWhiskAutomating || whiskQueue.length === 0) return;
    
    isWhiskAutomating = true;
    currentWhiskIndex = 0;
    
    const delaySeconds = parseInt(document.getElementById('whisk-delay-input').value) || 2;
    const delayMs = delaySeconds * 1000;
    
    // Resetar status de todos os prompts
    whiskQueue.forEach((_, index) => {
        updatePromptStatus(index, 'aguardando');
    });
    
    // Atualizar interface
    document.getElementById('whisk-start-btn').style.display = 'none';
    document.getElementById('whisk-stop-btn').style.display = 'block';
    document.getElementById('whisk-progress').style.display = 'block';
    
    showWhiskStatus('🚀 Automação iniciada!', 'info');
    
    for (let i = 0; i < whiskQueue.length; i++) {
        if (!isWhiskAutomating) break;
        
        // Verificar se o prompt deve ser pulado ou já foi enviado individualmente
        if (skippedPrompts.has(i)) {
            console.log(`⏭️ Pulando prompt ${i}: ${whiskQueue[i].title} (marcado para pular)`);
            updatePromptStatus(i, 'aguardando'); // Manter status original
            continue;
        }
        
        if (individuallySentPrompts.has(i)) {
            console.log(`⏭️ Pulando prompt ${i}: ${whiskQueue[i].title} (já enviado individualmente)`);
            updatePromptStatus(i, 'concluido'); // Manter como concluído
            continue;
        }
        
        currentWhiskIndex = i;
        const promptData = whiskQueue[i];
        
        // Atualizar progresso
        document.getElementById('whisk-current-prompt').textContent = promptData.title;
        document.getElementById('whisk-progress-count').textContent = i + 1;
        
        // Atualizar contador de progresso
        const progressCountElement = document.getElementById('whisk-progress-count');
        if (progressCountElement) {
            progressCountElement.textContent = i + 1;
        }
        
        // Atualizar barra de progresso visual
        const progressBar = document.getElementById('whisk-progress-bar');
        const progressPercentage = document.getElementById('whisk-progress-percentage');
        if (progressBar && progressPercentage) {
            const percentage = Math.round(((i + 1) / whiskQueue.length) * 100);
            progressBar.style.width = percentage + '%';
            progressPercentage.textContent = percentage + '%';
        }
        
        try {
            await processWhiskPrompt(promptData);
            
            if (i < whiskQueue.length - 1 && isWhiskAutomating) {
                showWhiskStatus(`⏳ Aguardando ${delaySeconds} segundos...`, 'info');
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        } catch (error) {
            console.error('❌ Erro ao processar prompt:', error);
            updatePromptStatus(i, 'erro');
            showWhiskStatus(`❌ Erro ao processar: ${promptData.title}`, 'error');
        }
    }
    
    stopWhiskAutomation();
    showWhiskStatus(`🎉 Automação concluída! ${currentWhiskIndex + 1} prompts processados.`, 'success');
}

// Processar um prompt individual
async function processWhiskPrompt(promptData) {
    console.log(`🎯 Processando prompt: ${promptData.title}`);
    
    // Atualizar status do prompt
    updatePromptStatus(currentWhiskIndex, 'processando');
    
    // Encontrar elementos do Whisk
    let textArea = null;
    let submitButton = document.querySelector(WHISK_CONFIG.submitButtonSelector);
    
    // Tentar encontrar o campo de texto com qualquer um dos seletores
    console.log(`🔍 Tentando encontrar campo com seletores:`, WHISK_CONFIG.textAreaSelectors);
    for (const selector of WHISK_CONFIG.textAreaSelectors) {
        console.log(`🔍 Testando seletor: ${selector}`);
        textArea = document.querySelector(selector);
        if (textArea) {
            console.log(`✅ Campo de texto encontrado com seletor: ${selector}`);
            console.log(`✅ Elemento encontrado:`, textArea);
            break;
        } else {
            console.log(`❌ Seletor não funcionou: ${selector}`);
        }
    }
    
    // Debug: verificar se o campo existe
    console.log(`🔍 Campo de texto encontrado:`, textArea);
    
    if (!textArea) {
        // Tentar encontrar qualquer textarea na página
        const allTextareas = document.querySelectorAll('textarea');
        console.log(`🔍 Todas as textareas na página:`, allTextareas);
        
        // Tentar aguardar um pouco e procurar novamente
        console.log(`⏳ Aguardando 2 segundos e tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        for (const selector of WHISK_CONFIG.textAreaSelectors) {
            console.log(`🔍 Segunda tentativa com seletor: ${selector}`);
            textArea = document.querySelector(selector);
            if (textArea) {
                console.log(`✅ Campo encontrado na segunda tentativa com: ${selector}`);
                console.log(`✅ Elemento encontrado na segunda tentativa:`, textArea);
                break;
            } else {
                console.log(`❌ Segunda tentativa falhou para: ${selector}`);
            }
        }
        
        if (!textArea) {
            throw new Error('Campo de texto do Whisk não encontrado');
        }
    }
    
    // Se não encontrar o botão com o seletor principal, tentar alternativas
    if (!submitButton) {
        const alternativeSelectors = [
            'i[class*="arrow_forward"]',
            '[class*="arrow_forward"]',
            'button i[class*="arrow_forward"]',
            'i.sc-95c4f607-0.bgdmBR.google-symbols.sc-bece3008-1.kyBkMG'
        ];
        
        for (const selector of alternativeSelectors) {
            const found = document.querySelector(selector);
            if (found) {
                submitButton = found;
                break;
            }
        }
    }
    
    if (!submitButton) {
        throw new Error('Botão de enviar do Whisk não encontrado - Verifique se está na página correta');
    }
    
    // Enviar apenas o conteúdo bruto do prompt (sem título)
    await fillWhiskField(textArea, promptData.prompt);

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clicar no botão de enviar
    submitButton.click();
    
    console.log(`✅ Prompt enviado: ${promptData.title}`);
    
    // Atualizar status do prompt
    updatePromptStatus(currentWhiskIndex, 'enviado');
    
    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Atualizar status final
    updatePromptStatus(currentWhiskIndex, 'concluido');
}

// Preencher campo do Whisk
async function fillWhiskField(element, value) {
    if (!element) throw new Error('Elemento não fornecido');
    
    // Focar no elemento
    element.focus();
    element.click();
    
    // Limpar o campo completamente
    element.value = '';
    
    // Aguardar um pouco
    await new Promise(r => setTimeout(r, 100));
    
    // Definir o novo valor
    element.value = value;
    
    // Disparar eventos para simular digitação real
    const events = [
        new Event('input', { bubbles: true, cancelable: true }),
        new Event('change', { bubbles: true, cancelable: true }),
        new Event('keydown', { bubbles: true, cancelable: true }),
        new Event('keypress', { bubbles: true, cancelable: true }),
        new Event('keyup', { bubbles: true, cancelable: true })
    ];
    
    for (const event of events) {
        element.dispatchEvent(event);
        await new Promise(r => setTimeout(r, 10));
    }
    
    // Aguardar um pouco mais
    await new Promise(r => setTimeout(r, 200));
    
    // Remover foco
    element.blur();
}

// Parar automação
function stopWhiskAutomation() {
    isWhiskAutomating = false;
    
    // Restaurar interface
    document.getElementById('whisk-start-btn').style.display = 'block';
    document.getElementById('whisk-stop-btn').style.display = 'none';
    document.getElementById('whisk-progress').style.display = 'none';
    
    // Resetar barra de progresso
    const progressBar = document.getElementById('whisk-progress-bar');
    const progressPercentage = document.getElementById('whisk-progress-percentage');
    if (progressBar && progressPercentage) {
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0%';
    }
}

// Limpar interface
function clearWhiskInterface() {
    const input = document.getElementById('whisk-prompts-input');
    const infoSection = document.getElementById('whisk-info-section');
    const automationControls = document.getElementById('whisk-automation-controls');
    const progress = document.getElementById('whisk-progress');
    const status = document.getElementById('whisk-status');
    
    if (input) input.value = '';
    if (infoSection) infoSection.style.display = 'none';
    if (automationControls) automationControls.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (status) status.style.display = 'none';
    
    // Resetar barra de progresso
    const progressBar = document.getElementById('whisk-progress-bar');
    const progressPercentage = document.getElementById('whisk-progress-percentage');
    if (progressBar && progressPercentage) {
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0%';
    }
    
    // Resetar status dos prompts
    whiskQueue.forEach((_, index) => {
        updatePromptStatus(index, 'aguardando');
        
        // Resetar switch de pular
        const skipCheckbox = document.getElementById(`whisk-skip-${index}`);
        const slider = document.querySelector(`#whisk-prompt-${index} .slider`);
        const skipText = document.getElementById(`whisk-skip-text-${index}`);
        if (skipCheckbox) {
            skipCheckbox.checked = false;
        }
        if (slider) {
            slider.style.background = '#dadce0';
        }
        if (skipText) {
            skipText.textContent = 'Pular';
            skipText.style.color = '#5f6368';
            skipText.style.fontWeight = '400';
        }
        
        // Resetar botão individual
        const individualButton = document.getElementById(`whisk-send-individual-${index}`);
        if (individualButton) {
            individualButton.style.background = '#fbbc04';
            individualButton.textContent = '🎨 GERAR IMAGEM';
            individualButton.disabled = false;
            individualButton.style.cursor = 'pointer';
        }
        
        // Resetar opacidade do prompt
        const promptDiv = document.getElementById(`whisk-prompt-${index}`);
        if (promptDiv) {
            promptDiv.style.opacity = '1';
        }
    });
    
    whiskQueue = [];
    isWhiskAutomating = false;
    currentWhiskIndex = 0;
    skippedPrompts.clear();
    individuallySentPrompts.clear();
    
    showWhiskStatus('🗑️ Interface limpa!', 'info');
}

// Atualizar status de um prompt específico
function updatePromptStatus(index, status) {
    const statusElement = document.getElementById(`whisk-prompt-status-${index}`);
    if (!statusElement) return;
    
    const statusConfig = {
        'aguardando': { text: 'Aguardando', color: '#dadce0', bgColor: '#f8f9fa' },
        'processando': { text: 'Processando...', color: '#fbbc04', bgColor: '#fef7e0' },
        'enviado': { text: 'Enviado', color: '#4285f4', bgColor: '#e8f0fe' },
        'concluido': { text: 'SUCESSO', color: '#34a853', bgColor: '#e6f4ea' },
        'erro': { text: 'Erro', color: '#ea4335', bgColor: '#fce8e6' }
    };
    
    const config = statusConfig[status] || statusConfig['aguardando'];
    
    if (status === 'concluido') {
        // Para prompts concluídos, mostrar botão de sucesso igual ao VEO3
        statusElement.innerHTML = `
            <button style="
                background: #34a853;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: default;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                <span style="font-size: 14px;">✓</span>
                ${config.text}
            </button>
        `;
    } else {
        // Para outros status, mostrar indicador simples
        statusElement.innerHTML = `
            <span style="
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: ${config.color};
                display: inline-block;
            "></span>
            ${config.text}
        `;
        statusElement.style.color = config.color;
    }
}

// Atualizar status de skip de um prompt
function updateSkipStatus(index, isSkipped) {
    if (isSkipped) {
        skippedPrompts.add(index);
        console.log(`🎯 Prompt ${index} marcado para pular`);
    } else {
        skippedPrompts.delete(index);
        console.log(`🎯 Prompt ${index} desmarcado para pular`);
    }
    
    // Atualizar estatísticas
    updatePromptStatistics();
}

// Enviar prompt individualmente
async function sendIndividualPrompt(index) {
    if (isWhiskAutomating) {
        showWhiskStatus('⚠️ Aguarde a automação atual terminar', 'warning');
        return;
    }
    
    const promptData = whiskQueue[index];
    if (!promptData) {
        showWhiskStatus('❌ Prompt não encontrado', 'error');
        return;
    }
    
    try {
        showWhiskStatus(`🚀 Enviando prompt individual: ${promptData.title}`, 'info');
        
        // Atualizar status para processando
        updatePromptStatus(index, 'processando');
        
        // Processar o prompt
        await processWhiskPrompt(promptData);
        
        // Marcar como enviado individualmente
        individuallySentPrompts.add(index);
        
        // Atualizar status final
        updatePromptStatus(index, 'concluido');
        
        // Desabilitar botão individual
        const individualButton = document.getElementById(`whisk-send-individual-${index}`);
        if (individualButton) {
            individualButton.style.background = '#34a853';
            individualButton.textContent = '✓ GERADO';
            individualButton.disabled = true;
            individualButton.style.cursor = 'default';
        }
        
        showWhiskStatus(`✅ Prompt individual enviado: ${promptData.title}`, 'success');
        
        // Atualizar estatísticas
        updatePromptStatistics();
        
    } catch (error) {
        console.error('❌ Erro ao enviar prompt individual:', error);
        updatePromptStatus(index, 'erro');
        showWhiskStatus(`❌ Erro ao enviar prompt individual: ${promptData.title}`, 'error');
    }
}

// Atualizar estatísticas dos prompts
function updatePromptStatistics() {
    const totalPrompts = whiskQueue.length;
    const skippedCount = skippedPrompts.size;
    const individuallySentCount = individuallySentPrompts.size;
    const availableForAutomation = totalPrompts - skippedCount - individuallySentCount;
    
    // Atualizar contador total
    const totalCountElement = document.getElementById('whisk-total-count');
    const totalCountProgressElement = document.getElementById('whisk-total-count-progress');
    
    if (totalCountElement) {
        totalCountElement.textContent = availableForAutomation;
    }
    
    if (totalCountProgressElement) {
        totalCountProgressElement.textContent = availableForAutomation;
    }
    
    // Mostrar estatísticas no status se houver prompts pulados ou enviados individualmente
    if (skippedCount > 0 || individuallySentCount > 0) {
        let statsMessage = `📊 Estatísticas: `;
        if (skippedCount > 0) {
            statsMessage += `${skippedCount} pulados, `;
        }
        if (individuallySentCount > 0) {
            statsMessage += `${individuallySentCount} enviados individualmente, `;
        }
        statsMessage += `${availableForAutomation} disponíveis para automação`;
        
        showWhiskStatus(statsMessage, 'info');
    }
}

// Mostrar estatísticas detalhadas
function showDetailedStatistics() {
    const totalPrompts = whiskQueue.length;
    const skippedCount = skippedPrompts.size;
    const individuallySentCount = individuallySentPrompts.size;
    const availableForAutomation = totalPrompts - skippedCount - individuallySentCount;
    
    let statsMessage = `📊 ESTATÍSTICAS DETALHADAS:\n\n`;
    statsMessage += `• Total de prompts: ${totalPrompts}\n`;
    statsMessage += `• Marcados para pular: ${skippedCount}\n`;
    statsMessage += `• Enviados individualmente: ${individuallySentCount}\n`;
    statsMessage += `• Disponíveis para automação: ${availableForAutomation}\n\n`;
    
    if (skippedCount > 0) {
        statsMessage += `📝 PROMPTS PULADOS:\n`;
        skippedPrompts.forEach(index => {
            statsMessage += `  - ${whiskQueue[index].title}\n`;
        });
        statsMessage += `\n`;
    }
    
    if (individuallySentCount > 0) {
        statsMessage += `📤 PROMPTS ENVIADOS INDIVIDUALMENTE:\n`;
        individuallySentPrompts.forEach(index => {
            statsMessage += `  - ${whiskQueue[index].title}\n`;
        });
    }
    
    showWhiskStatus(statsMessage, 'info');
}

// Mostrar status
function showWhiskStatus(message, type = 'info') {
    const statusDiv = document.getElementById('whisk-status');
    if (!statusDiv) return;
    
    const colors = {
        info: '#4285f4',
        success: '#34a853',
        warning: '#fbbc04',
        error: '#ea4335'
    };
    
    // Verificar se é uma mensagem longa (estatísticas)
    const isLongMessage = message.includes('\n') || message.length > 100;
    
    statusDiv.style.cssText = `
        padding: ${isLongMessage ? '16px' : '10px'};
        border-radius: 8px;
        font-size: ${isLongMessage ? '13px' : '14px'};
        text-align: ${isLongMessage ? 'left' : 'center'};
        background: ${colors[type]}15;
        color: ${colors[type]};
        border: 1px solid ${colors[type]}30;
        display: block;
        white-space: ${isLongMessage ? 'pre-line' : 'normal'};
        max-width: 100%;
        line-height: 1.4;
    `;
    
    if (isLongMessage) {
        statusDiv.innerHTML = message;
    } else {
        statusDiv.textContent = message;
    }
    
    // Auto-hide após tempo diferente baseado no tipo de mensagem
    const hideDelay = isLongMessage ? 10000 : 5000; // 10s para estatísticas, 5s para outras
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, hideDelay);
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhiskAutomator);
} else {
    initializeWhiskAutomator();
}

// =====================================================
// FUNÇÕES REMOVIDAS - DOWNLOAD DE IMAGENS
// =====================================================

// REMOVIDO: Download de imagens
// let detectedWhiskImages = [];
// let selectedImages = new Set();

// REMOVIDO: Função de download
// async function detectAndShowImages() {
//     console.log("🔍 Detectando imagens do Whisk...");
//     showWhiskStatus('🔍 Detectando imagens...', 'info');
//     
//     try {
//         // Detectar imagens na página
//         detectedWhiskImages = await detectWhiskImages();
//         
//         if (detectedWhiskImages.length === 0) {
//             showWhiskStatus('❌ Nenhuma imagem detectada. Gere algumas imagens primeiro!', 'warning');
//             return;
//         }
//         
//         // Mostrar interface de imagens
//         renderDetectedImages();
//         showWhiskStatus(`✅ ${detectedWhiskImages.length} imagens detectadas!`, 'success');
//         
//     } catch (error) {
//         console.error('❌ Erro ao detectar imagens:', error);
//         showWhiskStatus('❌ Erro ao detectar imagens', 'error');
//     }
// }

// REMOVIDO: Função de download

// REMOVIDO: Função de download
// function isValidWhiskImage(img) {
//     if (!img || !img.src) return false;
//     
//     // Verificar se imagem está visível
//     if (img.offsetParent === null) return false;
//     
//     // Verificar tamanho mínimo (evitar ícones pequenos)
//     if (img.naturalWidth < 100 || img.naturalHeight < 100) return false;
//     
//     // Verificar se parece ser uma imagem gerada
//     const src = img.src.toLowerCase();
//     
//     return (
//         src.includes('googleusercontent') ||
//         src.includes('blob:') ||
//         img.alt?.toLowerCase().includes('generated') ||
//         img.closest('[data-testid*="image"]') !== null
//     );
// }

// REMOVIDO: Função de download
// async function findAssociatedPrompt(img) {
//     // Estratégia 1: Procurar no histórico de prompts enviados
//     if (whiskQueue.length > 0) {
//         const recentPrompts = whiskQueue.slice(-5); // Últimos 5 prompts
//         if (recentPrompts.length > 0) {
//             return recentPrompts[recentPrompts.length - 1].prompt;
//         }
//     }
//     
//     // Estratégia 2: Procurar texto próximo à imagem
//     let container = img.closest('[class*="result"], [class*="card"], [class*="item"]');
//     if (!container) container = img.parentElement;
//     
//     if (container) {
//         const textElements = container.querySelectorAll('p, span, div');
//         for (const element of textElements) {
//             const text = element.textContent?.trim();
//             if (text && text.length > 20 && text.length < 200) {
//                 return text;
//             }
//         }
//     }
//     
//     // Estratégia 3: Usar último prompt da sessão
//     if (typeof whiskDownloadManager !== 'undefined') {
//         const recentPrompts = Array.from(promptHistory.keys()).slice(-3);
//         if (recentPrompts.length > 0) {
//             return recentPrompts[0];
//         }
//     }
//     
//     return null;
// }

// REMOVIDO: Função de download
// function renderDetectedImages() {
//     const noImagesDiv = document.getElementById('whisk-no-images');
//     const detectedImagesDiv = document.getElementById('whisk-detected-images');
//     const imagesList = document.getElementById('whisk-images-list');
//     
//     if (!imagesList) return;
    
//     // Mostrar interface de imagens
//     noImagesDiv.style.display = 'none';
//     detectedImagesDiv.style.display = 'block';
    
//     // Limpar lista
//     imagesList.innerHTML = '';
//     selectedImages.clear();
    
//     // Renderizar cada imagem
//     detectedWhiskImages.forEach((imageData, index) => {
//         const imageItem = document.createElement('div');
//         imageItem.style.cssText = `
//             display: flex;
//             align-items: center;
//             gap: 12px;
//             padding: 12px;
//             border: 1px solid #e8eaed;
//             border-radius: 8px;
//             margin-bottom: 8px;
//             background: #ffffff;
//             transition: all 0.3s ease;
//         `;
        
//         // Criar thumbnail da imagem
//         const thumbnail = document.createElement('img');
//         thumbnail.src = imageData.src;
//         thumbnail.style.cssText = `
//             width: 60px;
//             height: 60px;
//             object-fit: cover;
//             border-radius: 6px;
//             border: 2px solid #e8eaed;
//         `;
        
//         // Criar checkbox
//         const checkbox = document.createElement('input');
//         checkbox.type = 'checkbox';
//         checkbox.id = `image-${index}`;
//         checkbox.style.cssText = `
//             width: 18px;
//             height: 18px;
//             cursor: pointer;
//         `;
        
//         // Criar informações da imagem
//         const info = document.createElement('div');
//         info.style.cssText = `
//             flex: 1;
//             min-width: 0;
//         `;
        
//         const promptText = imageData.prompt.length > 60 ? 
//             imageData.prompt.substring(0, 60) + '...' : 
//             imageData.prompt;
            
//         info.innerHTML = `
//             <div style="font-weight: 600; color: #000000; margin-bottom: 4px; font-size: 13px;">
//                 Imagem ${index + 1}
//             </div>
//             <div style="color: #5f6368; font-size: 12px; line-height: 1.4;">
//                 ${promptText}
//             </div>
//         `;
        
//         // Criar botão de download individual
//         const downloadBtn = document.createElement('button');
//         downloadBtn.style.cssText = `
//             background: #34a853;
//             color: #ffffff;
//             border: none;
//             border-radius: 6px;
//             padding: 6px 10px;
//             font-size: 11px;
//             font-weight: 600;
//             cursor: pointer;
//             transition: all 0.3s ease;
//         `;
//         downloadBtn.textContent = '📥';
//         downloadBtn.title = 'Download individual';
//         
//         // Event listeners
//         checkbox.addEventListener('change', () => {
//             if (checkbox.checked) {
//                 selectedImages.add(index);
//                 imageItem.style.borderColor = '#fbbc04';
//                 imageItem.style.backgroundColor = '#fef7e0';
//             } else {
//                 selectedImages.delete(index);
//                 imageItem.style.borderColor = '#e8eaed';
//                 imageItem.style.backgroundColor = '#ffffff';
//             }
//             updateSelectedCount();
//         });
        
//         downloadBtn.addEventListener('click', () => {
//             downloadSingleImage(imageData);
//         });
        
//         // Adicionar elementos
//         imageItem.appendChild(checkbox);
//         imageItem.appendChild(thumbnail);
//         imageItem.appendChild(info);
//         imageItem.appendChild(downloadBtn);
//         imagesList.appendChild(imageItem);
//     });
//     
//     updateSelectedCount();
// }

// // Selecionar/deselecionar todas as imagens
// function selectAllImages() {
//     const checkboxes = document.querySelectorAll('[id^="image-"]');
//     const selectAll = selectedImages.size === 0 || selectedImages.size < detectedWhiskImages.length;
//     
//     checkboxes.forEach((checkbox, index) => {
//         checkbox.checked = selectAll;
        
//         const imageItem = checkbox.parentElement;
//         if (selectAll) {
//             selectedImages.add(index);
//             imageItem.style.borderColor = '#fbbc04';
//             imageItem.style.backgroundColor = '#fef7e0';
//         } else {
//             selectedImages.clear();
//             imageItem.style.borderColor = '#e8eaed';
//             imageItem.style.backgroundColor = '#ffffff';
//         }
//     });
//     
//     updateSelectedCount();
// }

// // Atualizar contador de selecionadas
// function updateSelectedCount() {
//     const countElement = document.getElementById('whisk-selected-count');
//     if (countElement) {
//         countElement.textContent = `${selectedImages.size} selecionadas`;
//     }
//     
//     // Atualizar botão de selecionar todas
//     const selectAllBtn = document.getElementById('whisk-select-all-images');
//     if (selectAllBtn) {
//         selectAllBtn.textContent = selectedImages.size === detectedWhiskImages.length ? 
//             '☐ Desmarcar Todas' : '☑️ Selecionar Todas';
//     }
// }

// // Download de imagens selecionadas
// async function downloadSelectedImages() {
//     if (selectedImages.size === 0) {
//         showWhiskStatus('⚠️ Nenhuma imagem selecionada', 'warning');
//         return;
//     }
//     
//     showWhiskStatus(`📥 Baixando ${selectedImages.size} imagens...`, 'info');
//     
//     let downloaded = 0;
//     for (const index of selectedImages) {
//         const imageData = detectedWhiskImages[index];
//         if (imageData) {
//             await downloadSingleImage(imageData, false);
//             downloaded++;
//             
//             // Aguardar um pouco entre downloads
//             await new Promise(resolve => setTimeout(resolve, 500));
//         }
//     }
    
//     showWhiskStatus(`✅ ${downloaded} imagens baixadas com sucesso!`, 'success');
// }

// // Download de uma única imagem
// async function downloadSingleImage(imageData, showStatus = true) {
//     try {
//         if (showStatus) {
//             showWhiskStatus('📥 Baixando imagem...', 'info');
//         }
        
//         // Simular hover na imagem para revelar botão de download
//         await simulateHoverForDownload(imageData.element);
//         
//         // Procurar botão de download
//         const downloadButton = await findDownloadButton(imageData.element);
//         
//         if (downloadButton) {
//             // Gerar nome personalizado
//             const customName = generateCustomFileName(imageData.prompt);
            
//             // Hook para interceptar download e renomear
//             interceptDownload(customName);
//             
//             // Clicar no botão de download
//             downloadButton.click();
//             
//             if (showStatus) {
//                 showWhiskStatus(`✅ Download iniciado: ${customName}`, 'success');
//             }
            
//         } else {
//             throw new Error('Botão de download não encontrado');
//         }
        
//     } catch (error) {
//         console.error('❌ Erro no download:', error);
//         if (showStatus) {
//             showWhiskStatus(`❌ Erro no download: ${error.message}`, 'error');
//         }
//     }
// }

// // Simular hover para revelar botão de download
// async function simulateHoverForDownload(imgElement) {
//     const container = imgElement.closest('div, article, section') || imgElement.parentElement;
//     
//     const hoverEvents = [
//         new MouseEvent('mouseenter', { bubbles: true }),
//         new MouseEvent('mouseover', { bubbles: true }),
//         new MouseEvent('mousemove', { bubbles: true })
//     ];
//     
//     hoverEvents.forEach(event => {
//         imgElement.dispatchEvent(event);
//         if (container) container.dispatchEvent(event);
//     });
//     
//     // Aguardar botões aparecerem
//     await new Promise(resolve => setTimeout(resolve, 300));
// }

// // Encontrar botão de download
// async function findDownloadButton(imgElement) {
//     const container = imgElement.closest('div, article, section') || imgElement.parentElement?.closest('div');
//     if (!container) return null;
//     
//     // Selectors para botões de download
//     const downloadSelectors = [
//         '[aria-label*="download" i]',
//         '[title*="download" i]',
//         '[aria-label*="baixar" i]',
//         '[title*="baixar" i]',
//         'button[aria-label*="Download"]',
//         'button[title*="Download"]',
//         '[data-testid*="download"]'
//     ];
//     
//     for (const selector of downloadSelectors) {
//         const button = container.querySelector(selector);
//         if (button && button.offsetParent !== null) {
//             return button;
//         }
//     }
    
//     // Procurar por botões que contém ícones de download
//     const allButtons = container.querySelectorAll('button, [role="button"]');
//     for (const button of allButtons) {
//         const hasDownloadIcon = button.innerHTML.includes('download') || 
//                               button.innerHTML.includes('arrow_downward') ||
//                               button.innerHTML.includes('save_alt');
//         
//         if (hasDownloadIcon && button.offsetParent !== null) {
//             return button;
//         }
//     }
//     
//     return null;
// }

// // Gerar nome de arquivo personalizado
// function generateCustomFileName(prompt) {
//     if (!prompt || prompt === 'Prompt não identificado') {
//         return `whisk_image_${Date.now()}.jpg`;
//     }
//     
//     // Limpar prompt para usar como nome
//     const cleanPrompt = prompt
//         .substring(0, 40) // Máximo 40 caracteres
//         .toLowerCase()
//         .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
//         .replace(/\s+/g, '_')     // Substitui espaços por underscore
//         .replace(/_+/g, '_')      // Remove underscores múltiplos
//         .replace(/^_|_$/g, '');   // Remove underscores do início e fim
    
//     return `${cleanPrompt || 'whisk_image'}.jpg`;
// }

// // Interceptar download para renomear arquivo
// function interceptDownload(customName) {
//     // Interceptar cliques em links de download
//     const originalCreateElement = document.createElement;
//     
//     document.createElement = function(tagName) {
//         const element = originalCreateElement.call(this, tagName);
//         
//         if (tagName.toLowerCase() === 'a') {
//             // Interceptar quando link for usado para download
//             const originalClick = element.click;
//             element.click = function() {
//                 if (this.download) {
//                     this.download = customName;
//                 }
//                 return originalClick.call(this);
//             };
//         }
//         
//         return element;
//     };
    
//     // Restaurar após 3 segundos
//     setTimeout(() => {
//         document.createElement = originalCreateElement;
//     }, 3000);
// }

// // =====================================================
// // FUNÇÕES DE DOWNLOAD REMOVIDAS - NÃO NECESSÁRIAS
// // =====================================================

// --- Find and Replace Functionality for Whisk (usando módulo compartilhado) ---

function setupWhiskFindReplaceListeners() {
    // Usar o módulo compartilhado FindReplaceManager
    if (typeof FindReplaceManager !== 'undefined') {
        whiskFindReplaceManager = new FindReplaceManager({
            textareaId: 'whisk-prompts-input',
            findInputId: 'whisk-find-input',
            replaceInputId: 'whisk-replace-input',
            findBarId: 'whisk-find-replace-bar',
            findPrevBtnId: 'whisk-find-prev-btn',
            findNextBtnId: 'whisk-find-next-btn',
            replaceBtnId: 'whisk-replace-btn',
            replaceAllBtnId: 'whisk-replace-all-btn',
            closeBtnId: 'whisk-close-find-btn',
            findCountId: 'whisk-find-count',
            toggleBtnId: 'whisk-find-replace-btn'
        });

        // Adicionar hover effects específicos do Whisk
        const findReplaceBtn = document.getElementById('whisk-find-replace-btn');
        if (findReplaceBtn) {
            findReplaceBtn.addEventListener('mouseenter', () => {
                findReplaceBtn.style.background = '#f8f9fa';
                findReplaceBtn.style.borderColor = '#fbbc04';
            });
            findReplaceBtn.addEventListener('mouseleave', () => {
                findReplaceBtn.style.background = '#ffffff';
                findReplaceBtn.style.borderColor = '#e8eaed';
            });
        }

        console.log("✅ Find & Replace Manager inicializado no Whisk Automator");
    } else {
        console.warn("⚠️ FindReplaceManager não está disponível");
    }
}

console.log("🎯 Whisk Automator: Carregado com sucesso!");
