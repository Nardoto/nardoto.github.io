// background.js - Service Worker Otimizado para Suno Bulk Downloader

// Intent cache for filename suggestions
// We keep per-tab intents and a global fallback for downloads initiated by the service worker.
// Each intent expires shortly after being set and is consumed once.
class SunoBackgroundService {
  constructor() {
    this.downloadQueue = new Map();
    this.activeDownloads = new Set();
    this.maxConcurrentDownloads = 3;
    this.retryAttempts = 3;
  this.nameIntentsByTab = new Map(); // tabId -> { base, extHint, expires }
  this.globalIntent = null; // { base, extHint, expires }
  this.lastTitleByTab = new Map(); // tabId -> { title, ts }
    this.downloadStats = {
      successful: 0,
      failed: 0,
      totalSize: 0,
      startTime: null
    };
    
    this.init();
  }
  
  init() {
    this.setupMessageListener();
    this.setupDownloadListener();
  this.setupFilenameDeterminer();
    this.setupErrorHandling();
    
    console.log('🎵 Suno Background Service initialized');
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });
  }
  
  async handleMessage(message, sender, sendResponse) {
    try {
      // Support lightweight intent messages from content scripts
      if (message?.type === 'pmu-set-filename') {
        const base = this.sanitizeBaseName(message.base);
        const ext = message.ext || null; // 'srt' | 'mp3' | etc
        const expires = Date.now() + 8000; // valid for 8s
        // Per-tab intent when available
        const tabId = sender?.tab?.id;
        console.log(`[PMU] 📝 Setting filename intent: "${base}.${ext}" for tab ${tabId}`);
        if (tabId != null) {
          this.nameIntentsByTab.set(tabId, { base, extHint: ext, expires });
        }
        // Global fallback for downloads triggered by the SW itself
        this.globalIntent = { base, extHint: ext, expires };
        sendResponse?.({ ok: true });
        return;
      }

      // Content can push the current title as a fallback cache
      if (message?.type === 'pmu-last-title') {
        const tabId = sender?.tab?.id;
        if (tabId != null) {
          this.lastTitleByTab.set(tabId, { title: this.sanitizeBaseName(message.title), ts: Date.now() });
        }
        sendResponse?.({ ok: true });
        return;
      }

      switch (message.action) {
        case 'download':
          await this.handleDownloadRequest(message, sendResponse);
          break;
          
        case 'bulkDownload':
          await this.handleBulkDownload(message, sendResponse);
          break;
          
        case 'cancelDownload':
          await this.handleCancelDownload(message, sendResponse);
          break;
          
        case 'getDownloadStats':
          sendResponse({ success: true, stats: this.getDownloadStats() });
          break;
          
        case 'clearDownloadHistory':
          await this.clearDownloadHistory();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: `Unknown action: ${message.action}` });
      }
    } catch (error) {
      console.error('Background service error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Determine filename for the next download when we have a recent intent
  setupFilenameDeterminer() {
    chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
      try { console.log('[PMU] 🔍 onDeterminingFilename item:', { url: item?.url, filename: item?.filename, tabId: item?.tabId, mime: item?.mime }); } catch {}
      // Try per-tab intent first
      let intent = null;
      if (item.tabId != null) {
        const ni = this.nameIntentsByTab.get(item.tabId);
        if (ni && ni.expires >= Date.now()) {
          intent = ni;
          this.nameIntentsByTab.delete(item.tabId);
          try { console.log('[PMU] ✅ Using explicit intent from tab', item.tabId, ni); } catch {}
        }
      }
      // Fallback to global intent (e.g., downloads started by SW)
      if (!intent && this.globalIntent && this.globalIntent.expires >= Date.now()) {
        intent = this.globalIntent;
        this.globalIntent = null; // consume once
        try { console.log('[PMU] ✅ Using global intent', intent); } catch {}
      }

      // If we have an explicit intent, use it immediately
      if (intent) {
        const ext = this.chooseExt(item, intent.extHint);
        const filename = `${intent.base}${ext}`;
        try { console.log('[PMU] 🎯 Suggesting filename (intent):', filename); } catch {}
        suggest({ filename });
        return;
      }

      // Otherwise, decide based on the originating tab URL to avoid renaming other sites
      (async () => {
        const tabId = await this.getLikelyTabId(item.tabId);
        const tabUrl = await this.getTabUrl(tabId);
        const isSunoTab = /\b(suno\.com|suno\.ai)\b/i.test(tabUrl || '');
        if (!isSunoTab) {
          try { console.log('[PMU] ❌ Not a Suno tab; leaving filename unchanged'); } catch {}
          suggest();
          return;
        }

        // If there's a recent cached title from content, use it
        const lt = tabId != null ? this.lastTitleByTab.get(tabId) : undefined;
        if (lt && Date.now() - lt.ts < 10000) {
          const ext = this.chooseExt(item, undefined);
          const filename = `${this.sanitizeBaseName(lt.title)}${ext}`;
          try { console.log('[PMU] 🎯 Suggesting filename (cached title):', filename); } catch {}
          suggest({ filename });
          return;
        }

        // Ask the content script for the current title, then suggest
        const title = await this.askContentForTitle(tabId);
        const base = title || (lt?.title || 'suno');
        const ext = this.chooseExt(item, undefined);
        const filename = `${this.sanitizeBaseName(base)}${ext}`;
        try {
          console.log('[PMU] 🎯 Suggesting filename (asked content):', filename, 'from title:', title);
          suggest({ filename });
        } catch (_) { /* ignore */ }
      })();
    });
  }

  // Try to ask content script for the best current title
  askContentForTitle(tabId) {
    return new Promise((resolve) => {
      if (tabId == null || tabId < 0) return resolve('');
      try {
        chrome.tabs.sendMessage(tabId, { type: 'pmu-get-current-title' }, (resp) => {
          resolve(this.sanitizeBaseName(resp?.title || ''));
        });
      } catch {
        resolve('');
      }
    });
  }

  // Determine the most likely tab id to use
  async getLikelyTabId(preferredTabId) {
    if (preferredTabId != null && preferredTabId >= 0) return preferredTabId;
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        resolve(tabs?.[0]?.id ?? -1);
      });
    });
  }

  // Get the URL of a tab; returns empty string on failure
  getTabUrl(tabId) {
    return new Promise((resolve) => {
      if (tabId == null || tabId < 0) return resolve('');
      try {
        chrome.tabs.get(tabId, (tab) => resolve(tab?.url || ''));
      } catch {
        resolve('');
      }
    });
  }
  
  async handleDownloadRequest(message, sendResponse) {
    const validation = this.validateDownloadMessage(message);
    if (!validation.valid) {
      sendResponse({ success: false, error: validation.error });
      return;
    }
    
    try {
      const downloadId = await this.downloadFile(message.url, message.filename, message.options || {});
      
      this.downloadStats.successful++;
      console.log(`✅ Download de '${message.filename}' iniciado com ID: ${downloadId}`);
      
      sendResponse({ 
        success: true, 
        id: downloadId,
        filename: message.filename,
        stats: this.getDownloadStats()
      });
      
    } catch (error) {
      this.downloadStats.failed++;
      console.error(`❌ Falha no download de '${message.filename}':`, error);
      
      sendResponse({ 
        success: false, 
        error: error.message,
        filename: message.filename 
      });
    }
  }
  
  async handleBulkDownload(message, sendResponse) {
    if (!Array.isArray(message.downloads) || message.downloads.length === 0) {
      sendResponse({ success: false, error: 'Invalid or empty downloads array' });
      return;
    }
    
    const results = {
      successful: [],
      failed: [],
      total: message.downloads.length,
      startTime: Date.now()
    };
    
    this.downloadStats.startTime = Date.now();
    
    // Process downloads in batches to avoid overwhelming the browser
    const batchSize = this.maxConcurrentDownloads;
    const batches = [];
    
    for (let i = 0; i < message.downloads.length; i += batchSize) {
      batches.push(message.downloads.slice(i, i + batchSize));
    }
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(async (download, index) => {
        try {
          // Add delay between downloads to be respectful to the server
          if (index > 0) {
            await this.delay(800);
          }
          
          const downloadId = await this.downloadFile(download.url, download.filename, download.options || {});
          
          results.successful.push({
            id: downloadId,
            filename: download.filename,
            url: download.url
          });
          
          this.downloadStats.successful++;
          
          // Send progress update
          chrome.tabs.sendMessage(message.tabId || 0, {
            type: 'downloadProgress',
            progress: (results.successful.length + results.failed.length) / results.total,
            successful: results.successful.length,
            failed: results.failed.length,
            total: results.total
          }).catch(() => {}); // Ignore if tab is closed
          
        } catch (error) {
          results.failed.push({
            filename: download.filename,
            url: download.url,
            error: error.message
          });
          
          this.downloadStats.failed++;
          console.error(`❌ Bulk download failed for ${download.filename}:`, error);
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Brief pause between batches
      if (i < batches.length - 1) {
        await this.delay(1000);
      }
    }
    
    const duration = Date.now() - results.startTime;
    console.log(`📊 Bulk download completed: ${results.successful.length}/${results.total} successful in ${duration}ms`);
    
    sendResponse({
      success: true,
      results,
      duration,
      stats: this.getDownloadStats()
    });
  }
  
  async downloadFile(url, filename, options = {}) {
    // Validate URL
    if (!this.isValidSunoUrl(url)) {
      throw new Error(`Invalid Suno URL: ${url}`);
    }
    
    // Sanitize filename
    const sanitizedFilename = this.sanitizeFilename(filename);
    
    const downloadOptions = {
      url: url,
      filename: sanitizedFilename,
      saveAs: false,
      conflictAction: 'uniquify',
      ...options
    };
    
    // Add to active downloads
    this.activeDownloads.add(url);
    
    try {
      const downloadId = await chrome.downloads.download(downloadOptions);
      
      // Track download
      this.downloadQueue.set(downloadId, {
        url,
        filename: sanitizedFilename,
        startTime: Date.now(),
        status: 'started'
      });
      
      return downloadId;
      
    } finally {
      // Remove from active downloads
      this.activeDownloads.delete(url);
    }
  }
  
  async handleCancelDownload(message, sendResponse) {
    try {
      if (message.downloadId) {
        await chrome.downloads.cancel(message.downloadId);
        this.downloadQueue.delete(message.downloadId);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No download ID provided' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  setupDownloadListener() {
    chrome.downloads.onChanged.addListener((downloadDelta) => {
      const queueItem = this.downloadQueue.get(downloadDelta.id);
      if (!queueItem) return;
      
      if (downloadDelta.state) {
        queueItem.status = downloadDelta.state.current;
        
        if (downloadDelta.state.current === 'complete') {
          console.log(`✅ Download completed: ${queueItem.filename}`);
          this.downloadQueue.delete(downloadDelta.id);
        } else if (downloadDelta.state.current === 'interrupted') {
          console.error(`❌ Download interrupted: ${queueItem.filename}`);
          this.handleDownloadError(downloadDelta.id, queueItem);
        }
      }
      
      if (downloadDelta.fileSize) {
        this.downloadStats.totalSize += downloadDelta.fileSize.current || 0;
      }
    });
  }
  
  async handleDownloadError(downloadId, queueItem) {
    if (queueItem.retries < this.retryAttempts) {
      queueItem.retries = (queueItem.retries || 0) + 1;
      
      console.log(`🔄 Retrying download (${queueItem.retries}/${this.retryAttempts}): ${queueItem.filename}`);
      
      // Wait before retry
      await this.delay(2000 * queueItem.retries);
      
      try {
        const newDownloadId = await this.downloadFile(queueItem.url, queueItem.filename);
        this.downloadQueue.delete(downloadId);
        console.log(`🔄 Retry successful: ${queueItem.filename} (new ID: ${newDownloadId})`);
      } catch (error) {
        console.error(`🔄 Retry failed: ${queueItem.filename}`, error);
      }
    } else {
      console.error(`❌ Download failed after ${this.retryAttempts} retries: ${queueItem.filename}`);
      this.downloadQueue.delete(downloadId);
      this.downloadStats.failed++;
    }
  }
  
  setupErrorHandling() {
    // Global error handler
    self.addEventListener('error', (event) => {
      console.error('Background service error:', event.error);
    });
    
    // Unhandled promise rejection handler
    self.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    });
  }
  
  validateDownloadMessage(message) {
    if (!message.url || typeof message.url !== 'string') {
      return { valid: false, error: 'Invalid or missing URL' };
    }
    
    if (!message.filename || typeof message.filename !== 'string') {
      return { valid: false, error: 'Invalid or missing filename' };
    }
    
    if (!this.isValidSunoUrl(message.url)) {
      return { valid: false, error: 'URL is not a valid Suno URL' };
    }
    
    return { valid: true };
  }
  
  isValidSunoUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('suno') && 
             parsed.protocol === 'https:' &&
             (parsed.pathname.includes('.mp3') || parsed.hostname.includes('cdn'));
    } catch {
      return false;
    }
  }
  
  sanitizeFilename(filename) {
    if (!filename) return 'unknown-file.mp3';
    
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 100)
      || 'sanitized-file.mp3';
  }

  // Filename base sanitization preserving spaces and common punctuation
  sanitizeBaseName(name) {
    if (!name) return 'suno';
    let s = name
      .normalize('NFKC')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reserved.test(s)) s = `_${s}`;
    if (s.length > 120) s = s.slice(0, 120).trim();
    return s || 'suno';
  }

  // Decide extension based on hint/mime/original name
  chooseExt(item, extHint) {
    if (extHint) return extHint.startsWith('.') ? extHint : `.${extHint}`;
    if (item.mime) {
      const mime = String(item.mime).toLowerCase();
      if (mime.includes('subrip') || mime.startsWith('text/')) return '.srt';
      if (mime.includes('audio')) return '.mp3';
    }
    const m = /\.(\w+)$/.exec(item.filename || '');
    if (m) return `.${m[1]}`;
    return '';
  }
  
  getDownloadStats() {
    const runtime = this.downloadStats.startTime ? Date.now() - this.downloadStats.startTime : 0;
    
    return {
      ...this.downloadStats,
      runtime,
      activeDownloads: this.activeDownloads.size,
      queuedDownloads: this.downloadQueue.size,
      averageSpeed: runtime > 0 ? this.downloadStats.totalSize / runtime : 0
    };
  }
  
  async clearDownloadHistory() {
    try {
      await chrome.downloads.erase({});
      this.downloadQueue.clear();
      this.downloadStats = {
        successful: 0,
        failed: 0,
        totalSize: 0,
        startTime: null
      };
      console.log('📝 Download history cleared');
    } catch (error) {
      console.error('Failed to clear download history:', error);
      throw error;
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the service
const sunoBackgroundService = new SunoBackgroundService();

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Suno Background Service started');
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 Suno Extension installed/updated:', details.reason);
});