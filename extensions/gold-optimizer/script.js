document.addEventListener('DOMContentLoaded', () => {
    const addTitleBlockBtn = document.getElementById('addTitleBlockBtn');

    if (addTitleBlockBtn) {
        addTitleBlockBtn.addEventListener('click', () => {
            const fileName = fileNameInput.value.trim();
            if (!fileName) {
                showError('Digite um nome de arquivo para criar o bloco do título.');
                return;
            }
            // Cria um bloco no início dos blocos
            createBlock(fileName, null, true);
        });
    }
    const PAUSE_TIME = 0.9; // Tempo de pausa entre blocos (segundos)
    let editedBlocks = []; // Armazena os blocos editados
    let hasUnsavedChanges = false; // Flag para controlar se há alterações não salvas

    // Elementos do DOM
    const speedInput = document.getElementById('speed');
    const speedValueSpan = document.getElementById('speedValue');
    const readingRateInput = document.getElementById('readingRate');
    const readingRateValueSpan = document.getElementById('readingRateValue');
    const popupWidthInput = document.getElementById('popupWidth');
    const popupWidthValue = document.getElementById('popupWidthValue');
    const pinSidePanelBtn = document.getElementById('pinSidePanelBtn');
    const wordCountInput = document.getElementById('wordCount');
    const charCountInput = document.getElementById('charCount');
    const textInput = document.getElementById('textInput');
    const blocksDiv = document.getElementById('blocks');
    const totalInfoDiv = document.getElementById('totalInfo');
    const previewDiv = document.getElementById('preview');
    const fileNameInput = document.getElementById('fileName');
    const ignoreTextInput = document.getElementById('ignoreText');
    const autoTitleOnDivideCheckbox = document.getElementById('autoTitleOnDivide');
    const filterNumbersCheckbox = document.getElementById('filterNumbers');
    const clearTextAfterExportCheckbox = document.getElementById('clearTextAfterExport');

    // Botões
    const divideByWordsBtn = document.getElementById('divideByWordsBtn');
    const divideByCharsBtn = document.getElementById('divideByCharsBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportSrtBtn = document.getElementById('exportSrtBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const saveEditsBtn = document.getElementById('saveEditsBtn') || createSaveButton();

    // Adicionar Event Listeners
    // Speed oculto: fixa como 1 e mantém persistência se já existir
    if (speedInput) {
        const existing = parseFloat(localStorage.getItem('speedMultiplier'));
        const normalized = !Number.isNaN(existing) ? clamp(existing, 0.5, 2) : 1;
        speedInput.value = normalized;
        localStorage.setItem('speedMultiplier', String(normalized));
    }

    readingRateInput.addEventListener('input', () => {
        const value = clamp(parseInt(readingRateInput.value, 10), 10, 50);
        readingRateInput.value = value;
        readingRateValueSpan.innerText = `${value} c/s`;
        localStorage.setItem('readingRate', String(value));
    });

    if (divideByWordsBtn) divideByWordsBtn.addEventListener('click', divideTextByWords);
    if (divideByCharsBtn) divideByCharsBtn.addEventListener('click', divideTextByChars);
    resetBtn.addEventListener('click', resetForm);
    exportSrtBtn.addEventListener('click', exportToSrt);
    exportPdfBtn.addEventListener('click', exportToTxt);
    // Botão de exportação TXT sempre disponível

    // Fixar no painel lateral
    if (pinSidePanelBtn && window.chrome && chrome.sidePanel && chrome.sidePanel.open) {
        pinSidePanelBtn.addEventListener('click', async () => {
            try {
                await chrome.sidePanel.setOptions({ enabled: true });
                await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
                window.close();
            } catch (e) {
                console.error('Falha ao abrir painel lateral', e);
                showError('Não foi possível abrir o painel lateral. Atualize o Chrome.');
            }
        });
    } else if (pinSidePanelBtn) {
        pinSidePanelBtn.disabled = true;
        pinSidePanelBtn.title = 'Painel lateral não disponível nesta versão do Chrome';
    }

    // Largura do popup: carregar, aplicar e escutar mudanças
    try {
        const savedWidth = localStorage.getItem('popupWidthPx');
        const initialWidth = savedWidth ? parseInt(savedWidth, 10) : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--popup-width')) || 360;
        applyPopupWidth(initialWidth);
        if (popupWidthInput) {
            popupWidthInput.value = initialWidth;
            popupWidthValue.textContent = `${initialWidth}px`;
            popupWidthInput.addEventListener('input', () => {
                const width = parseInt(popupWidthInput.value, 10);
                applyPopupWidth(width);
                popupWidthValue.textContent = `${width}px`;
                localStorage.setItem('popupWidthPx', String(width));
            });
        }
        // Restaurar speed e readingRate
        // Speed: já tratado acima e sem UI visível
        const savedRate = parseInt(localStorage.getItem('readingRate'), 10);
        if (!Number.isNaN(savedRate)) {
            readingRateInput.value = clamp(savedRate, 10, 50);
            readingRateValueSpan.innerText = `${parseInt(readingRateInput.value, 10)} c/s`;
        } else {
            readingRateValueSpan.innerText = `${parseInt(readingRateInput.value, 10)} c/s`;
        }
    } catch (e) {
        console.warn('Falha ao inicializar largura do popup', e);
    }

    function applyPopupWidth(px) {
        const clamped = Math.max(320, Math.min(800, px || 360));
        document.documentElement.style.setProperty('--popup-width', `${clamped}px`);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
    saveEditsBtn.addEventListener('click', saveEditedBlocks);

    function createSaveButton() {
        const button = document.createElement('button');
        button.id = 'saveEditsBtn';
        button.textContent = 'Salvar Edições';
        button.disabled = true;
        button.style.backgroundColor = '#28a745';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.padding = '15px';
        button.style.fontSize = '16px';
        button.style.cursor = 'pointer';
        button.style.width = '40%';
        button.style.marginTop = '10px';

        // Inserir o botão após o botão de exportar PDF
        const form = document.getElementById('form');
        form.appendChild(button);

        return button;
    }

    function updateSaveButtonState() {
        saveEditsBtn.disabled = !hasUnsavedChanges;
        saveEditsBtn.style.opacity = hasUnsavedChanges ? '1' : '0.5';
        saveEditsBtn.style.cursor = hasUnsavedChanges ? 'pointer' : 'not-allowed';
    }

    function saveEditedBlocks() {
        if (!hasUnsavedChanges) return;

        const blocks = document.querySelectorAll('.block .srt');
        editedBlocks = Array.from(blocks).map((block, index) => ({
            id: index,
            content: block.innerText.trim(),
            timestamp: new Date().toISOString()
        }));

        hasUnsavedChanges = false;
        updateSaveButtonState();

        // Remover indicadores de edição
        const editedIndicators = document.querySelectorAll('.edited-indicator');
        editedIndicators.forEach(indicator => indicator.remove());

        // Feedback visual
        const originalText = saveEditsBtn.textContent;
        saveEditsBtn.textContent = 'Salvo!';
        saveEditsBtn.style.backgroundColor = '#28a745';

        setTimeout(() => {
            saveEditsBtn.textContent = originalText;
            saveEditsBtn.style.backgroundColor = '#28a745';
        }, 2000);

        console.log('Blocos salvos:', editedBlocks);
    }

    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            if (button) {
                button.classList.add('copied');
                button.textContent = 'Copiado!';
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.textContent = 'Copiar';
                }, 2000);
            }
        } catch (err) {
            console.error('Falha ao copiar texto: ', err);
            showError('Falha ao copiar texto. Verifique as permissões do navegador.');
        }
    }

    function exportToSrt() {
        const speed = parseFloat(speedInput.value);
        const readingRate = parseInt(readingRateInput.value, 10);

        // Usar blocos editados se houver, senão usar blocos do DOM
        let blocksToExport;
        if (editedBlocks.length > 0) {
            blocksToExport = editedBlocks.map(block => ({ innerText: block.content }));
        } else {
            blocksToExport = document.querySelectorAll('.block .srt');
        }

        let srtContent = '';
        let currentTime = 0;

        blocksToExport.forEach((block, index) => {
            const text = block.innerText ? block.innerText.trim() : block.content;
            if (!text) return; // Pular blocos vazios

            const duration = text.length / readingRate;
            const startTime = currentTime;
            const endTime = currentTime + duration;

            const finalStartTime = adjustTimestamp(formatTimestamp(startTime), speed);
            const finalEndTime = adjustTimestamp(formatTimestamp(endTime), speed);

            srtContent += `${index + 1}\n${finalStartTime} --> ${finalEndTime}\n${text}\n\n`;

            currentTime = endTime + PAUSE_TIME;
        });

        downloadSrtFile(srtContent.trim());
        
        // Limpar texto se a opção estiver marcada
        if (clearTextAfterExportCheckbox.checked) {
            textInput.value = '';
        }
    }

    function adjustTimestamp(timestamp, speed) {
        if (!timestamp) return '00:00:00,000';

        const parts = timestamp.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const secondsParts = parts[2].split(',');
        const seconds = parseInt(secondsParts[0], 10);
        const milliseconds = parseInt(secondsParts[1], 10);

        let totalMilliseconds = ((hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds) / speed;

        const newHours = Math.floor(totalMilliseconds / 3600000);
        totalMilliseconds %= 3600000;
        const newMinutes = Math.floor(totalMilliseconds / 60000);
        totalMilliseconds %= 60000;
        const newSeconds = Math.floor(totalMilliseconds / 1000);
        const newMilliseconds = Math.round(totalMilliseconds % 1000);

        return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')},${String(newMilliseconds).padStart(3, '0')}`;
    }

    function downloadSrtFile(content) {
        const fileName = fileNameInput.value || 'subtitles';
        const blob = new Blob([content], { type: 'text/srt' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function createBlock(content = '', insertAfterElement = null, insertAtStart = false) {
        const blockDiv = document.createElement('div');
        blockDiv.classList.add('block');

        const srtContent = document.createElement('div');
        srtContent.classList.add('srt');
        srtContent.setAttribute('contenteditable', 'true');
        srtContent.innerText = content;

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info');
        
        const blockNumberSpan = document.createElement('span');
        blockNumberSpan.classList.add('block-number');

        const charCountSpan = document.createElement('span');
        charCountSpan.classList.add('char-count');
        
        const wordCountSpan = document.createElement('span');
        wordCountSpan.classList.add('word-count');

        const updateCounts = () => {
            const text = srtContent.innerText;
            const charLength = text.length;
            const wordLength = text.split(/\s+/).filter(Boolean).length;
            charCountSpan.textContent = `${charLength} caracteres`;
            wordCountSpan.textContent = `${wordLength} palavras`;
        };

        srtContent.addEventListener('input', () => {
            updateCounts();
            markAsEdited();
        });

        const markAsEdited = () => {
            hasUnsavedChanges = true;
            updateSaveButtonState();

            // Adicionar indicador visual de edição
            if (!blockDiv.querySelector('.edited-indicator')) {
                const indicator = document.createElement('div');
                indicator.classList.add('edited-indicator');
                indicator.title = 'Este bloco foi editado';
                blockDiv.appendChild(indicator);
            }
        };

        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('block-controls');

        const addBtn = document.createElement('button');
        addBtn.classList.add('block-btn', 'add');
        addBtn.innerHTML = '&#10133;'; // Plus icon
        addBtn.title = 'Adicionar bloco abaixo';
        addBtn.onclick = () => createBlock('', blockDiv);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('block-btn', 'delete');
        deleteBtn.innerHTML = '&#10060;'; // Cross icon
        deleteBtn.title = 'Excluir este bloco';
        deleteBtn.onclick = () => {
            blockDiv.remove();
            updateBlockNumbers();
        };
        
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy');
        copyBtn.textContent = 'Copiar';
        copyBtn.onclick = () => copyToClipboard(srtContent.innerText, copyBtn);

        controlsDiv.append(addBtn, deleteBtn, copyBtn);
        infoDiv.append(blockNumberSpan, charCountSpan, wordCountSpan, controlsDiv);
        blockDiv.append(infoDiv, srtContent);

        if (insertAtStart) {
            blocksDiv.prepend(blockDiv);
        } else if (insertAfterElement) {
            insertAfterElement.after(blockDiv);
        } else {
            blocksDiv.appendChild(blockDiv);
        }
        
        updateCounts();
        updateBlockNumbers();
    }

    function updateBlockNumbers() {
        const allBlocks = document.querySelectorAll('.block .block-number');
        allBlocks.forEach((span, index) => {
            span.textContent = `Bloco ${index + 1}`;
        });
    }

    function divideTextByWords() {
        if (!validateWordCount()) return;
        const wordsPerBlock = parseInt(wordCountInput.value, 10);
        let text = textInput.value;

        // Ignorar palavra/frase específica
        const ignored = ignoreTextInput ? ignoreTextInput.value.trim() : '';
        if (ignored) {
            const regex = new RegExp(escapeRegExp(ignored), 'gi');
            text = text.replace(regex, '');
        }

        // Aplicar filtro de números se a opção estiver marcada
        if (filterNumbersCheckbox.checked) {
            text = text.replace(/\d+/g, '');
        }

        const totalChars = text.length;
        const totalWords = text.split(/\s+/).filter(word => word.length > 0).length;
        totalInfoDiv.textContent = `Total de caracteres: ${totalChars} | Total de palavras: ${totalWords}`;

        const blocks = getTextBlocksByWords(text, wordsPerBlock);
        blocksDiv.innerHTML = '';

        // Inserir bloco de título automaticamente, se marcado
        if (autoTitleOnDivideCheckbox && autoTitleOnDivideCheckbox.checked) {
            const title = (fileNameInput && fileNameInput.value.trim()) || '';
            if (title) createBlock(title, null, true);
        }

        blocks.forEach(block => {
            createBlock(block);
        });

        updatePreview(blocks);

        // Mostrar estatísticas úteis
        console.log(`Divisão por palavras: ${blocks.length} blocos criados, média de ${Math.round(totalWords / blocks.length)} palavras por bloco`);
    }

    function divideTextByChars() {
        if (!validateCharCount()) return;
        const charCount = parseInt(charCountInput.value, 10);
        let text = textInput.value;

        // Ignorar palavra/frase específica
        const ignored = ignoreTextInput ? ignoreTextInput.value.trim() : '';
        if (ignored) {
            const regex = new RegExp(escapeRegExp(ignored), 'gi');
            text = text.replace(regex, '');
        }

        // Aplicar filtro de números se a opção estiver marcada
        if (filterNumbersCheckbox.checked) {
            text = text.replace(/\d+/g, '');
        }

        const totalChars = text.length;
        const totalWords = text.split(/\s+/).filter(word => word.length > 0).length;
        totalInfoDiv.textContent = `Total de caracteres: ${totalChars} | Total de palavras: ${totalWords}`;

        const blocks = getTextBlocksWithCustomLength(text, charCount);
        blocksDiv.innerHTML = '';

        // Inserir bloco de título automaticamente, se marcado
        if (autoTitleOnDivideCheckbox && autoTitleOnDivideCheckbox.checked) {
            const title = (fileNameInput && fileNameInput.value.trim()) || '';
            if (title) createBlock(title, null, true);
        }

        blocks.forEach(block => createBlock(block));
        updatePreview(blocks);

        // Mostrar estatísticas úteis
        console.log(`Divisão por caracteres: ${blocks.length} blocos criados, média de ${Math.round(totalChars / blocks.length)} caracteres por bloco`);
    }

    function resetForm() {
        charCountInput.value = '490';
        textInput.value = '';
        blocksDiv.innerHTML = '';
        totalInfoDiv.textContent = '';
        previewDiv.innerHTML = '';
        fileNameInput.value = '';
        speedInput.value = '1';
        speedValueSpan.innerText = '1.0x';
        readingRateInput.value = '14';
        readingRateValueSpan.innerText = '14 c/s';
        if (ignoreTextInput) {
            ignoreTextInput.value = '';
        }
        if (autoTitleOnDivideCheckbox) {
            autoTitleOnDivideCheckbox.checked = false;
        }

        // Resetar estado das edições
        editedBlocks = [];
        hasUnsavedChanges = false;
        updateSaveButtonState();
    }

    function validateWordCount() {
        const wordCount = wordCountInput.value;
        if (isNaN(wordCount) || wordCount <= 0) {
            showError("Por favor, insira um número válido de palavras.");
            return false;
        }
        return true;
    }

    function validateCharCount() {
        const charCount = charCountInput.value;
        if (isNaN(charCount) || charCount <= 0) {
            showError("Por favor, insira um número válido de caracteres.");
            return false;
        }
        return true;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error');
        errorDiv.textContent = message;
        document.body.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    function getTextBlocksByWords(text, wordsPerBlock) {
        // Detectar parágrafos ANTES de formatar (quebras duplas ou mais)
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const blocks = [];
        let currentWords = [];
        let currentCount = 0;

        const flushCurrent = () => {
            if (currentWords.length > 0) {
                blocks.push(currentWords.join(' ').trim());
                currentWords = [];
                currentCount = 0;
            }
        };

        for (const paragraph of paragraphs) {
            const formattedParagraph = formatText(paragraph);
            const sentences = splitIntoSentences(formattedParagraph);

            for (const sentence of sentences) {
                const tokens = sentence.trim().split(/\s+/).filter(Boolean);

                // Se adicionar toda a frase não exceder muito o limite, adicione tudo
                if (currentCount + tokens.length <= wordsPerBlock * 1.2) {
                    for (const token of tokens) {
                        currentWords.push(token);
                        currentCount += 1;
                    }

                    // Só finaliza se atingiu o limite mínimo
                    if (currentCount >= wordsPerBlock) {
                        flushCurrent();
                    }
                } else {
                    // Se exceder muito, adicione palavra por palavra
                    for (const token of tokens) {
                        currentWords.push(token);
                        currentCount += 1;
                        if (currentCount >= wordsPerBlock) {
                            flushCurrent();
                        }
                    }
                }
            }

            // Após processar um parágrafo, se estamos próximos do limite, finalize
            if (currentCount >= wordsPerBlock * 0.7) {
                flushCurrent();
            }
        }

        flushCurrent();
        return blocks.filter(b => b.length > 0);
    }

    function getTextBlocksWithCustomLength(text, maxLength) {
        // Detectar parágrafos ANTES de formatar (quebras duplas ou mais)
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const blocks = [];
        let currentBlock = "";

        const flushCurrentBlock = () => {
            if (currentBlock.trim()) {
                blocks.push(currentBlock.trim());
                currentBlock = "";
            }
        };

        for (const paragraph of paragraphs) {
            const formattedParagraph = formatText(paragraph);
            const sentences = splitIntoSentences(formattedParagraph);

            for (const sentence of sentences) {
                const trimmedSentence = sentence.trim();
                if (!trimmedSentence) continue;

                // Se a sentença sozinha já excede o limite, divida-a
                if (trimmedSentence.length > maxLength) {
                    flushCurrentBlock();
                    const splitSentence = splitLongSentence(trimmedSentence, maxLength);
                    blocks.push(...splitSentence.slice(0, -1));
                    currentBlock = splitSentence[splitSentence.length - 1] + " ";
                    continue;
                }

                const potentialBlock = currentBlock + trimmedSentence;

                // Se adicionar esta sentença exceder o limite
                if (potentialBlock.length > maxLength) {
                    flushCurrentBlock();
                    currentBlock = trimmedSentence + " ";
                } else {
                    currentBlock += trimmedSentence + " ";
                }
            }

            // Após processar um parágrafo, se o bloco atual está próximo do limite
            // ou se queremos respeitar a quebra de parágrafo, finalize
            if (currentBlock.trim()) {
                const currentLength = currentBlock.trim().length;
                // Se está acima de 70% do limite, finalize aqui (respeita o parágrafo)
                if (currentLength >= maxLength * 0.7) {
                    flushCurrentBlock();
                }
            }
        }

        flushCurrentBlock();
        return blocks.filter(b => b.length > 0);
    }

    function splitIntoSentences(text) {
        // Divisão mais inteligente considerando abreviações e casos especiais
        const sentences = [];
        const regex = /([.!?]+)\s+/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const sentence = text.substring(lastIndex, match.index + match[1].length);
            // Filtrar sentenças muito curtas que podem ser abreviações
            if (sentence.trim().length > 3) {
                sentences.push(sentence);
                lastIndex = regex.lastIndex;
            } else {
                // Continuar procurando se for muito curto
                continue;
            }
        }

        // Adicionar o resto do texto se houver
        if (lastIndex < text.length) {
            const remaining = text.substring(lastIndex).trim();
            if (remaining) {
                sentences.push(remaining);
            }
        }

        return sentences.length > 0 ? sentences : [text];
    }

    function splitLongSentence(sentence, maxLength) {
        const parts = [];
        let remaining = sentence;

        while (remaining.length > maxLength) {
            // Procurar o melhor ponto de divisão
            let cutIndex = findBestCutPoint(remaining, maxLength);

            if (cutIndex === -1) {
                // Corte forçado se não encontrar um ponto adequado
                cutIndex = maxLength;
            }

            parts.push(remaining.substring(0, cutIndex).trim());
            remaining = remaining.substring(cutIndex).trim();
        }

        if (remaining) {
            parts.push(remaining);
        }

        return parts;
    }

    function findBestCutPoint(text, maxLength) {
        // Prioridade de pontos de corte (do melhor para o pior)
        const cutPoints = [
            { regex: /[.!?]\s/g, priority: 1 },
            { regex: /[;:]\s/g, priority: 2 },
            { regex: /,\s/g, priority: 3 },
            { regex: /\s(?=e\s|ou\s|mas\s|porém\s|contudo\s)/g, priority: 4 },
            { regex: /\s/g, priority: 5 }
        ];

        let bestCutIndex = -1;
        let bestPriority = Infinity;

        for (const cutPoint of cutPoints) {
            const matches = [...text.matchAll(cutPoint.regex)];

            for (const match of matches) {
                const index = match.index + match[0].length - 1;

                if (index <= maxLength && cutPoint.priority < bestPriority) {
                    bestCutIndex = index;
                    bestPriority = cutPoint.priority;
                }
            }

            // Se encontrou um ponto de alta prioridade, use-o
            if (bestPriority <= 3) break;
        }

        return bestCutIndex;
    }

    function formatText(text) {
        return text.replace(/["«»]/g, "'")
                   .replace(/\n/g, " ")
                   .replace(/\s+([.,!?;:])/g, "$1") // Remove espaços ANTES da pontuação
                   .replace(/([.,!?;:])([a-zA-Z])/g, "$1 $2") // Adiciona espaço DEPOIS da pontuação
                   .replace(/([.,!?;:])\s*([.,!?;:])/g, "$1$2")
                   .replace(/\. \. \./g, "...")
                   .replace(/\s+/g, ' ')
                   .trim();
    }

    function escapeRegExp(str) {
        return str.replace(/[\-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    function formatTimestamp(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
    }

    function updatePreview(blocks) {
        // Prévia oculta: função intencionalmente vazia
    }

    function exportToTxt() {
        const fileName = fileNameInput.value || 'documento';
        
        // Usar blocos editados se houver, senão usar blocos do DOM
        let blocksToExport;
        if (editedBlocks.length > 0) {
            blocksToExport = editedBlocks;
        } else {
            const domBlocks = document.querySelectorAll('.block .srt');
            blocksToExport = Array.from(domBlocks).map((block, index) => ({
                id: index,
                content: block.innerText
            }));
        }

        let txtContent = '';
        
        if (blocksToExport.length > 0) {
            blocksToExport.forEach((block, index) => {
                const blockContent = block.content || block.innerText;
                txtContent += `Bloco ${index + 1}:\n${blockContent}\n\n`;
            });
        } else {
            txtContent = textInput.value;
        }

        // Criar e baixar arquivo TXT
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Limpar texto se a opção estiver marcada
        if (clearTextAfterExportCheckbox.checked) {
            textInput.value = '';
        }
    }
});
