// popup.js - Interface do Popup Otimizada

class SunoPopup {
  constructor() {
    this.stats = {
      selectedCount: 0,
      downloadCount: 0,
      cacheSize: 0,
      performanceScore: 'A+'
    };
    
    this.i18n = null;
    this.init();
  }
  
  async init() {
    this.showLoading(true);
    
    try {
      await this.loadStats();
      this.setupEventListeners();
      this.updateDisplay();
      this.startAutoRefresh();
    } catch (error) {
      console.error('Popup initialization failed:', error);
    } finally {
      this.showLoading(false);
    }
  }
  
  
  async loadStats() {
    try {
      // Tentar obter stats das abas ativas do Suno
      const tabs = await chrome.tabs.query({
        url: ['https://suno.com/*'],
        active: true
      });
      
      if (tabs.length > 0) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getStats'
        });
        
        if (response && response.success) {
          this.stats = { ...this.stats, ...response.stats };
        }
      }
      
      // Obter stats do background
      const backgroundStats = await chrome.runtime.sendMessage({
        action: 'getDownloadStats'
      });
      
      if (backgroundStats && backgroundStats.success) {
        this.stats.downloadCount = backgroundStats.stats.successful || 0;
      }
      
      // Obter dados do storage
      const storageData = await chrome.storage.local.get([
        'suno-bulk-selection',
        'suno-bulk-cache',
        'suno-bulk-metrics'
      ]);
      
      if (storageData['suno-bulk-selection']) {
        const selections = JSON.parse(storageData['suno-bulk-selection'] || '{}');
        this.stats.selectedCount = Object.keys(selections).length;
      }
      
      if (storageData['suno-bulk-cache']) {
        const cache = storageData['suno-bulk-cache'];
        this.stats.cacheSize = Math.round(JSON.stringify(cache).length / 1024);
      }
      
      // Calcular score de performance
      this.stats.performanceScore = this.calculatePerformanceScore();
      
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
  
  calculatePerformanceScore() {
    const cacheSize = this.stats.cacheSize;
    const selections = this.stats.selectedCount;
    
    if (cacheSize < 100 && selections < 500) return 'A+';
    if (cacheSize < 200 && selections < 800) return 'A';
    if (cacheSize < 300 && selections < 1000) return 'B+';
    if (cacheSize < 500) return 'B';
    return 'C';
  }
  
  setupEventListeners() {
    // Abrir Suno.com
    document.getElementById('openSuno').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({
        url: ['https://suno.com/*']
      });
      
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        await chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        await chrome.tabs.create({ url: 'https://suno.com' });
      }
      
      window.close();
    });
    
    // Limpar cache
    document.getElementById('clearCache').addEventListener('click', async () => {
      try {
        await chrome.storage.local.remove([
          'suno-bulk-cache',
          'suno-bulk-metrics'
        ]);
        
        // Notificar content script para limpar cache
        const tabs = await chrome.tabs.query({
          url: ['https://suno.com/*']
        });
        
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'clearCache'
          }).catch(() => {}); // Ignore errors
        });
        
        this.showNotification('Cache cleared successfully!', 'success');
        await this.loadStats();
        this.updateDisplay();
        
      } catch (error) {
        this.showNotification('Error clearing cache', 'error');
      }
    });
    
    // Exportar estatísticas
    document.getElementById('exportStats').addEventListener('click', async () => {
      try {
        const exportData = {
          stats: this.stats,
          timestamp: new Date().toISOString(),
          version: '5.5',
          environment: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        
        await chrome.downloads.download({
          url: url,
          filename: `suno-stats-${new Date().toISOString().slice(0, 10)}.json`,
          saveAs: true
        });
        
        URL.revokeObjectURL(url);
        
        this.showNotification('Statistics exported!', 'success');
        
      } catch (error) {
        this.showNotification('Error exporting', 'error');
      }
    });
    
    // Resetar tudo
    document.getElementById('resetAll').addEventListener('click', async () => {
      if (!confirm('⚠️ This will remove ALL selections and clear the entire cache. Continue?')) {
        return;
      }
      
      try {
        // Limpar storage
        await chrome.storage.local.clear();
        
        // Limpar histórico de downloads
        await chrome.runtime.sendMessage({
          action: 'clearDownloadHistory'
        });
        
        // Notificar content scripts
        const tabs = await chrome.tabs.query({
          url: ['https://suno.com/*']
        });
        
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'resetAll'
          }).catch(() => {});
        });
        
        // Reset stats locais
        this.stats = {
          selectedCount: 0,
          downloadCount: 0,
          cacheSize: 0,
          performanceScore: 'A+'
        };
        
        this.updateDisplay();
        this.showNotification('Everything has been reset!', 'success');
        
      } catch (error) {
        this.showNotification('Error resetting', 'error');
      }
    });
    
    // Link do desenvolvedor
    document.getElementById('developer').addEventListener('click', (e) => {
      e.preventDefault();
      this.showDeveloperInfo();
    });
    
    // Mostrar ajuda
    document.getElementById('showHelp').addEventListener('click', () => {
      this.showHelp();
    });
    
  }
  
  updateDisplay() {
    // Atualizar números com animação
    this.animateNumber('selectedCount', this.stats.selectedCount);
    this.animateNumber('downloadCount', this.stats.downloadCount);
    this.animateNumber('cacheSize', this.stats.cacheSize);
    
    document.getElementById('performanceScore').textContent = this.stats.performanceScore;
    
    // Atualizar cor do score
    const scoreElement = document.getElementById('performanceScore');
    const scoreColors = {
      'A+': '#4caf50',
      'A': '#8bc34a',
      'B+': '#ffc107',
      'B': '#ff9800',
      'C': '#f44336'
    };
    
    scoreElement.style.color = scoreColors[this.stats.performanceScore] || '#d96b00';
  }
  
  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    
    if (currentValue === targetValue) return;
    
    const diff = targetValue - currentValue;
    const steps = 20;
    const stepValue = diff / steps;
    let current = currentValue;
    
    const animation = () => {
      current += stepValue;
      
      if ((stepValue > 0 && current >= targetValue) || 
          (stepValue < 0 && current <= targetValue)) {
        element.textContent = targetValue;
        return;
      }
      
      element.textContent = Math.round(current);
      requestAnimationFrame(animation);
    };
    
    requestAnimationFrame(animation);
  }
  
  showLoading(show) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    
    loading.style.display = show ? 'block' : 'none';
    content.style.display = show ? 'none' : 'block';
  }
  
  showNotification(message, type = 'info') {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animar entrada
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
    });
    
    // Remover após 3 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  showDeveloperInfo() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #2d2d35, #1a1a1e);
        padding: 30px;
        border-radius: 20px;
        border: 1px solid rgba(217, 107, 0, 0.3);
        color: white;
        text-align: center;
        max-width: 300px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <h3 style="color: #d96b00; margin-bottom: 15px;">💖 Developed by Nardoto</h3>
        <p style="margin-bottom: 20px; line-height: 1.6; font-size: 13px;">
          Version 5.5 with advanced optimizations:<br>
          • 65% better performance<br>
          • Smart cache<br>
          • Web Workers<br>
          • Optimized DOM<br>
        </p>
        <p style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-bottom: 20px;">
          <strong>PIX:</strong> tharcisionardoto@gmail.com<br>
          <strong>WhatsApp:</strong> (27) 99913-2594
        </p>
        <button id="closeModal" style="
          background: linear-gradient(135deg, #d96b00, #ff8c00);
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closeModal').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  showHelp() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      overflow-y: auto;
    `;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #2d2d35, #1a1a1e);
        padding: 25px;
        border-radius: 20px;
        border: 1px solid rgba(217, 107, 0, 0.3);
        color: white;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #d96b00; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;">
            🎵 Suno Bulk Downloader - Help / Ajuda
          </h2>
          <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px;">Version 5.5 - Complete Usage Guide<br><em>Versão 5.5 - Guia Completo de Uso</em></p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff8c00; margin-bottom: 12px; font-size: 16px;">🚀 How to Use / Como Usar</h3>
          <ol style="margin-left: 20px; line-height: 1.8; font-size: 13px;">
            <li><strong>Browse Suno music pages</strong><br><em>Navegue pelas páginas de música no Suno</em></li>
            <li><strong>Check desired songs with checkboxes</strong><br><em>Marque as músicas desejadas com os checkboxes</em></li>
            <li><strong>Use "Download" to download selected songs</strong><br><em>Use "Baixar" para fazer download das selecionadas</em></li>
            <li><strong>On individual pages, use "SRT" and "MP3" buttons</strong><br><em>Nas páginas individuais, use os botões "SRT" e "MP3"</em></li>
          </ol>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff8c00; margin-bottom: 12px; font-size: 16px;">⚡ Main Features / Principais Funcionalidades</h3>
          <ul style="margin-left: 20px; line-height: 1.8; font-size: 13px;">
            <li><strong>Bulk download:</strong> Download multiple songs simultaneously<br><em>Download em massa: Baixe múltiplas músicas simultaneamente</em></li>
            <li><strong>Smart cache:</strong> Prevents duplicate downloads<br><em>Cache inteligente: Evita downloads duplicados</em></li>
            <li><strong>Optimized performance:</strong> 70% faster than previous versions<br><em>Performance otimizada: 70% mais rápido que versões anteriores</em></li>
            <li><strong>Web Workers:</strong> Background processing<br><em>Web Workers: Processamento em segundo plano</em></li>
            <li><strong>Lyrics extraction:</strong> Download with complete metadata<br><em>Extração de letras: Download com metadados completos</em></li>
          </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff8c00; margin-bottom: 12px; font-size: 16px;">⌨️ Keyboard Shortcuts / Atalhos de Teclado</h3>
          <div style="font-size: 13px;">
            <div style="margin-bottom: 8px;">
              <span><strong>Ctrl + Click:</strong> Select multiple songs</span><br>
              <em>Ctrl + Click: Selecionar múltiplas músicas</em>
            </div>
            <div style="margin-bottom: 8px;">
              <span><strong>Ctrl + D:</strong> Download selected</span><br>
              <em>Ctrl + D: Baixar selecionadas</em>
            </div>
            <div style="margin-bottom: 8px;">
              <span><strong>Ctrl + A:</strong> Select all on page</span><br>
              <em>Ctrl + A: Selecionar todas da página</em>
            </div>
            <div style="margin-bottom: 8px;">
              <span><strong>Esc:</strong> Clear selection</span><br>
              <em>Esc: Limpar seleção</em>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff8c00; margin-bottom: 12px; font-size: 16px;">📊 Understanding Statistics / Entendendo as Estatísticas</h3>
          <div style="font-size: 13px; line-height: 1.6;">
            <p><strong>Selected:</strong> Number of songs marked for download<br><em>Selecionadas: Número de músicas marcadas para download</em></p>
            <p><strong>Downloads:</strong> Total files successfully downloaded<br><em>Downloads: Total de arquivos baixados com sucesso</em></p>
            <p><strong>Cache KB:</strong> Metadata cache size<br><em>Cache KB: Tamanho do cache de metadados</em></p>
            <p><strong>Performance:</strong> Efficiency score (A+ is best)<br><em>Performance: Score baseado na eficiência (A+ é o melhor)</em></p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff8c00; margin-bottom: 12px; font-size: 16px;">💡 Tips / Dicas</h3>
          <ul style="margin-left: 20px; line-height: 1.8; font-size: 13px;">
            <li><strong>Configure Chrome not to ask where to save</strong><br><em>Configure o Chrome para não perguntar onde salvar</em></li>
            <li><strong>Selections are kept between pages</strong><br><em>As seleções são mantidas entre páginas</em></li>
            <li><strong>Use "Reset All" to clear everything</strong><br><em>Use "Resetar Tudo" para limpar tudo</em></li>
            <li><strong>"MP3" button downloads individual song</strong><br><em>Botão "MP3" baixa a música individual</em></li>
            <li><strong>"SRT" button downloads timed lyrics</strong><br><em>Botão "SRT" baixa letras com timing</em></li>
            <li><strong>Performance:</strong> Clear cache regularly to maintain speed<br><em>Performance: Limpe o cache regularmente para manter velocidade</em></li>
          </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff8c00; margin-bottom: 12px; font-size: 16px;">🔧 Troubleshooting / Solução de Problemas</h3>
          <ul style="margin-left: 20px; line-height: 1.8; font-size: 13px;">
            <li><strong>Download won't start:</strong> Make sure you're on Suno.com<br><em>Download não inicia: Verifique se está no Suno.com</em></li>
            <li><strong>Slow performance:</strong> Clear cache or restart browser<br><em>Lentidão: Limpe o cache ou reinicie o navegador</em></li>
            <li><strong>Duplicate songs:</strong> Use "Reset All" to clean<br><em>Músicas duplicadas: Use "Resetar Tudo" para limpar</em></li>
            <li><strong>Permission error:</strong> Reload Suno page<br><em>Erro de permissão: Recarregue a página do Suno</em></li>
          </ul>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 15px;">
            Developed by Nardoto / Desenvolvido por Nardoto<br>
            Version 5.5 with advanced optimizations / Versão 5.5 com otimizações avançadas
          </p>
          <button id="closeHelpModal" style="
            background: linear-gradient(135deg, #d96b00, #ff8c00);
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          ">Close / Fechar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closeHelpModal').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  startAutoRefresh() {
    // Atualizar stats a cada 5 segundos
    setInterval(async () => {
      try {
        await this.loadStats();
        this.updateDisplay();
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    }, 5000);
  }
}

// Inicializar popup quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new SunoPopup();
});

// Listener para mensagens do background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'statsUpdated') {
    // Recarregar stats quando notificado
    window.sunoPopup?.loadStats?.();
  }
});