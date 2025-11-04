document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const videoCountInput = document.getElementById('videoCount');
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  const linksListTextarea = document.getElementById('linksList');
  const linkCountSpan = document.getElementById('linkCount');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');

  extractBtn.addEventListener('click', async () => {
    const count = parseInt(videoCountInput.value);

    if (!count || count < 1) {
      showStatus('Por favor, insira um número válido de vídeos.', 'error');
      return;
    }

    showStatus('Extraindo links...', 'loading');
    extractBtn.disabled = true;

    try {
      // Obtém a aba ativa
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Verifica se está no YouTube
      if (!tab.url.includes('youtube.com')) {
        showStatus('Por favor, abra uma página do YouTube primeiro!', 'error');
        extractBtn.disabled = false;
        return;
      }

      // Injeta e executa o script de extração
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractVideoLinks,
        args: [count]
      });

      const links = results[0].result;

      if (links && links.length > 0) {
        displayResults(links);
        showStatus(`${links.length} link(s) extraído(s) com sucesso!`, 'success');
      } else {
        showStatus('Nenhum link encontrado. Role a página para carregar mais vídeos.', 'warning');
      }
    } catch (error) {
      showStatus('Erro ao extrair links: ' + error.message, 'error');
      console.error(error);
    } finally {
      extractBtn.disabled = false;
    }
  });

  copyBtn.addEventListener('click', () => {
    linksListTextarea.select();
    document.execCommand('copy');
    showStatus('Links copiados para a área de transferência!', 'success');
  });

  clearBtn.addEventListener('click', () => {
    linksListTextarea.value = '';
    linkCountSpan.textContent = '0';
    resultsDiv.classList.add('hidden');
    showStatus('', '');
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
  }

  function displayResults(links) {
    linksListTextarea.value = links.join('\n');
    linkCountSpan.textContent = links.length;
    resultsDiv.classList.remove('hidden');
  }
});

// Função que será injetada na página do YouTube
function extractVideoLinks(maxCount) {
  const links = new Set();

  // Busca todos os elementos de vídeo na página
  const videoElements = document.querySelectorAll('a#video-title-link, a#video-title, ytd-grid-video-renderer a, ytd-video-renderer a#thumbnail');

  videoElements.forEach(element => {
    if (links.size >= maxCount) return;

    const href = element.href;
    if (href && href.includes('/watch?v=')) {
      // Extrai apenas o link base sem parâmetros extras
      const url = new URL(href);
      const videoId = url.searchParams.get('v');
      if (videoId) {
        links.add(`https://www.youtube.com/watch?v=${videoId}`);
      }
    }
  });

  return Array.from(links).slice(0, maxCount);
}
