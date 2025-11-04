// help-modal.js - Módulo independente para o botão de ajuda
class HelpModal {
  constructor() {
    this.init();
  }

  init() {
    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachHelpButton());
    } else {
      this.attachHelpButton();
    }

    // Conteúdo bilíngue fixo (sem i18n) — EN primeiro, PT em menor abaixo
    this.EN = {
      title: 'SUNO LoopLess Download',
      how: 'How to use:',
      tips: 'Tips:',
      features: 'Features:',
      steps: [
        'Browse Suno pages',
        'Check desired songs',
        'Use Download to get all selected',
        'Use MP3 and SRT buttons on each song'
      ],
      tipsList: [
        'Disable Chrome “Ask where to save” to avoid pop‑ups',
        'Selections persist when navigating pages',
        'Use Clear All to reset everything',
        'SRT downloads synchronized lyrics',
        'Works on lists, profiles and individual pages'
      ],
      featuresList: [
        'Bulk download multiple songs',
        'Lyrics timing extraction (SRT)',
        'Persistent selection across pages',
        'Simple, intuitive UI'
      ],
      startTour: 'Start Tour',
      close: 'Close'
    };
    this.PT = {
      titleSmall: 'Ajuda da extensão',
      how: 'Como usar:',
      tips: 'Dicas:',
      features: 'Recursos:',
      steps: [
        'Navegue pelas páginas do Suno',
        'Marque as músicas desejadas',
        'Use Download para baixar as selecionadas',
        'Use os botões MP3 e SRT em cada música'
      ],
      tipsList: [
        'Desative “Perguntar onde salvar” no Chrome para evitar pop‑ups',
        'As seleções persistem ao navegar entre páginas',
        'Use Limpar Tudo para reiniciar',
        'SRT baixa as letras sincronizadas (karaokê)',
        'Funciona em listas, perfis e páginas individuais'
      ],
      featuresList: [
        'Baixe várias músicas em lote',
        'Extração de sincronização das letras (SRT)',
        'Seleção persistente entre páginas',
        'Interface simples e intuitiva'
      ],
      startTour: 'Iniciar Tour',
      close: 'Fechar'
    };
  }

  attachHelpButton() {
    // Procura pelo botão de ajuda periodicamente
    const checkForHelpButton = () => {
      const helpButton = document.getElementById('sbd-help');
      if (helpButton && !helpButton.dataset.helpAttached) {
        helpButton.dataset.helpAttached = 'true';
        helpButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showHelpModal();
        });
        console.log('Help button attached successfully');
        return true;
      }
      return false;
    };

    // Tenta anexar imediatamente
    if (!checkForHelpButton()) {
      // Se não encontrar, tenta a cada 500ms por 10 segundos
      const interval = setInterval(() => {
        if (checkForHelpButton()) {
          clearInterval(interval);
        }
      }, 500);

      // Para de tentar após 10 segundos
      setTimeout(() => clearInterval(interval), 10000);
    }
  }

  showHelpModal() {
    // Inicia o tour interativo diretamente
    if (window.sunoTour) {
      window.sunoTour.startTour();
    } else {
      // Fallback se o tour não estiver carregado
  console.warn('Interactive tour not found, opening help modal...');
      this.showFallbackModal();
    }
  }

  showFallbackModal() {
    // Remove modal existente se houver
    const existingModal = document.getElementById('suno-help-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Cria o modal
    const modal = this.createModal();
    document.body.appendChild(modal);

    // Mostra o modal
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modal.querySelector('.help-modal-content').style.transform = 'scale(1)';
    });
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'suno-help-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div class="help-modal-content" style="
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        border: 1px solid #444;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        position: relative;
        margin: auto;
      ">
        <button id="close-help-modal" style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          line-height: 1;
        ">×</button>
        
        <h2 style="color: #d96b00; margin-bottom: 20px; text-align: center; font-size: 24px;">
          🎵 ${this.EN.title}
          <div style="color:#aaa; font-size:14px; margin-top:6px;">${this.PT.titleSmall}</div>
        </h2>
        
        <div style="color: #fff; line-height: 1.6;">
          <h3 style="color: #ff8c00; margin: 20px 0 12px 0; font-size: 18px;">📖 ${this.EN.how}<div style="color:#aaa; font-size:12px;">${this.PT.how}</div></h3>
          <ul style="margin: 0 0 20px 20px; padding: 0;">
            <li style="margin-bottom: 8px;">${this.EN.steps[0]}<div style="color:#aaa; font-size:12px;">${this.PT.steps[0]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.steps[1]}<div style="color:#aaa; font-size:12px;">${this.PT.steps[1]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.steps[2]}<div style="color:#aaa; font-size:12px;">${this.PT.steps[2]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.steps[3]}<div style="color:#aaa; font-size:12px;">${this.PT.steps[3]}</div></li>
          </ul>

          <h3 style="color: #ff8c00; margin: 20px 0 12px 0; font-size: 18px;">💡 ${this.EN.tips}<div style="color:#aaa; font-size:12px;">${this.PT.tips}</div></h3>
          <ul style="margin: 0 0 20px 20px; padding: 0;">
            <li style="margin-bottom: 8px;">${this.EN.tipsList[0]}<div style="color:#aaa; font-size:12px;">${this.PT.tipsList[0]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.tipsList[1]}<div style="color:#aaa; font-size:12px;">${this.PT.tipsList[1]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.tipsList[2]}<div style="color:#aaa; font-size:12px;">${this.PT.tipsList[2]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.tipsList[3]}<div style="color:#aaa; font-size:12px;">${this.PT.tipsList[3]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.tipsList[4]}<div style="color:#aaa; font-size:12px;">${this.PT.tipsList[4]}</div></li>
          </ul>

          <h3 style="color: #ff8c00; margin: 20px 0 12px 0; font-size: 18px;">⚙️ ${this.EN.features}<div style="color:#aaa; font-size:12px;">${this.PT.features}</div></h3>
          <ul style="margin: 0 0 20px 20px; padding: 0;">
            <li style="margin-bottom: 8px;">${this.EN.featuresList[0]}<div style="color:#aaa; font-size:12px;">${this.PT.featuresList[0]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.featuresList[1]}<div style="color:#aaa; font-size:12px;">${this.PT.featuresList[1]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.featuresList[2]}<div style="color:#aaa; font-size:12px;">${this.PT.featuresList[2]}</div></li>
            <li style="margin-bottom: 8px;">${this.EN.featuresList[3]}<div style="color:#aaa; font-size:12px;">${this.PT.featuresList[3]}</div></li>
          </ul>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #444;">
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
              <button id="start-tour-btn" style="
                background: linear-gradient(45deg, #d96b00, #ff8c00);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(217, 107, 0, 0.3);
              ">${this.EN.startTour}<div style=\"color:#ddd; font-size:11px; font-weight:400;\">${this.PT.startTour}</div></button>
              <button id="close-help-btn" style="
                background: #444;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
              ">${this.EN.close}<div style=\"color:#ddd; font-size:11px; font-weight:400;\">${this.PT.close}</div></button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos para fechar o modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    modal.querySelector('#close-help-modal').addEventListener('click', () => {
      this.closeModal(modal);
    });

    modal.querySelector('#close-help-btn').addEventListener('click', () => {
      this.closeModal(modal);
    });

    modal.querySelector('#start-tour-btn').addEventListener('click', () => {
      this.closeModal(modal);
      // Aguarda o modal fechar antes de iniciar o tour
      setTimeout(() => {
        if (window.sunoTour) {
          window.sunoTour.startTour();
        }
      }, 400);
    });

    // Fechar com ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    return modal;
  }

  closeModal(modal) {
    modal.style.opacity = '0';
    modal.querySelector('.help-modal-content').style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }
  
  updateModalTexts() {
  // Modal usa conteúdo estático bilíngue; nada para atualizar
  }
}

// Inicializa o módulo de ajuda
new HelpModal();