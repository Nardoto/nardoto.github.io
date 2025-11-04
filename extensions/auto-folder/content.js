// Content Script - Automação CapCut AI Creator
// Este script é injetado nas páginas do CapCut

(function() {
    'use strict';

    // Aguardar o carregamento completo da página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutomation);
    } else {
        initAutomation();
    }

    function initAutomation() {
        createSidePanel();
    }

    // Criar painel lateral fixo
    function createSidePanel() {
        // Verificar se o painel já existe
        if (document.getElementById('capcut-automation-panel')) {
            return;
        }

        // Criar painel
        const panel = document.createElement('div');
        panel.id = 'capcut-automation-panel';
        panel.innerHTML = `
            <div class="creator-badge">CapCut Automation by Nardoto</div>

            <div class="input-section">
                <label for="script-input">Script:</label>
                <textarea id="script-input" placeholder="Cole seu script aqui..." rows="1"></textarea>
                <button id="expand-input-btn" class="expand-btn" title="Expandir campo">⤢</button>
            </div>

            <div class="word-counter" id="word-counter">
                <div class="counter-info">
                    <span class="counter-label">Palavras:</span>
                    <span class="counter-value" id="word-count">0</span>
                    <span class="counter-separator">/</span>
                    <span class="counter-max">1300</span>
                </div>
                <div class="counter-status" id="counter-status">
                    <span class="status-icon">ℹ️</span>
                    <span class="status-text">CapCut funciona melhor com até 1300 palavras</span>
                </div>
            </div>

            <div class="style-section">
                <label for="style-select">Estilo:</label>
                <select id="style-select">
                    <option value="Realistic Film" selected>Realistic Film</option>
                    <option value="Cartoon 3D">Cartoon 3D</option>
                    <option value="Movie">Movie</option>
                    <option value="Photograph">Photograph</option>
                    <option value="Whimsical">Whimsical</option>
                    <option value="Felt Dolls">Felt Dolls</option>
                    <option value="Crayon">Crayon</option>
                    <option value="Lovecraftian Horror">Lovecraftian Horror</option>
                    <option value="Urban Sketching">Urban Sketching</option>
                    <option value="Dark Deco">Dark Deco</option>
                    <option value="GTA 4">GTA 4</option>
                    <option value="Toon Shader">Toon Shader</option>
                    <option value="Sports Games">Sports Games</option>
                    <option value="Close-Up">Close-Up</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Noir Comic">Noir Comic</option>
                    <option value="Ink Watercolor">Ink Watercolor</option>
                    <option value="Aerial View">Aerial View</option>
                    <option value="Modern Realism">Modern Realism</option>
                    <option value="Futuristic">Futuristic</option>
                    <option value="Biblical">Biblical</option>
                    <option value="Fluffy 3D">Fluffy 3D</option>
                    <option value="Urban Dream">Urban Dream</option>
                    <option value="Dreamscape">Dreamscape</option>
                    <option value="Dynamic">Dynamic</option>
                    <option value="Cute Cartoon">Cute Cartoon</option>
                    <option value="Tiny World">Tiny World</option>
                    <option value="Claymation">Claymation</option>
                    <option value="90s Pixel">90s Pixel</option>
                    <option value="Low Poly">Low Poly</option>
                    <option value="Cross Stitch">Cross Stitch</option>
                    <option value="Epic Fantasy">Epic Fantasy</option>
                    <option value="Anime">Anime</option>
                    <option value="Jurassic">Jurassic</option>
                    <option value="Clay">Clay</option>
                    <option value="Impressionist">Impressionist</option>
                    <option value="US Comic">US Comic</option>
                    <option value="Horror">Horror</option>
                    <option value="Cyberpunk">Cyberpunk</option>
                    <option value="Spooky Photo">Spooky Photo</option>
                    <option value="Neoclassic">Neoclassic</option>
                    <option value="Prehistoric">Prehistoric</option>
                    <option value="Roman Art">Roman Art</option>
                    <option value="Nature Photo">Nature Photo</option>
                    <option value="Pop Art">Pop Art</option>
                    <option value="B&W Film">B&W Film</option>
                    <option value="Gothic">Gothic</option>
                    <option value="B&W Graphic">B&W Graphic</option>
                    <option value="Oil painting">Oil painting</option>
                    <option value="Fairy Tale">Fairy Tale</option>
                    <option value="Retro Anime">Retro Anime</option>
                    <option value="Comic">Comic</option>
                    <option value="Dark Manga">Dark Manga</option>
                    <option value="Comic Strip">Comic Strip</option>
                    <option value="Chinese ancient">Chinese ancient</option>
                </select>
            </div>

            <div class="voice-section">
                <label for="voice-select">Voz:</label>
                <select id="voice-select">
                    <option value="Knightley" selected>Knightley</option>
                    <option value="Ms. Labebe">Ms. Labebe</option>
                    <option value="Lady Holiday">Lady Holiday</option>
                    <option value="Happy Dino">Happy Dino</option>
                    <option value="Wacky Puppet">Wacky Puppet</option>
                    <option value="Ladies' Man">Ladies' Man</option>
                    <option value="Sassy Witch">Sassy Witch</option>
                    <option value="Game Host">Game Host</option>
                    <option value="Calm Dubing">Calm Dubing</option>
                    <option value="Excited Commentator">Excited Commentator</option>
                    <option value="Cheeky Commentator">Cheeky Commentator</option>
                    <option value="Persuasive Girl">Persuasive Girl</option>
                    <option value="Nonchalant Girl">Nonchalant Girl</option>
                    <option value="Yumi">Yumi</option>
                    <option value="Nice Witch">Nice Witch</option>
                    <option value="Tio Gordito">Tio Gordito</option>
                    <option value="Spanish Doll">Spanish Doll</option>
                    <option value="Portuguese Doll">Portuguese Doll</option>
                    <option value="Zumba Coach">Zumba Coach</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Over Dramatic">Over Dramatic</option>
                    <option value="Bold Comedian">Bold Comedian</option>
                    <option value="Chaotic Friend">Chaotic Friend</option>
                    <option value="Tavinho">Tavinho</option>
                    <option value="Playful Boy">Playful Boy</option>
                    <option value="Zeca">Zeca</option>
                    <option value="Mischievous">Mischievous</option>
                    <option value="Powerful Charisma">Powerful Charisma</option>
                    <option value="Lucca">Lucca</option>
                    <option value="Rafa">Rafa</option>
                    <option value="Carnival Master">Carnival Master</option>
                    <option value="Reina">Reina</option>
                    <option value="Dulce">Dulce</option>
                    <option value="Rayo">Rayo</option>
                    <option value="Chispa">Chispa</option>
                    <option value="Galan">Galan</option>
                    <option value="Tiqui">Tiqui</option>
                    <option value="Seba">Seba</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Nandez">Nandez</option>
                    <option value="Adam">Adam</option>
                    <option value="Lucas">Lucas</option>
                    <option value="Diana">Diana</option>
                    <option value="Daniel">Daniel</option>
                    <option value="Camila">Camila</option>
                    <option value="Alvaro">Alvaro</option>
                    <option value="Robert">Robert</option>
                    <option value="Esmeralda">Esmeralda</option>
                    <option value="ASMR Spanish">ASMR Spanish</option>
                    <option value="Leo Emotions">Leo Emotions</option>
                    <option value="Yukiko">Yukiko</option>
                    <option value="Detective">Detective</option>
                    <option value="Nita">Nita</option>
                    <option value="Gia">Gia</option>
                    <option value="Urso">Urso</option>
                    <option value="Carola">Carola</option>
                    <option value="Amelia">Amelia</option>
                    <option value="Serious Male III">Serious Male III</option>
                    <option value="Michael Mouse">Michael Mouse</option>
                    <option value="Blake">Blake</option>
                    <option value="Siren">Siren</option>
                    <option value="Chica Joven">Chica Joven</option>
                    <option value="Mariana">Mariana</option>
                    <option value="Rafayell">Rafayell</option>
                    <option value="Benny Cumbers">Benny Cumbers</option>
                    <option value="Strong British Male">Strong British Male</option>
                    <option value="Sir British Narrator">Sir British Narrator</option>
                    <option value="Richard">Richard</option>
                    <option value="Timothy">Timothy</option>
                    <option value="Katie White">Katie White</option>
                    <option value="Rebecca">Rebecca</option>
                    <option value="Alastorr">Alastorr</option>
                    <option value="Half-Blood Prince">Half-Blood Prince</option>
                    <option value="Charlie M">Charlie M</option>
                    <option value="Benjamin II">Benjamin II</option>
                    <option value="Benjamin I">Benjamin I</option>
                    <option value="Terrell">Terrell</option>
                    <option value="Cowboy Bob">Cowboy Bob</option>
                    <option value="Alejandro Durán">Alejandro Durán</option>
                    <option value="Tatiana Martin">Tatiana Martin</option>
                    <option value="Sara Martin I">Sara Martin I</option>
                    <option value="Xmas Mischief">Xmas Mischief</option>
                    <option value="Grinchy Cheer">Grinchy Cheer</option>
                    <option value="Polar Guide">Polar Guide</option>
                    <option value="Holiday Twist">Holiday Twist</option>
                    <option value="Snowday Hero">Snowday Hero</option>
                    <option value="Miss Bluetooth">Miss Bluetooth</option>
                    <option value="Dorian">Dorian</option>
                    <option value="Caspian">Caspian</option>
                    <option value="Uncle J">Uncle J</option>
                    <option value="Mary">Mary</option>
                    <option value="Lizzie">Lizzie</option>
                    <option value="Tom">Tom</option>
                    <option value="Corey">Corey</option>
                    <option value="Glen">Glen</option>
                    <option value="Candice">Candice</option>
                    <option value="Demure">Demure</option>
                    <option value="ASMR by Alice">ASMR by Alice</option>
                    <option value="ASMR by Sharron">ASMR by Sharron</option>
                    <option value="Freckled Lass">Freckled Lass</option>
                    <option value="Female Sales II">Female Sales II</option>
                    <option value="Rick">Rick</option>
                    <option value="Bibble">Bibble</option>
                    <option value="Sports Commentator">Sports Commentator</option>
                    <option value="Cranky Kitten">Cranky Kitten</option>
                    <option value="Bouncer">Bouncer</option>
                    <option value="Camile">Camile</option>
                    <option value="Academic Male">Academic Male</option>
                    <option value="Valentino">Valentino</option>
                    <option value="Alex">Alex</option>
                    <option value="Dan Dan">Dan Dan</option>
                    <option value="Vibrant Baritone">Vibrant Baritone</option>
                    <option value="Dave">Dave</option>
                    <option value="Sophisticated Male">Sophisticated Male</option>
                    <option value="Michael">Michael</option>
                    <option value="Marcus">Marcus</option>
                    <option value="Bill">Bill</option>
                    <option value="Scarlett">Scarlett</option>
                    <option value="Natasha">Natasha</option>
                    <option value="Musing Female">Musing Female</option>
                    <option value="Joanne">Joanne</option>
                    <option value="Myra">Myra</option>
                </select>
            </div>

            <button id="execute-automation" class="execute-btn">
                Executar
            </button>

            <div id="status-message" class="status-message"></div>
        `;

        // Criar botão toggle flutuante
        const toggleButton = document.createElement('button');
        toggleButton.id = 'capcut-toggle-button';
        toggleButton.className = 'panel-visible';
        toggleButton.innerHTML = '▲';
        toggleButton.title = 'Mostrar/Esconder painel de automação';
        toggleButton.style.display = 'flex';
        toggleButton.style.visibility = 'visible';
        toggleButton.style.opacity = '1';
        toggleButton.style.zIndex = '1000000';

        document.body.appendChild(panel);
        document.body.appendChild(toggleButton);

        console.log('CapCut Automation: Painel e botão toggle criados');

        // Adicionar event listeners
        setupEventListeners();
    }

    // Configurar event listeners
    function setupEventListeners() {
        const executeBtn = document.getElementById('execute-automation');
        const toggleBtn = document.getElementById('capcut-toggle-button');
        const scriptInput = document.getElementById('script-input');
        const expandBtn = document.getElementById('expand-input-btn');

        if (!toggleBtn) {
            console.error('CapCut Automation: Botão toggle não encontrado!');
            return;
        }

        console.log('CapCut Automation: Event listeners sendo configurados', toggleBtn);

        executeBtn.addEventListener('click', executeAutomation);

        // Botão toggle para mostrar/esconder
        toggleBtn.addEventListener('click', () => {
            console.log('CapCut Automation: Toggle clicado');
            togglePanel();
        });

        // Botão para expandir/recolher o campo de texto
        expandBtn.addEventListener('click', () => {
            toggleInputExpansion();
        });

        // Salvar conteúdo do input automaticamente e atualizar contador
        scriptInput.addEventListener('input', () => {
            localStorage.setItem('capcut-script-content', scriptInput.value);
            updateWordCounter();
        });

        // Restaurar conteúdo salvo ao carregar
        const savedContent = localStorage.getItem('capcut-script-content');
        if (savedContent) {
            scriptInput.value = savedContent;
            updateWordCounter();
        }
    }

    // Função para atualizar o contador de palavras
    function updateWordCounter() {
        const scriptInput = document.getElementById('script-input');
        const wordCountElement = document.getElementById('word-count');
        const counterStatusElement = document.getElementById('counter-status');
        const wordCounterElement = document.getElementById('word-counter');

        if (!scriptInput || !wordCountElement || !counterStatusElement) {
            return;
        }

        const text = scriptInput.value.trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        const maxWords = 1300;

        // Atualizar contagem
        wordCountElement.textContent = wordCount;

        // Atualizar status e estilo baseado na contagem
        if (wordCount === 0) {
            wordCounterElement.className = 'word-counter';
            counterStatusElement.innerHTML = `
                <span class="status-icon">ℹ️</span>
                <span class="status-text">CapCut funciona melhor com até 1300 palavras</span>
            `;
        } else if (wordCount <= maxWords * 0.8) {
            // Até 80% do limite (1040 palavras) - Verde
            wordCounterElement.className = 'word-counter status-ok';
            counterStatusElement.innerHTML = `
                <span class="status-icon">✅</span>
                <span class="status-text">Perfeito! Dentro do limite ideal</span>
            `;
        } else if (wordCount <= maxWords) {
            // Entre 80% e 100% (1041-1300 palavras) - Amarelo
            const remaining = maxWords - wordCount;
            wordCounterElement.className = 'word-counter status-warning';
            counterStatusElement.innerHTML = `
                <span class="status-icon">⚠️</span>
                <span class="status-text">Atenção! Restam apenas ${remaining} palavras</span>
            `;
        } else {
            // Acima do limite (>1300 palavras) - Vermelho
            const excess = wordCount - maxWords;
            wordCounterElement.className = 'word-counter status-error';
            counterStatusElement.innerHTML = `
                <span class="status-icon">❌</span>
                <span class="status-text">Limite excedido em ${excess} palavras! CapCut pode não funcionar corretamente</span>
            `;
        }
    }

    // Função para toggle (mostrar/esconder) o painel
    function togglePanel() {
        const panel = document.getElementById('capcut-automation-panel');
        const toggleBtn = document.getElementById('capcut-toggle-button');

        if (panel.classList.contains('hidden')) {
            // Mostrar
            panel.classList.remove('hidden');
            toggleBtn.classList.add('panel-visible');
            toggleBtn.innerHTML = '▲';
        } else {
            // Esconder
            panel.classList.add('hidden');
            toggleBtn.classList.remove('panel-visible');
            toggleBtn.innerHTML = '▼';
        }
    }

    // Função para esconder o painel temporariamente
    function hidePanel() {
        const panel = document.getElementById('capcut-automation-panel');
        const toggleBtn = document.getElementById('capcut-toggle-button');

        panel.classList.add('hidden');
        toggleBtn.classList.remove('panel-visible');
        toggleBtn.innerHTML = '▼';
    }

    // Função para expandir/recolher o campo de input
    function toggleInputExpansion() {
        const scriptInput = document.getElementById('script-input');
        const panel = document.getElementById('capcut-automation-panel');
        const expandBtn = document.getElementById('expand-input-btn');

        if (scriptInput.classList.contains('expanded')) {
            // Recolher
            scriptInput.classList.remove('expanded');
            scriptInput.rows = 1;
            panel.classList.remove('panel-expanded');
            expandBtn.innerHTML = '⤢';
            expandBtn.title = 'Expandir campo';
        } else {
            // Expandir
            scriptInput.classList.add('expanded');
            scriptInput.rows = 8;
            panel.classList.add('panel-expanded');
            expandBtn.innerHTML = '⤡';
            expandBtn.title = 'Recolher campo';
        }
    }

    // Função para remover o painel permanentemente
    function removePanelPermanently() {
        const panel = document.getElementById('capcut-automation-panel');
        const toggleBtn = document.getElementById('capcut-toggle-button');

        panel.classList.add('hidden');

        // Remover tudo após a animação
        setTimeout(() => {
            if (panel && panel.parentNode) {
                panel.remove();
            }
            if (toggleBtn && toggleBtn.parentNode) {
                toggleBtn.remove();
            }
        }, 300);
    }

    // Função principal de automação
    async function executeAutomation() {
        const scriptInput = document.getElementById('script-input');
        const statusMessage = document.getElementById('status-message');
        const executeBtn = document.getElementById('execute-automation');

        const scriptText = scriptInput.value.trim();

        // Validar input
        if (!scriptText) {
            showStatus('Por favor, insira um script!', 'error');
            return;
        }

        // Desabilitar botão durante execução
        executeBtn.disabled = true;
        executeBtn.textContent = 'Aguarde...';

        try {
            // Passo 1: Clicar no card "Instant AI video"
            showStatus('1/6: Clicando em "Instant AI video"...', 'info');
            await clickInstantAIVideo();
            await sleep(1500);

            // Passo 2: Clicar em "Enter script"
            showStatus('2/6: Selecionando "Enter script"...', 'info');
            await clickEnterScript();
            await sleep(1000);

            // Passo 3: Selecionar estilo
            const styleSelect = document.getElementById('style-select');
            const selectedStyle = styleSelect.value;
            showStatus('3/6: Selecionando estilo "' + selectedStyle + '"...', 'info');
            await selectStyle(selectedStyle);
            await sleep(1500);

            // Passo 4: Inserir o texto no textarea
            showStatus('4/6: Inserindo o script...', 'info');
            await insertScript(scriptText);
            await sleep(1500);

            // Passo 5: Selecionar voz
            const voiceSelect = document.getElementById('voice-select');
            const selectedVoice = voiceSelect.value;
            showStatus('5/6: Selecionando voz "' + selectedVoice + '"...', 'info');
            await selectVoice(selectedVoice);
            await sleep(1000);

            // Passo 6: Clicar em Create
            showStatus('6/6: Clicando em "Create"...', 'info');
            await clickCreate();
            await sleep(500);

            showStatus('✅ Concluído!', 'success');

            // Esconder o painel após 1.5 segundos de sucesso
            setTimeout(() => {
                hidePanel();
            }, 1500);
        } catch (error) {
            showStatus('❌ Erro: ' + error.message, 'error');
            console.error('Erro na automação:', error);
        } finally {
            // Reabilitar botão
            executeBtn.disabled = false;
            executeBtn.textContent = 'Executar';
        }
    }

    // Passo 1: Clicar no card "Instant AI video"
    function clickInstantAIVideo() {
        return new Promise((resolve, reject) => {
            const cardTitle = Array.from(document.querySelectorAll('.cardTitle-m54BJr'))
                .find(el => el.textContent.includes('Instant AI video'));

            if (cardTitle && cardTitle.closest('.cardInfo-M8AV1c')) {
                const card = cardTitle.closest('.cardInfo-M8AV1c');
                card.click();
                resolve();
            } else {
                reject(new Error('Card "Instant AI video" não encontrado'));
            }
        });
    }

    // Passo 2: Clicar em "Enter script"
    function clickEnterScript() {
        return new Promise((resolve, reject) => {
            const enterScriptBtn = Array.from(document.querySelectorAll('.title-hZaZJF'))
                .find(el => el.textContent.includes('Enter script'));

            if (enterScriptBtn) {
                enterScriptBtn.click();
                resolve();
            } else {
                reject(new Error('Botão "Enter script" não encontrado'));
            }
        });
    }

    // Passo 3: Selecionar estilo com scroll progressivo
    function selectStyle(styleName) {
        return new Promise((resolve, reject) => {
            // Encontrar o container com os cards de estilo
            const styleContainer = document.querySelector('.sliding-container__items-Ry98fF');

            if (!styleContainer) {
                console.warn('Container de estilos não encontrado, continuando sem selecionar estilo');
                resolve(); // Resolver para não travar a automação
                return;
            }

            // Função para verificar se encontrou e clicar
            function findAndClickStyle() {
                const allStyleNames = document.querySelectorAll('.style-name-kZ9bFa');
                const targetDiv = Array.from(allStyleNames).find(div =>
                    div.textContent.trim() === styleName
                );

                if (targetDiv) {
                    const parentCard = targetDiv.closest('.card-adgnTL');
                    if (parentCard) {
                        parentCard.click();
                        return true;
                    }
                }
                return false;
            }

            // Scroll progressivo com varredura
            let currentScroll = 0;
            const scrollStep = 400; // Scroll de 400px por vez
            const maxScroll = 10000; // Máximo de 10000px
            const scrollDelay = 150; // Esperar 150ms entre cada scroll

            function scrollAndSearch() {
                // Tentar encontrar antes de fazer scroll
                if (findAndClickStyle()) {
                    resolve();
                    return;
                }

                // Se ainda não chegou ao fim, continuar scrollando
                if (currentScroll < maxScroll) {
                    currentScroll += scrollStep;
                    styleContainer.scrollLeft = currentScroll;

                    // Aguardar renderização e tentar novamente
                    setTimeout(scrollAndSearch, scrollDelay);
                } else {
                    // Chegou ao fim sem encontrar, tentar uma última vez
                    if (findAndClickStyle()) {
                        resolve();
                    } else {
                        console.warn('Estilo "' + styleName + '" não encontrado, usando padrão');
                        resolve(); // Resolver mesmo assim para não travar
                    }
                }
            }

            // Iniciar a busca após pequeno delay
            setTimeout(scrollAndSearch, 300);
        });
    }

    // Passo 4: Inserir script no textarea
    function insertScript(text) {
        return new Promise((resolve, reject) => {
            const textarea = document.querySelector('textarea.lv-textarea.input-i8iU_H');

            if (textarea) {
                // Simular input de usuário
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                resolve();
            } else {
                reject(new Error('Campo de texto não encontrado'));
            }
        });
    }

    // Passo 5: Selecionar voz com scroll progressivo
    function selectVoice(voiceName) {
        return new Promise((resolve, reject) => {
            // Encontrar e clicar no dropdown
            const voiceSelector = document.querySelector('.lv-select-view-selector');

            if (!voiceSelector) {
                reject(new Error('Dropdown de voz não encontrado'));
                return;
            }

            voiceSelector.click();

            // Aguardar o dropdown abrir
            setTimeout(() => {
                // Encontrar o container com scroll
                const dropdownContainer = document.querySelector('.popupMenuContainer-BXa3SD');

                if (!dropdownContainer) {
                    reject(new Error('Container do dropdown não encontrado'));
                    return;
                }

                // Função para verificar se encontrou e clicar
                function findAndClickOption() {
                    const allToneNames = document.querySelectorAll('.toneName-MdMttm');
                    const targetSpan = Array.from(allToneNames).find(span =>
                        span.textContent.trim() === voiceName
                    );

                    if (targetSpan) {
                        const parentLi = targetSpan.closest('li.lv-select-option');
                        if (parentLi) {
                            parentLi.click();
                            return true;
                        }
                    }
                    return false;
                }

                // Scroll progressivo com varredura
                let currentScroll = 0;
                const scrollStep = 300; // Scroll de 300px por vez (2x mais rápido)
                const maxScroll = 8000; // Máximo de 8000px
                const scrollDelay = 100; // Esperar apenas 100ms entre cada scroll

                function scrollAndSearch() {
                    // Tentar encontrar antes de fazer scroll
                    if (findAndClickOption()) {
                        resolve();
                        return;
                    }

                    // Se ainda não chegou ao fim, continuar scrollando
                    if (currentScroll < maxScroll) {
                        currentScroll += scrollStep;
                        dropdownContainer.scrollTop = currentScroll;

                        // Aguardar renderização e tentar novamente
                        setTimeout(scrollAndSearch, scrollDelay);
                    } else {
                        // Chegou ao fim sem encontrar, tentar uma última vez
                        if (findAndClickOption()) {
                            resolve();
                        } else {
                            console.warn('Voz "' + voiceName + '" não encontrada, usando padrão');
                            resolve(); // Resolver mesmo assim para não travar
                        }
                    }
                }

                // Iniciar a busca
                setTimeout(scrollAndSearch, 300);
            }, 800);
        });
    }

    // Passo 6: Clicar em Create
    function clickCreate() {
        return new Promise((resolve, reject) => {
            const createBtn = Array.from(document.querySelectorAll('span'))
                .find(el => el.textContent.trim() === 'Create' &&
                           el.closest('button'));

            if (createBtn) {
                const button = createBtn.closest('button');
                button.click();
                resolve();
            } else {
                reject(new Error('Botão "Create" não encontrado'));
            }
        });
    }

    // Função auxiliar: mostrar status
    function showStatus(message, type) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
        statusMessage.className = 'status-message visible ' + type;
    }

    // Função auxiliar: sleep
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

})();
