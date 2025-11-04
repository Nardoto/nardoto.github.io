// Versão legível do contentScript.js da extensão modelo
// Extraída a partir do código minificado

// Função para criar botão
function createButton(text, clickHandler) {
  const button = document.createElement("button");
  button.innerText = text;
  button.className = "font-sans font-medium text-center rounded-md cursor-pointer bg-quaternary text-primary hover:bg-primary/30 hover:text-primary px-3 py-2 min-w-0 text-sm block w-full";
  button.addEventListener("click", clickHandler);
  return button;
}

// Função para formatar tempo SRT
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor(seconds % 1 * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

// Função principal para processar a página
async function processPage() {
  // Extrair ID da música da URL
  const songId = window.location.pathname.split("/").pop() || "";
  if (!songId) {
    console.error("Could not extract song ID from URL");
    return;
  }

  // Extrair token de sessão dos cookies
  const sessionToken = "; ".concat(document.cookie).split("; __session=").length === 2 
    ? "; ".concat(document.cookie).split("; __session=").pop().split(";").shift() 
    : undefined;
    
  if (!sessionToken) {
    console.error("Session token not found in cookies");
    return;
  }

  // Buscar dados alinhados da API
  const alignedWords = await fetchAlignedWords(songId, sessionToken);
  
  if (alignedWords) {
    addButtonsToSongImages(songId, alignedWords);
  } else {
    console.error("No aligned words data available for this song");
  }
}

// Função para buscar palavras alinhadas
async function fetchAlignedWords(songId, sessionToken) {
  try {
    const response = await fetch(`https://studio-api.prod.suno.com/api/gen/${songId}/aligned_lyrics/v2/`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.aligned_words?.length ? data.aligned_words : null;
  } catch (error) {
    console.error("Error fetching aligned words:", error);
    return null;
  }
}

// Função para adicionar botões nas imagens das músicas
function addButtonsToSongImages(songId, alignedWords) {
  // PONTO CHAVE: Busca por imagens com o songId no src
  const images = document.querySelectorAll(`div>img[src*="${songId}"].w-full.h-full`);
  
  if (!images.length) {
    console.warn(`No images found for song ID: ${songId}`);
    return;
  }
  
  images.forEach(function(image) {
    const parentDiv = image.parentElement;
    if (!parentDiv) return;
    
    // Criar container para os botões
    const buttonContainer = createButtonContainer();
    
    // Adicionar botões de download
    const downloadButton = createButton(
      chrome.i18n.getMessage("download_lyric", ["SRT"]), 
      function(event) {
        event.preventDefault();
        event.stopPropagation();
        downloadFile(songId, alignedWords, "srt");
      }
    );
    
    const toggleButton = createButton(
      chrome.i18n.getMessage("toggle_type", ["LRC"]), 
      function(event) {
        event.preventDefault();
        event.stopPropagation();
        // Toggle entre SRT e LRC
      }
    );
    
    buttonContainer.appendChild(toggleButton);
    buttonContainer.appendChild(downloadButton);
    
    // PONTO CHAVE: Adicionar container ao elemento pai da imagem
    parentDiv.appendChild(buttonContainer);
  });
}

// Função para criar container dos botões
function createButtonContainer() {
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    bottom: "0",
    left: "0", 
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  });
  return container;
}

// Função para fazer download do arquivo
function downloadFile(songId, alignedWords, format) {
  let content;
  
  if (format === "srt") {
    content = alignedWords.map(function(word, index) {
      const startTime = formatSRTTime(word.start_s);
      const endTime = formatSRTTime(word.end_s);
      return `${index + 1}\n${startTime} --> ${endTime}\n${word.word}\n`;
    }).join("\n");
  } else {
    // LRC format
    content = alignedWords.map(function(word) {
      const time = formatLRCTime(word.start_s);
      return `${time}${word.word}`;
    }).join("\n");
  }
  
  const filename = `${songId}-lyrics-${chrome.i18n.getMessage("extension_name").toLowerCase().replace(/\s+/g, "-")}.${format}`;
  const blob = new Blob([content], { type: `text/${format}` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Event listeners
chrome.runtime.onMessage.addListener(function(message) {
  console.log("Content script received message:", message);
  
  if (message.action === "URL_CHANGED" && message.songId) {
    console.log("URL changed to song page with ID:", message.songId);
    setTimeout(processPage, 1000);
  } else if (message.action === "MANUALLY_TRIGGER") {
    console.log("Manual trigger received");
    processPage();
  }
  
  return true;
});

// Execução inicial
setTimeout(function() {
  if (window.location.pathname.startsWith("/song/")) {
    processPage();
  }
}, 3000);