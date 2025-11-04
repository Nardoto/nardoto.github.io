// find-replace-utils.js - Módulo Compartilhado para Funcionalidade Find & Replace
// Desenvolvido por Nardoto
// Este módulo centraliza toda a lógica de localizar e substituir para evitar duplicação

console.log("🔍 Find & Replace Utils: Carregado!");

/**
 * Classe para gerenciar funcionalidade de Find & Replace em textareas
 */
class FindReplaceManager {
    constructor(config) {
        this.textareaId = config.textareaId;
        this.findInputId = config.findInputId;
        this.replaceInputId = config.replaceInputId;
        this.findBarId = config.findBarId;
        this.findPrevBtnId = config.findPrevBtnId;
        this.findNextBtnId = config.findNextBtnId;
        this.replaceBtnId = config.replaceBtnId;
        this.replaceAllBtnId = config.replaceAllBtnId;
        this.closeBtnId = config.closeBtnId;
        this.findCountId = config.findCountId;
        this.toggleBtnId = config.toggleBtnId;

        this.currentMatches = [];
        this.currentMatchIndex = -1;

        this.setupListeners();
    }

    /**
     * Configurar todos os event listeners
     */
    setupListeners() {
        const toggleBtn = document.getElementById(this.toggleBtnId);
        const closeBtn = document.getElementById(this.closeBtnId);
        const findInput = document.getElementById(this.findInputId);
        const findPrevBtn = document.getElementById(this.findPrevBtnId);
        const findNextBtn = document.getElementById(this.findNextBtnId);
        const replaceBtn = document.getElementById(this.replaceBtnId);
        const replaceAllBtn = document.getElementById(this.replaceAllBtnId);

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (findInput) {
            findInput.addEventListener('input', () => this.performFind());
        }

        if (findPrevBtn) {
            findPrevBtn.addEventListener('click', () => this.findPrevious());
        }

        if (findNextBtn) {
            findNextBtn.addEventListener('click', () => this.findNext());
        }

        if (replaceBtn) {
            replaceBtn.addEventListener('click', () => this.replaceCurrent());
        }

        if (replaceAllBtn) {
            replaceAllBtn.addEventListener('click', () => this.replaceAll());
        }

        console.log("✅ Find & Replace listeners configurados");
    }

    /**
     * Alternar visibilidade da barra
     */
    toggle() {
        const findBar = document.getElementById(this.findBarId);
        const findInput = document.getElementById(this.findInputId);

        if (!findBar) return;

        if (findBar.classList.contains('hidden') || findBar.style.display === 'none') {
            findBar.classList.remove('hidden');
            findBar.style.display = 'block';
            if (findInput) findInput.focus();
        } else {
            this.close();
        }
    }

    /**
     * Fechar barra de Find & Replace
     */
    close() {
        const findBar = document.getElementById(this.findBarId);
        const findInput = document.getElementById(this.findInputId);
        const replaceInput = document.getElementById(this.replaceInputId);

        if (findBar) {
            findBar.classList.add('hidden');
            findBar.style.display = 'none';
        }

        if (findInput) findInput.value = '';
        if (replaceInput) replaceInput.value = '';

        this.clearHighlights();
        this.updateFindCount();
    }

    /**
     * Realizar busca
     */
    performFind() {
        const findInput = document.getElementById(this.findInputId);
        const textarea = document.getElementById(this.textareaId);

        if (!findInput || !textarea) return;

        const searchText = findInput.value;

        this.clearHighlights();

        if (!searchText) {
            this.updateFindCount();
            return;
        }

        const text = textarea.value;
        this.currentMatches = [];

        let index = 0;
        while (index < text.length) {
            const foundIndex = text.toLowerCase().indexOf(searchText.toLowerCase(), index);
            if (foundIndex === -1) break;

            this.currentMatches.push({
                start: foundIndex,
                end: foundIndex + searchText.length
            });

            index = foundIndex + 1;
        }

        if (this.currentMatches.length > 0) {
            this.currentMatchIndex = 0;
            this.highlightCurrentMatch();
        } else {
            this.currentMatchIndex = -1;
        }

        this.updateFindCount();
    }

