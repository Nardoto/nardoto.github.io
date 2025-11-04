// srt-investigator.js - Investigar como obter timing preciso do Suno

console.log('🔍 Investigating Suno SRT timing sources...');

class SunoSRTInvestigator {
  constructor() {
    this.interceptedData = [];
    this.apiCalls = [];
    this.timingData = new Map();
  }
  
  // Interceptar TODAS as chamadas de rede
  interceptNetworkRequests() {
    console.log('🕵️ Setting up network interception...');
    
    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      console.log('📡 FETCH intercepted:', url);
      
      // Log da requisição
      this.logRequest('FETCH', url, options);
      
      const response = await originalFetch(...args);
      
      // Tentar ler resposta se for JSON
      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();
          console.log('📊 Response data:', data);
          
          // Procurar por dados de timing
          this.analyzeResponseForTiming(url, data);
        } catch (e) {
          console.log('❌ Could not parse JSON response');
        }
      }
      
      return response;
    };
    
    // Interceptar XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      
      const originalOpen = xhr.open;
      xhr.open = function(method, url, ...args) {
        console.log('📡 XHR intercepted:', method, url);
        return originalOpen.call(this, method, url, ...args);
      };
      
      const originalSend = xhr.send;
      xhr.send = function(data) {
        console.log('📤 XHR sending:', data);
        
        xhr.addEventListener('load', () => {
          console.log('📥 XHR response:', xhr.responseText);
          try {
            const responseData = JSON.parse(xhr.responseText);
            console.log('📊 XHR JSON:', responseData);
          } catch (e) {
            // Not JSON
          }
        });
        
        return originalSend.call(this, data);
      };
      
      return xhr;
    };
  }
  
  logRequest(type, url, options) {
    this.apiCalls.push({
      type,
      url,
      options,
      timestamp: Date.now()
    });
    
    // Procurar por URLs suspeitas que podem conter timing
    const suspiciousPatterns = [
      '/lyrics',
      '/timing', 
      '/srt',
      '/subtitles',
      '/transcript',
      '/audio/analyze',
      '/sync',
      '/captions'
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      url.toLowerCase().includes(pattern)
    );
    
    if (isSuspicious) {
      console.log('🚨 SUSPICIOUS URL DETECTED:', url);
    }
  }
  
  analyzeResponseForTiming(url, data) {
    // Procurar por estruturas que possam conter timing
    const hasTimingData = this.deepSearchForTiming(data);
    
    if (hasTimingData) {
      console.log('⏰ TIMING DATA FOUND in response from:', url);
      console.log('📋 Data:', hasTimingData);
      this.timingData.set(url, hasTimingData);
    }
  }
  
  deepSearchForTiming(obj, path = '') {
    if (!obj || typeof obj !== 'object') return null;
    
    // Procurar por propriedades que podem conter timing
    const timingKeys = [
      'timing', 'timestamps', 'srt', 'subtitles', 'lyrics_timing',
      'word_timing', 'syllable_timing', 'sync_data', 'captions',
      'start_time', 'end_time', 'duration', 'offset'
    ];
    
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Verificar se a chave é suspeita
      if (timingKeys.some(timingKey => 
        key.toLowerCase().includes(timingKey.toLowerCase())
      )) {
        console.log(`🎯 Found timing-related key: ${currentPath}`, obj[key]);
        return { path: currentPath, data: obj[key] };
      }
      
      // Busca recursiva
      if (typeof obj[key] === 'object') {
        const found = this.deepSearchForTiming(obj[key], currentPath);
        if (found) return found;
      }
      
      // Verificar se o valor parece ser timing (formato HH:MM:SS ou timestamp)
      if (typeof obj[key] === 'string') {
        const timePatterns = [
          /\d{2}:\d{2}:\d{2},\d{3}/, // SRT format
          /\d{2}:\d{2}:\d{2}\.\d{3}/, // Subtitle format
          /^\d+\.\d{3}$/ // Decimal seconds
        ];
        
        if (timePatterns.some(pattern => pattern.test(obj[key]))) {
          console.log(`⏱️ Found time-like value at ${currentPath}:`, obj[key]);
          return { path: currentPath, data: obj[key] };
        }
      }
    }
    
    return null;
  }
  
  // Interceptar WebSocket para dados em tempo real
  interceptWebSockets() {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      console.log('🌐 WebSocket created:', url);
      
      const ws = new originalWebSocket(url, protocols);
      
      ws.addEventListener('message', (event) => {
        console.log('📨 WebSocket message:', event.data);
        
        try {
          const data = JSON.parse(event.data);
          console.log('📊 WebSocket JSON:', data);
          
          // Analisar dados do WebSocket
          const timingData = this.deepSearchForTiming(data);
          if (timingData) {
            console.log('⏰ TIMING DATA in WebSocket:', timingData);
          }
        } catch (e) {
          // Not JSON
        }
      });
      
      return ws;
    };
  }
  
  // Analisar elementos DOM em busca de dados de timing
  analyzeDOMForTiming() {
    console.log('🔍 Analyzing DOM for timing data...');
    
    // Procurar por scripts que podem conter dados
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script, index) => {
      if (script.textContent) {
        // Procurar por estruturas JSON com timing
        const jsonMatches = script.textContent.match(/\{[^}]*"[^"]*time[^"]*"[^}]*\}/gi);
        if (jsonMatches) {
          console.log(`📜 Found timing-like JSON in script ${index}:`, jsonMatches);
        }
        
        // Procurar por arrays de timing
        const arrayMatches = script.textContent.match(/\[[^\]]*\d+:\d+:\d+[^\]]*\]/gi);
        if (arrayMatches) {
          console.log(`📋 Found timing-like arrays in script ${index}:`, arrayMatches);
        }
      }
    });
    
    // Procurar por elementos data-* com timing
    const elementsWithData = document.querySelectorAll('[data-*]');
    elementsWithData.forEach(el => {
      [...el.attributes].forEach(attr => {
        if (attr.name.startsWith('data-') && 
            (attr.name.includes('time') || attr.name.includes('timing'))) {
          console.log('📊 Found timing data attribute:', attr.name, attr.value);
        }
      });
    });
  }
  
  // Analisar player de áudio para eventos de timing
  analyzeAudioPlayer() {
    console.log('🎵 Analyzing audio players...');
    
    const audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach((media, index) => {
      console.log(`🎵 Found media element ${index}:`, media.src);
      
      // Interceptar eventos de tempo
      media.addEventListener('timeupdate', () => {
        console.log(`⏰ Media ${index} time:`, media.currentTime);
      });
      
      // Verificar se tem tracks (legendas/timing)
      const tracks = media.querySelectorAll('track');
      tracks.forEach((track, trackIndex) => {
        console.log(`📝 Found track ${trackIndex}:`, track.src, track.kind);
      });
    });
  }
  
  // Procurar por bibliotecas de sincronização
  findSyncLibraries() {
    console.log('📚 Looking for sync libraries...');
    
    // Verificar window global para bibliotecas conhecidas
    const syncLibraries = [
      'VideoJS', 'Plyr', 'JWPlayer', 'Flowplayer',
      'SubtitleJS', 'WebVTT', 'SRT', 'TimedText'
    ];
    
    syncLibraries.forEach(lib => {
      if (window[lib]) {
        console.log(`📚 Found sync library: ${lib}`, window[lib]);
      }
    });
    
    // Procurar por objetos que podem conter timing
    for (const prop in window) {
      if (typeof window[prop] === 'object' && window[prop] !== null) {
        const obj = window[prop];
        if (obj.timing || obj.sync || obj.subtitle || obj.srt) {
          console.log(`🎯 Found timing-related global object: ${prop}`, obj);
        }
      }
    }
  }
  
  // Executar todas as análises
  startInvestigation() {
    console.log('🚀 Starting Suno SRT investigation...');
    
    this.interceptNetworkRequests();
    this.interceptWebSockets();
    this.analyzeDOMForTiming();
    this.analyzeAudioPlayer();
    this.findSyncLibraries();
    
    // Relatório periódico
    setInterval(() => {
      this.generateReport();
    }, 10000); // A cada 10 segundos
  }
  
  generateReport() {
    console.log('📋 === INVESTIGATION REPORT ===');
    console.log(`📡 API calls intercepted: ${this.apiCalls.length}`);
    console.log(`⏰ Timing data found: ${this.timingData.size}`);
    
    if (this.timingData.size > 0) {
      console.log('🎯 TIMING DATA SOURCES:');
      this.timingData.forEach((data, url) => {
        console.log(`  🔗 ${url}:`, data);
      });
    }
    
    console.log('================================');
  }
}

// Executar investigação automaticamente
const investigator = new SunoSRTInvestigator();
investigator.startInvestigation();

// Expor para debugging manual
window.sunoSRTInvestigator = investigator;