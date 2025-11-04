// i18n.js - Sistema de Internacionalização
class SunoI18n {
  constructor() {
    this.currentLocale = 'en'; // Fixed to English
    this.messages = {}; // points to current bundle (EN)
    this.bundles = {}; // cache of locale -> messages.json
    this.override = true; // use loaded messages for consistency
    this.init();
  }

  async init() {
    // Always use English UI, but preload EN and PT for bilingual help
    this.currentLocale = 'en';
    this.override = true;
    await Promise.all([
      this.loadLocale('en'),
      this.loadLocale('pt_BR').catch(() => null)
    ]);
    this.messages = this.bundles['en'] || this.getDefaultMessages();
  }

  // Always return English - no detection needed
  detectLocale() {
    return 'en';
  }

  // Load a locale bundle into cache
  async loadLocale(locale) {
    try {
      if (this.bundles[locale]) return this.bundles[locale];
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          this.bundles[locale] = data;
          console.log(`✅ i18n bundle loaded: ${locale}`);
          return data;
        }
      }
    } catch (e) {
      console.warn(`⚠️ Failed to load i18n bundle ${locale}:`, e);
    }
    if (locale === 'en') {
      this.bundles['en'] = this.getDefaultMessages();
    }
    return this.bundles[locale];
  }

  // Mensagens padrão caso chrome.runtime não esteja disponível
  getDefaultMessages() {
    return {
      extensionName: { message: "SUNO LoopLess Download" },
      selected: { message: "selected" },
      selectAll: { message: "Select All" },
      deselectPage: { message: "Deselect Page" },
      clearAll: { message: "Clear All" },
      download: { message: "Download" },
      refresh: { message: "Refresh" },
      donate: { message: "Support ❤️" },
      help: { message: "Help" },
  version: { message: "v5.5" },
      distributedBy: { message: "Distributed by:" },
      developedBy: { message: "Developed by:" }
    };
  }

  // Obter mensagem traduzida
  getMessage(key, substitutions = []) {
    // Prefer loaded EN bundle
    const bundle = this.messages || this.bundles['en'];
    if (bundle && bundle[key]) {
      let message = bundle[key].message;
      
      // Substituições simples
      if (substitutions && substitutions.length > 0) {
        substitutions.forEach((sub, index) => {
          message = message.replace(`$${index + 1}`, sub);
        });
      }
      
      return message;
    }
    // Try Chrome API as last resort
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      const msg = chrome.i18n.getMessage(key, substitutions);
      if (msg) return msg;
    }

    console.warn(`⚠️ Missing i18n key: ${key}`);
    return key; // Retorna a chave se não encontrar tradução
  }

  // Método curto para getMessage
  t(key, substitutions) {
    return this.getMessage(key, substitutions);
  }

  // Always use English - no locale changing allowed
  async setLocale(locale) {
    console.log('🌍 Locale changing disabled - always using English');
    return;
  }

  // Get a message from a specific locale bundle (e.g., 'en' or 'pt_BR')
  tLocale(locale, key, substitutions = []) {
    const bundle = this.bundles[locale];
    if (bundle && bundle[key]) {
      let message = bundle[key].message;
      if (substitutions && substitutions.length > 0) {
        substitutions.forEach((sub, index) => {
          message = message.replace(`$${index + 1}`, sub);
        });
      }
      return message;
    }
    return '';
  }

  // Traduzir todos os elementos com atributo data-i18n
  translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translatedText = this.getMessage(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
        element.value = translatedText;
      } else if (element.placeholder !== undefined) {
        element.placeholder = translatedText;
      } else {
        element.textContent = translatedText;
      }
    });
  }

  // Obter idioma atual
  getCurrentLocale() {
    return this.currentLocale;
  }

  // Verificar se é RTL (Right-to-Left)
  isRTL() {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(this.currentLocale.substring(0, 2));
  }

  // Formatação de números
  formatNumber(number) {
    try {
      return new Intl.NumberFormat(this.currentLocale).format(number);
    } catch (error) {
      return number.toString();
    }
  }
}

// Instância global
window.sunoI18n = new SunoI18n();

// Função global para facilitar o uso
window.t = (key, substitutions) => window.sunoI18n.getMessage(key, substitutions);

console.log('🌍 i18n system loaded (EN primary + PT bundle) - v5.5');