    /**
     * Encontrar próxima ocorrência
     */
    findNext() {
        if (this.currentMatches.length === 0) return;

        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.currentMatches.length;
        this.highlightCurrentMatch();
        this.updateFindCount();
    }

    /**
     * Encontrar ocorrência anterior
     */
    findPrevious() {
        if (this.currentMatches.length === 0) return;

        this.currentMatchIndex = this.currentMatchIndex <= 0
            ? this.currentMatches.length - 1
            : this.currentMatchIndex - 1;

        this.highlightCurrentMatch();
        this.updateFindCount();
    }

    /**
     * Destacar match atual
     */
    highlightCurrentMatch() {
        const textarea = document.getElementById(this.textareaId);

        if (!textarea) return;

        if (this.currentMatchIndex >= 0 && this.currentMatchIndex < this.currentMatches.length) {
            const match = this.currentMatches[this.currentMatchIndex];
            textarea.setSelectionRange(match.start, match.end);
            textarea.focus();
        }
    }

    /**
     * Substituir match atual
     */
    replaceCurrent() {
        const replaceInput = document.getElementById(this.replaceInputId);
        const textarea = document.getElementById(this.textareaId);

        if (!replaceInput || !textarea) return;

        const replaceText = replaceInput.value;

        if (this.currentMatchIndex >= 0 && this.currentMatchIndex < this.currentMatches.length) {
            const match = this.currentMatches[this.currentMatchIndex];
            const text = textarea.value;

            const newText = text.substring(0, match.start) + replaceText + text.substring(match.end);
            textarea.value = newText;

            // Ajustar posições dos matches seguintes
            const lengthDiff = replaceText.length - (match.end - match.start);
            for (let i = this.currentMatchIndex + 1; i < this.currentMatches.length; i++) {
                this.currentMatches[i].start += lengthDiff;
                this.currentMatches[i].end += lengthDiff;
            }

            // Remover o match atual
            this.currentMatches.splice(this.currentMatchIndex, 1);

            if (this.currentMatchIndex >= this.currentMatches.length) {
                this.currentMatchIndex = this.currentMatches.length - 1;
            }

            if (this.currentMatches.length > 0 && this.currentMatchIndex >= 0) {
                this.highlightCurrentMatch();
            }

            this.updateFindCount();
        }
    }

    /**
     * Substituir todas as ocorrências
     */
    replaceAll() {
        const findInput = document.getElementById(this.findInputId);
        const replaceInput = document.getElementById(this.replaceInputId);
        const textarea = document.getElementById(this.textareaId);

        if (!findInput || !replaceInput || !textarea) return;

        const searchText = findInput.value;
        const replaceText = replaceInput.value;

        if (!searchText) return;

        const text = textarea.value;
        const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const newText = text.replace(regex, replaceText);

        textarea.value = newText;

        // Limpar matches e refazer busca
        this.currentMatches = [];
        this.currentMatchIndex = -1;
        this.performFind();
    }

    /**
     * Limpar highlights
     */
    clearHighlights() {
        const textarea = document.getElementById(this.textareaId);
        if (textarea) {
            textarea.setSelectionRange(0, 0);
        }
    }

    /**
     * Atualizar contador de matches
     */
    updateFindCount() {
        const findCount = document.getElementById(this.findCountId);

        if (!findCount) return;

        if (this.currentMatches.length === 0) {
            findCount.textContent = '0/0';
        } else {
            findCount.textContent = `${this.currentMatchIndex + 1}/${this.currentMatches.length}`;
        }
    }
}

// Exportar para uso global
window.FindReplaceManager = FindReplaceManager;

console.log("✅ Find & Replace Utils: Pronto para uso!");
