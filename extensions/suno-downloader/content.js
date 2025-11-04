// == Suno Bulk Downloader – v3.4  (desenvolvido por Nardoto) ==
//  · Botão Doar ❤️  · Botão Instruções ℹ️  · Exportar TXT 📄 (agora com dicas de uso do Workspace)

console.log('🎵 Suno Bulk Downloader carregando...');

(() => {
/*──────── 0.  CSS (igual v3.3) ────────*/
if(!document.getElementById('sbd-style')){
document.head.insertAdjacentHTML('beforeend',`
<style id="sbd-style">
/* Reset e Base */
* { box-sizing: border-box; }

/* Barra Superior Fixa - Remove padding-top para não empurrar conteúdo */
/* body { padding-top: 60px !important; } */

#sbd-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: rgba(20, 20, 24, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  z-index: 99999;
  height: 60px;
}

/* Contador Visual com Progress */
.sbd-counter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(217, 107, 0, 0.1);
  border: 1px solid rgba(217, 107, 0, 0.3);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  min-width: 140px;
}

.sbd-counter::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: var(--progress, 0%);
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(217, 107, 0, 0.2));
  transition: width 0.3s ease;
}

.sbd-counter-number {
  font-size: 18px;
  font-weight: 700;
  color: #d96b00;
  position: relative;
  z-index: 1;
}

.sbd-counter-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  position: relative;
  z-index: 1;
}

/* Botões Modernos */
.sbd-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.sbd-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.sbd-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sbd-btn-primary {
  background: linear-gradient(135deg, #d96b00, #ff8c00);
  border: none;
  color: white;
  font-weight: 600;
}

.sbd-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff8c00, #ffa500);
  box-shadow: 0 6px 20px rgba(217, 107, 0, 0.4);
}

.sbd-btn-danger {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  border-color: rgba(255, 71, 87, 0.3);
}

.sbd-btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff3742, #ff2f3a);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
}

/* Progress Ring Circular */
.sbd-progress-ring {
  width: 48px;
  height: 48px;
  position: relative;
  display: none;
}

.sbd-progress-ring.active {
  display: block;
}

.sbd-progress-ring svg {
  transform: rotate(-90deg);
}

.sbd-progress-ring circle {
  fill: none;
  stroke-width: 3;
}

.sbd-progress-bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.sbd-progress-fill {
  stroke: #d96b00;
  stroke-linecap: round;
  stroke-dasharray: 138.23;
  stroke-dashoffset: var(--progress-offset, 138.23);
  transition: stroke-dashoffset 0.3s ease;
}

.sbd-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #d96b00;
}

/* Toast Notifications */

/* Checkbox Simples */
.suno-bulk-checkbox {
  margin-right: 15px;
  transform: scale(1.5);
  cursor: pointer;
  accent-color: #d96b00;
}

/* Toast Notifications */
.sbd-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: rgba(20, 20, 24, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  z-index: 100000;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
}

.sbd-toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.sbd-toast-icon {
  width: 20px;
  height: 20px;
  background: rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4caf50;
  font-size: 12px;
}

.sbd-toast-message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

/* Modal melhorado com glassmorphism */
#sbd-modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  animation: fadeModal 0.3s ease;
}

@keyframes fadeModal {
  from { opacity: 0; }
}

.sbd-modal {
  background: rgba(32, 32, 36, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #fff;
  padding: 30px;
  border-radius: 20px;
  border: 1px solid rgba(217, 107, 0, 0.3);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  max-width: 500px;
  animation: modalSlide 0.3s ease;
}

@keyframes modalSlide {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.sbd-modal h2 {
  margin: 0 0 14px;
  font-size: 1.25rem;
  color: #d96b00;
}

.sbd-modal p {
  font-size: 0.9rem;
  margin: 10px 0;
  line-height: 1.45;
  text-align: left;
}

.sbd-modal strong {
  color: #d96b00;
}

.sbd-close {
  margin-top: 22px;
  background: #d96b00;
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 9px 28px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.16s background;
}

.sbd-close:hover {
  background: #e47a09;
}

/* Botão Export Inline no Player */
#sbd-export-current-inline {
  background: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 6px !important;
  padding: 5px 10px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: all 0.2s ease !important;
  position: relative !important;
  z-index: 1000 !important;
}

#sbd-export-current-inline:hover {
  background: linear-gradient(135deg, #d96b00, #ff8c00) !important;
  border-color: #d96b00 !important;
  color: white !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(217, 107, 0, 0.3) !important;
}

/* Proteção da barra de player do Suno */
[style*="position: fixed"][style*="bottom"] {
  z-index: 99998 !important;
  position: fixed !important;
  bottom: 0 !important;
}

/* Garante que elementos com tempo (player) fiquem fixos */
div:has([style*="position: fixed"]) {
  position: fixed !important;
  bottom: 0 !important;
  z-index: 99998 !important;
}

/* Proteção adicional para barra do player */
body > div[style*="position: fixed"]:has(button) {
  z-index: 99998 !important;
}

/* Garante que a extensão não interfira com o player */
#sbd-bar {
  z-index: 99999 !important;
}

/* Não adicionar padding-top no body pois a barra deve sobrepor */
</style>`);
}

/*──────── 1. VARS ────────*/
let musicasSelecionadas=new Map();
let usuarioAtual=null;
let modoSeguro=true; // Se true, só permite download de músicas próprias

/*──────── 1-A. PROTEÇÃO PLAYER SUNO ────────*/
function protegerPlayerSuno() {
  // Busca elementos que parecem ser o player do Suno (com tempo MM:SS)
  const allElements = document.querySelectorAll('*');
  
  for(let el of allElements) {
    const text = el.textContent || '';
    
    // Procura por padrão de tempo como "00:48 / 04:08"
    if(text.match(/\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}/)) {
      // Sobe na árvore DOM para encontrar o container do player
      let container = el;
      for(let i = 0; i < 8; i++) {
        if(container.parentElement) {
          container = container.parentElement;
          const rect = container.getBoundingClientRect();
          
          // Verifica se está na parte inferior da tela
          if(rect.bottom > window.innerHeight - 200 && rect.width > 200) {
            // Aplica proteção ao player
            container.style.position = 'fixed';
            container.style.bottom = '0px';
            container.style.zIndex = '99998';
            container.style.backgroundColor = container.style.backgroundColor || 'rgba(0,0,0,0.9)';
            
            console.log('🛡️ Player do Suno protegido:', container);
            
            // Também protege elementos pais até 2 níveis acima
            let parent = container.parentElement;
            for(let j = 0; j < 2 && parent; j++) {
              const parentRect = parent.getBoundingClientRect();
              if(parentRect.bottom > window.innerHeight - 150) {
                parent.style.position = 'fixed';
                parent.style.bottom = '0px';
                parent.style.zIndex = '99998';
              }
              parent = parent.parentElement;
            }
            
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

/*──────── 2. FUNÇÕES AUX ────────*/
const limpar=t=>t.replace(/[\/\\?%*:|"<>]/g,'-').trim();

/*──────── 2-A. DETECÇÃO DE USUÁRIO ────────*/
function detectarUsuarioAtual() {
  // Estratégia 1: Procurar pelo perfil do usuário na URL da página atual
  if(window.location.href.includes('/profile/') || window.location.href.includes('/user/')) {
    const match = window.location.href.match(/\/(?:profile|user)\/([^\/\?]+)/);
    if(match && match[1]) {
      usuarioAtual = match[1].toLowerCase().trim();
      console.log('🔐 Usuário detectado via URL:', usuarioAtual);
      return usuarioAtual;
    }
  }
  
  // Estratégia 2: Procurar por informações do usuário no DOM
  const userSelectors = [
    '[data-testid*="user"]',
    '[data-testid*="profile"]',
    'img[alt*="profile"]',
    '.user-avatar',
    '.profile-avatar',
    '[class*="avatar"]',
    'button[aria-label*="profile"]',
    'button[aria-label*="account"]'
  ];
  
  for(const selector of userSelectors) {
    const elements = document.querySelectorAll(selector);
    for(const el of elements) {
      // Procura por handle do usuário em atributos
      const handle = el.getAttribute('data-handle') || 
                    el.getAttribute('data-user') ||
                    el.getAttribute('data-username') ||
                    el.getAttribute('alt')?.replace(/.*(avatar|profile).*for\s*/i, '') ||
                    el.textContent?.match(/@([a-zA-Z0-9_-]+)/)?.[1];
      
      if(handle && handle.length > 2 && !handle.includes(' ')) {
        usuarioAtual = handle.toLowerCase().trim().replace('@', '');
        console.log('🔐 Usuário detectado via DOM:', usuarioAtual);
        return usuarioAtual;
      }
    }
  }
  
  // Estratégia 3: Procurar na localStorage/sessionStorage
  try {
    const storageKeys = ['user', 'profile', 'account', 'currentUser', 'auth'];
    for(const key of storageKeys) {
      const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
      if(stored) {
        try {
          const parsed = JSON.parse(stored);
          const handle = parsed.handle || parsed.username || parsed.name || parsed.user_handle;
          if(handle && typeof handle === 'string') {
            usuarioAtual = handle.toLowerCase().trim().replace('@', '');
            console.log('🔐 Usuário detectado via storage:', usuarioAtual);
            return usuarioAtual;
          }
        } catch(e) {
          // Se não é JSON, pode ser string simples
          if(stored.length > 2 && stored.length < 50 && !stored.includes(' ')) {
            usuarioAtual = stored.toLowerCase().trim().replace('@', '');
            console.log('🔐 Usuário detectado via storage string:', usuarioAtual);
            return usuarioAtual;
          }
        }
      }
    }
  } catch(e) {
    console.warn('⚠️ Erro ao acessar storage:', e);
  }
  
  console.log('⚠️ Não foi possível detectar o usuário atual');
  return null;
}

/*──────── 2-B. VERIFICAÇÃO DE PROPRIEDADE ────────*/
function verificarPropriedadeDaMusica(row) {
  if(!modoSeguro) return true; // Se modo seguro desabilitado, permite tudo
  
  if(!usuarioAtual) {
    usuarioAtual = detectarUsuarioAtual();
    if(!usuarioAtual) {
      console.warn('⚠️ Usuário não detectado, modo seguro pode bloquear downloads');
      return false; // Bloqueia se não conseguir detectar usuário
    }
  }
  
  // Verifica se estamos na página Library/Profile do próprio usuário
  const currentUrl = window.location.href.toLowerCase();
  if(currentUrl.includes('/library') || 
     currentUrl.includes(`/profile/${usuarioAtual}`) || 
     currentUrl.includes(`/user/${usuarioAtual}`)) {
    return true; // Se está na biblioteca/perfil próprio, assume que são suas músicas
  }
  
  // Verifica indicadores visuais na linha da música
  if(row) {
    const rowText = row.textContent.toLowerCase();
    
    // Procura por indicadores de propriedade
    const ownershipIndicators = [
      'edit', 'editar', 'delete', 'excluir', 'publish', 'publicar',
      'private', 'privado', 'draft', 'rascunho', 'my song', 'minha música',
      usuarioAtual // nome do próprio usuário
    ];
    
    const hasOwnershipIndicator = ownershipIndicators.some(indicator => 
      rowText.includes(indicator.toLowerCase())
    );
    
    if(hasOwnershipIndicator) {
      return true;
    }
    
    // Verifica se tem botões de edição/gerenciamento
    const managementButtons = row.querySelectorAll(
      'button[aria-label*="edit"], button[aria-label*="delete"], ' +
      'button[aria-label*="publish"], button[aria-label*="private"], ' +
      '[data-testid*="edit"], [data-testid*="delete"], ' +
      '.edit-button, .delete-button, .manage-button'
    );
    
    if(managementButtons.length > 0) {
      return true; // Se tem botões de gerenciamento, provavelmente é do usuário
    }
  }
  
  // Por padrão, se não conseguir verificar, bloqueia por segurança
  console.warn('🔒 Música bloqueada: não foi possível confirmar propriedade');
  return false;
}

/*──────── 2-C. CONFIGURAÇÕES DE SEGURANÇA ────────*/
function alternarModoSeguro() {
  modoSeguro = !modoSeguro;
  
  const status = modoSeguro ? 'ATIVADO' : 'DESATIVADO';
  const emoji = modoSeguro ? '🔒' : '🔓';
  
  // Atualiza a interface
  atualizarBotaoSeguranca();
  
  // Salva configuração
  localStorage.setItem('suno-downloader-modo-seguro', modoSeguro.toString());
  
  alert(`${emoji} Modo Seguro ${status}\n\n${
    modoSeguro 
      ? '✅ Só permite download de suas próprias músicas\n⚠️ Músicas de outros usuários serão bloqueadas' 
      : '⚠️ ATENÇÃO: Permite download de qualquer música\n🔓 Certifique-se de respeitar direitos autorais'
  }`);
  
  console.log(`🔐 Modo Seguro ${status}:`, modoSeguro);
}

function carregarConfiguracoes() {
  // Carrega modo seguro do localStorage (padrão: true)
  const savedMode = localStorage.getItem('suno-downloader-modo-seguro');
  modoSeguro = savedMode === null ? true : savedMode === 'true';
  
  console.log('⚙️ Configurações carregadas - Modo Seguro:', modoSeguro);
}

function atualizarBotaoSeguranca() {
  const btn = document.getElementById('sbd-toggle-security');
  if(btn) {
    const emoji = modoSeguro ? '🔒' : '🔓';
    const text = modoSeguro ? 'Modo Seguro' : 'Modo Livre';
    const color = modoSeguro ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 193, 7, 0.2)';
    const borderColor = modoSeguro ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 193, 7, 0.4)';
    
    btn.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
        <circle cx="12" cy="16" r="1"/>
        <path d="M7 11V7a5 5 0 1 1 10 0v4"/>
      </svg>
      ${emoji} ${text}
    `;
    btn.style.backgroundColor = color;
    btn.style.borderColor = borderColor;
  }
}
const atualizar = () => {
  const total = musicasSelecionadas.size;
  
  // Atualizar contador
  const counter = document.querySelector('.sbd-counter-number');
  if(counter) counter.textContent = total;
  
  // Atualizar botão de download
  const b = document.getElementById('suno-bulk-download-btn');
  if(b) {
    b.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <path d="M7 10l5 5 5-5"/>
        <path d="M12 15V3"/>
      </svg>
      Baixar (${total})
    `;
    b.disabled = !total;
  }
  
  // Atualizar botão exportar
  const e = document.getElementById('sbd-export-txt');
  if(e) {
    e.textContent = `Exportar TXT (${total})`;
    e.disabled = !total;
  }
  
  // Salvar persistência
  salvarSelecao();
};

// Função para mostrar toast simples
function mostrarToast(mensagem, tipo = 'success') {
  if(tipo === 'error') {
    alert('❌ ' + mensagem);
  } else {
    console.log('✅ ' + mensagem);
  }
}

// Funções de persistência
function salvarSelecao() {
  const dados = {};
  musicasSelecionadas.forEach((value, key) => {
    dados[key] = value;
  });
  sessionStorage.setItem('suno-bulk-selection', JSON.stringify(dados));
}

function restaurarSelecao() {
  try {
    const dados = sessionStorage.getItem('suno-bulk-selection');
    if(dados) {
      const parsed = JSON.parse(dados);
      musicasSelecionadas.clear();
      Object.entries(parsed).forEach(([key, value]) => {
        musicasSelecionadas.set(key, value);
      });
      console.log(`🔄 Restauradas ${musicasSelecionadas.size} seleções`);
    }
  } catch(e) {
    console.error('Erro ao restaurar seleção:', e);
  }
}

// Função para limpar TODAS as seleções de TODAS as páginas
function limparTodasSelecoes() {
  const total = musicasSelecionadas.size;
  
  if(total === 0) {
    alert('❌ Nenhuma música selecionada para limpar.');
    return;
  }
  
  const confirmacao = confirm(`🗑️ Limpar TODAS as ${total} músicas selecionadas?\n\nIsto irá remover as seleções de TODAS as páginas visitadas.`);
  
  if(confirmacao) {
    // Limpar Map
    musicasSelecionadas.clear();
    
    // Limpar storage
    sessionStorage.removeItem('suno-bulk-selection');
    
    // Desmarcar checkboxes da página atual
    const checkboxes = document.querySelectorAll('.suno-bulk-checkbox:checked');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Atualizar interface
    atualizar();
    
    console.log('🗑️ Todas as seleções foram limpas');
    alert(`✅ Todas as ${total} seleções foram limpas com sucesso!`);
  }
}

// Atualizar contador com animação
function atualizarContador() {
  const total = musicasSelecionadas.size;
  const counter = document.querySelector('.sbd-counter-number');
  
  if(counter) counter.textContent = total;
  
  // Chamar atualizar principal
  atualizar();
}

/*──────── 3. HEADER ────────*/
function criarBarra(){
 console.log('🔧 Tentando criar barra...');
 
 // Verifica se a barra já existe
 if(document.getElementById('sbd-bar')){
   console.log('⚠️ Barra já existe, pulando...');
   return;
 }
 
 // Verifica se estamos na página correta do Suno
 if(!window.location.href.includes('suno.com')){
   console.log('❌ Não é página do Suno, pulando...');
   return;
 }
 
 console.log('✅ Criando barra no DOM...');
 
 try {
   document.body.insertAdjacentHTML('afterbegin',`
  <div id="sbd-bar">
    <div class="sbd-counter">
      <span class="sbd-counter-number">0</span>
      <span class="sbd-counter-label">selecionadas</span>
    </div>

    <button id="sbd-select-all" class="sbd-btn">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 11l3 3L22 4"/>
      </svg>
      Selecionar Todas
    </button>

    <button id="sbd-clear-all" class="sbd-btn">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M6 6l12 12M6 18L18 6"/>
      </svg>
      Desmarcar Página
    </button>

    <button id="sbd-clear-everything" class="sbd-btn sbd-btn-danger">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <polyline points="3,6 5,6 21,6"/>
        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
      Limpar Tudo
    </button>

    <button id="suno-bulk-download-btn" class="sbd-btn sbd-btn-primary" disabled>
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <path d="M7 10l5 5 5-5"/>
        <path d="M12 15V3"/>
      </svg>
      Baixar Músicas
    </button>

    <button id="sbd-export-txt" class="sbd-btn" disabled>
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      Exportar TXT
    </button>

    <button id="sbd-toggle-security" class="sbd-btn">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
        <circle cx="12" cy="16" r="1"/>
        <path d="M7 11V7a5 5 0 1 1 10 0v4"/>
      </svg>
      🔒 Modo Seguro
    </button>

    <div style="margin-left: auto; display: flex; gap: 12px;">
      <button id="sbd-donate" class="sbd-btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        Doar
      </button>

      <button id="sbd-help" class="sbd-btn">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <point cx="12" cy="17"/>
        </svg>
        Ajuda
      </button>
    </div>
  </div>`);

 document.getElementById('sbd-select-all')
         .addEventListener('click',()=>selecionarTodas(true));
 document.getElementById('sbd-clear-all')
         .addEventListener('click',()=>selecionarTodas(false));
 document.getElementById('sbd-clear-everything')
         .addEventListener('click',limparTodasSelecoes);
 document.getElementById('suno-bulk-download-btn')
         .addEventListener('click',baixar);
 document.getElementById('sbd-export-txt')
         .addEventListener('click',exportarTXT);
 document.getElementById('sbd-toggle-security')
         .addEventListener('click',alternarModoSeguro);
 document.getElementById('sbd-donate')
         .addEventListener('click',modalDoacao);
 document.getElementById('sbd-help')
         .addEventListener('click',modalAjuda);
 
 console.log('🎉 Barra criada e eventos conectados!');
 
 } catch(error) {
   console.error('❌ Erro ao criar barra:', error);
 }
}

/*──────── 4-A  MODAL DOAÇÃO ────────*/
function modalDoacao(){
 if(document.getElementById('sbd-modal-bg'))return;
 const html=`
  <div id="sbd-modal-bg">
   <div class="sbd-modal">
    <h2>Obrigado pelo apoio!</h2>
    <p style="text-align:center">
       Envie um PIX para:<br><br>
       <strong>Tharcisio Bernardo Valli Nardoto</strong><br><br>
       <strong>Chave PIX:</strong><br>tharcisionardoto@gmail.com<br><br>
       <strong>WhatsApp:</strong> (27) 99913-2594
    </p>
    <p style="text-align:center">Qualquer valor é bem-vindo.<br>
       "O sonho é a coisa mais real que existe."<br>Gratidão 🙏</p>
    <button id="sbd-close" class="sbd-close">Fechar</button>
   </div>
  </div>`;
 document.body.insertAdjacentHTML('beforeend',html);
 document.getElementById('sbd-close')
         .addEventListener('click',()=>document.getElementById('sbd-modal-bg').remove());
}

/*──────── 4-B  MODAL AJUDA / DICAS ────────*/
function modalAjuda(){
 if(document.getElementById('sbd-modal-bg'))return;
 const html=`
  <div id="sbd-modal-bg">
   <div class="sbd-modal">
     <h2>Instruções de Uso</h2>
     <p>
       <strong>Configurar o Chrome</strong><br>
       1. Abra <code>chrome://settings/downloads</code>.<br>
       2. <strong>Desative</strong> "Perguntar onde salvar cada arquivo antes de fazer download".<br>
       3. Em "Local", clique em <em>Alterar</em> e escolha sua pasta de músicas.<br><br>
       <strong>Dicas do Workspace Suno</strong><br>
       • Crie e trabalhe sempre em um <strong>Workspace dedicado</strong> às músicas do projeto.<br>
       • Cada página do Suno lista <strong>no máximo 20 músicas</strong>.<br>
       • Após clicar em "Selecionar Todas", mude para a próxima página (setas ao lado da barra de busca).<br>
       • O contador no topo soma as músicas de todas as páginas já marcadas.<br>
       • Quando terminar de navegar por todas as páginas, clique em "Baixar Selecionadas".<br>
       • Se precisar, use "Desmarcar Todas" para limpar a seleção rapidamente.<br><br>
       <strong>Exportar Letras</strong><br>
       • <strong>Exportar TXT:</strong> Exporta informações das músicas selecionadas.<br>
       • <strong>Exportar Atual:</strong> Clique numa música para abrir o painel lateral, depois use este botão para extrair a letra completa.
     </p>
     <button id="sbd-close" class="sbd-close">Fechar</button>
   </div>
  </div>`;
 document.body.insertAdjacentHTML('beforeend',html);
 document.getElementById('sbd-close')
         .addEventListener('click',()=>document.getElementById('sbd-modal-bg').remove());
}

/*──────── 4-C. DETECTAR PÁGINA /CREATE ────────*/
function estaNaPaginaCreate() {
  return window.location.href.includes('/create');
}

/*──────── 5. CHECKBOXES ────────*/
function addCheckboxes(){
 console.log('📋 Adicionando checkboxes...');

 // Detecta automaticamente qual seletor usar baseado na página
 let rows;
 if(estaNaPaginaCreate()) {
   // Na página /create, usa data-testid="clip-row"
   rows = document.querySelectorAll('[data-testid="clip-row"]');
   console.log(`📊 Página /create: Encontradas ${rows.length} linhas clip-row`);
 } else {
   // Outras páginas usam role="row"
   rows = document.querySelectorAll('[role="row"]');
   console.log(`📊 Página biblioteca: Encontradas ${rows.length} linhas role=row`);
 }

 let added = 0;

 rows.forEach(l=>{
  if(l.querySelector('.suno-bulk-checkbox'))return;
  const a=l.querySelector('a[href*="/song/"]');if(!a)return;
  const id=a.href.split('/song/')[1].split('?')[0];

  // Verificação de segurança ANTES de criar checkbox
  const podeDownload = verificarPropriedadeDaMusica(l);

  // Extração melhorada do título - apenas o nome da música
  let titulo='musica-desconhecida';
  const linkElement = l.querySelector('a[href*="/song/"]');
  if(linkElement) {
    const titleText = linkElement.textContent.trim();
    // Remove tags de versão (v1.5+, v4.5+, v5, etc) e pega só o título
    titulo = titleText.replace(/\s*v\d+(\.\d+)?\+?\s*$/i, '').trim();
    // Se ainda tiver conteúdo entre colchetes no final, mantém apenas a parte antes
    if(titulo.includes('[') && titulo.includes(']')) {
      const parts = titulo.split('[');
      if(parts.length > 1) {
        titulo = parts[0].trim() + ' [' + parts[1].split(']')[0] + ']';
      }
    }
  }

  const nome=limpar(`${titulo}.mp3`);

  // Criar checkbox simples
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'suno-bulk-checkbox';
  cb.dataset.id = id;
  
  // Se não pode fazer download, desabilita e marca visualmente
  if(!podeDownload) {
    cb.disabled = true;
    cb.title = '🔒 Esta música não pertence a você (Modo Seguro ativo)';
    cb.style.opacity = '0.3';
    
    // Adiciona indicador visual
    const lockIcon = document.createElement('span');
    lockIcon.innerHTML = '🔒';
    lockIcon.style.marginLeft = '5px';
    lockIcon.style.fontSize = '12px';
    lockIcon.title = 'Música bloqueada pelo Modo Seguro';
    l.style.opacity = '0.6';
  }
  
  // Verificar se deve estar marcado (persistência)
  if(musicasSelecionadas.has(id) && podeDownload) {
    cb.checked = true;
  }
  
  cb.addEventListener('change',e=>{
    if(!podeDownload) {
      e.preventDefault();
      e.target.checked = false;
      alert('🔒 Esta música foi bloqueada pelo Modo Seguro.\n\nApenas suas próprias músicas podem ser baixadas.\nClique no botão "Modo Seguro" para alterar esta configuração.');
      return;
    }

    if(e.target.checked) {
      musicasSelecionadas.set(id,{nome,titulo,verificada:true});
      mostrarToast(`"${titulo}" adicionado à seleção`);
    } else {
      musicasSelecionadas.delete(id);
      mostrarToast(`"${titulo}" removido da seleção`);
    }
    atualizar();
  });

  // Posicionamento inteligente do checkbox
  if(estaNaPaginaCreate()) {
    // Na página /create, insere no início do clip-row
    // Procura o container de conteúdo principal
    const mainContainer = l.querySelector('.css-8yp4m0, .clip-image-container')?.parentElement;
    if(mainContainer) {
      mainContainer.insertBefore(cb, mainContainer.firstChild);
    } else {
      l.prepend(cb);
    }
  } else {
    // Outras páginas: comportamento padrão
    l.prepend(cb);
  }

  // Adiciona ícone de bloqueio se necessário
  if(!podeDownload) {
    const lockIcon = document.createElement('span');
    lockIcon.innerHTML = ' 🔒';
    lockIcon.style.fontSize = '12px';
    lockIcon.title = 'Música bloqueada pelo Modo Seguro';
    lockIcon.style.marginLeft = '8px';
    cb.insertAdjacentElement('afterend', lockIcon);
  }

  added++;
 });
 
 console.log(`✅ Adicionadas ${added} checkboxes`);
 
 // Atualizar interface após adicionar checkboxes
 atualizar();
}

/*──────── 6. SELEÇÃO ────────*/
const selecionarTodas=f=>{
 document.querySelectorAll('.suno-bulk-checkbox').forEach(cb=>{
   // Só seleciona checkboxes que não estão desabilitados (modo seguro)
   if(!cb.disabled) {
     cb.checked=f;cb.dispatchEvent(new Event('change',{bubbles:true}));
   }
 });
};

/*──────── 7. DOWNLOAD ────────*/
async function baixar(){
 const btn=document.getElementById('suno-bulk-download-btn');
 const lista=[...musicasSelecionadas.entries()];
 if(!lista.length)return;
 
 // Filtrar apenas músicas que passaram na verificação de segurança
 const listaSegura = lista.filter(([id, data]) => {
   if(!modoSeguro) return true; // Se modo seguro desabilitado, permite tudo
   return data.verificada === true; // Só permite músicas que foram verificadas
 });
 
 if(listaSegura.length !== lista.length) {
   const bloqueadas = lista.length - listaSegura.length;
   const confirmacao = confirm(
     `🔒 MODO SEGURO ATIVO\n\n` +
     `${bloqueadas} música(s) foram bloqueadas por não serem suas.\n` +
     `${listaSegura.length} música(s) serão baixadas.\n\n` +
     `Continuar com o download das músicas permitidas?`
   );
   
   if(!confirmacao) return;
 }
 
 if(!listaSegura.length) {
   alert('🔒 Nenhuma música pode ser baixada.\n\nTodas as músicas selecionadas foram bloqueadas pelo Modo Seguro.\nApenas suas próprias músicas podem ser baixadas.');
   return;
 }
 
 btn.disabled=true;
 
 for(let i=0;i<listaSegura.length;i++){
   btn.innerHTML = `
     <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
       <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
       <path d="M7 10l5 5 5-5"/>
       <path d="M12 15V3"/>
     </svg>
     Baixando ${i+1}/${listaSegura.length}
   `;
   
   const [id,data]=listaSegura[i];
   const nome = typeof data === 'string' ? data : data.nome;
   
   try{
     await chrome.runtime.sendMessage({action:'download',url:`https://cdn1.suno.ai/${id}.mp3`,filename:nome});
     console.log(`✅ "${nome}" baixado`);
   }catch(e){
     console.error(`❌ Erro ao baixar "${nome}":`, e);
   }
   await new Promise(r=>setTimeout(r,800));
 }
 
 btn.disabled=false;
 btn.innerHTML = `
   <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
     <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
     <path d="M7 10l5 5 5-5"/>
     <path d="M12 15V3"/>
   </svg>
   Baixar Músicas
 `;
 
 selecionarTodas(false);
 musicasSelecionadas.clear();
 sessionStorage.removeItem('suno-bulk-selection');
 
 if(modoSeguro && listaSegura.length < lista.length) {
   alert(`✅ Downloads concluídos!\n\n${listaSegura.length} música(s) baixada(s)\n${lista.length - listaSegura.length} música(s) bloqueada(s) pelo Modo Seguro\n\n🔒 Apenas suas próprias músicas foram baixadas.`);
 } else {
   alert(`✅ Todos os ${listaSegura.length} downloads foram enviados ao Chrome!`);
 }
}

/*──────── 7-B. EXPORTAR TXT ────────*/
async function exportarTXT(){
 const btn=document.getElementById('sbd-export-txt');
 const lista=[...musicasSelecionadas.entries()];
 if(!lista.length)return;
 
 // Aviso sobre limitações e tempo
 const aviso = confirm(`📄 EXPORTAR ${lista.length} MÚSICAS PARA TXT\n\n🤖 EXTRAÇÃO AUTOMÁTICA DE LETRAS:\n• Vai tentar abrir cada música automaticamente\n• Pode demorar ~3 segundos por música\n• Tempo estimado: ${Math.ceil(lista.length * 3 / 60)} minutos\n\n⚠️ ALTERNATIVA RÁPIDA:\n• Cancele e use "Exportar Atual" em cada música\n• Mais rápido para poucas músicas\n\nTentar extração automática?`);
 
 if(!aviso) return;
 
 btn.disabled=true;
 btn.textContent='Extraindo dados...';
 
 let txtContent = '';
 let letrasEncontradas = 0;
 
 for(let i=0;i<lista.length;i++){
   const [id,data]=lista[i];
   const titulo = typeof data === 'string' ? data.replace('.mp3','') : data.titulo;
   
   btn.textContent=`Processando ${i+1}/${lista.length}`;
   
   try {
     // Localiza a linha da música na lista
     const songLink = document.querySelector(`a[href*="/song/${id}"]`);
     if(!songLink) continue;
     
     const row = songLink.closest('[role="row"]');
     let estilos = 'Estilos não encontrados';
     let letra = 'LETRA NÃO EXTRAÍDA - Para obter letras, use o botão "Exportar Atual" em cada música individualmente.';
     
     // TENTATIVA DE EXTRAÇÃO DE LETRA (EXPERIMENTAL)
     // Primeiro, tenta encontrar letra já carregada na página
     let letraEncontrada = false;
     const lyricsSelectors = [
       // Seletores específicos do Suno
       'div[style*="white-space: pre-wrap"]',
       'div[style*="white-space:pre-wrap"]',
       'div[style*="white-space: break-spaces"]',
       'div[style*="white-space:break-spaces"]',
       '[data-testid*="lyrics"]',
       '[data-testid*="lyric"]', 
       'div[class*="lyrics"]',
       'div[class*="lyric"]',
       // Seletores genéricos
       'pre',
       'div[style*="white-space"]',
       // Painel lateral do Suno
       'div[role="dialog"] div[style*="white-space"]',
       'aside div[style*="white-space"]',
       // Por posição (lado direito)
       'div[style*="position: fixed"][style*="right"] div[style*="white-space"]'
     ];
     
     for(let selector of lyricsSelectors) {
       const lyricsElements = document.querySelectorAll(selector);
       for(let el of lyricsElements) {
         const text = el.textContent.trim();
         // Critérios mais específicos para identificar letras
         const isLyrics = text.length > 30 && 
                         (text.includes('\n') || text.includes('verse') || text.includes('chorus')) &&
                         !text.includes('Suno') && 
                         !text.includes('©') &&
                         !text.includes('http') && 
                         !text.includes('.com') &&
                         !text.includes('button') &&
                         !text.includes('click') &&
                         !text.toLowerCase().includes('download') &&
                         !text.toLowerCase().includes(titulo.toLowerCase().substring(0, 10));
         
         if(isLyrics) {
           letra = text;
           letrasEncontradas++;
           letraEncontrada = true;
           console.log(`✅ Letra encontrada já carregada: ${titulo.substring(0, 20)}...`);
           break;
         }
       }
       if(letraEncontrada) break;
     }
     
     // Se não encontrou letra, tenta abrir a música automaticamente
     if(!letraEncontrada && songLink) {
       try {
         console.log(`🎵 Tentando extrair letra de: ${titulo}`);
         
         // Simula clique no link da música
         songLink.click();
         
         // Aguarda carregamento
         await new Promise(resolve => setTimeout(resolve, 2000));
         
         // Busca letra no painel lateral após abrir
         for(let selector of lyricsSelectors) {
           const lyricsElements = document.querySelectorAll(selector);
           for(let el of lyricsElements) {
             const text = el.textContent.trim();
             if(text.length > 50 && text.includes('\n') && 
                !text.includes('Suno') && !text.includes('©') &&
                !text.includes('http') && !text.includes('.com') &&
                !text.includes(titulo)) {
               letra = text;
               letrasEncontradas++;
               letraEncontrada = true;
               console.log(`✅ Letra extraída: ${titulo}`);
               break;
             }
           }
           if(letraEncontrada) break;
         }
         
         // Fecha o painel (busca botão de fechar)
         const closeButtons = document.querySelectorAll('button[aria-label*="close"], button[aria-label*="Close"], [role="button"]:has(svg)');
         for(let btn of closeButtons) {
           if(btn.textContent.includes('×') || btn.innerHTML.includes('close') || btn.innerHTML.includes('Close')) {
             btn.click();
             break;
           }
         }
         
         // Aguarda fechamento
         await new Promise(resolve => setTimeout(resolve, 500));
         
       } catch(e) {
         console.error(`❌ Erro ao extrair letra de ${titulo}:`, e);
       }
     }
     
     if(!letraEncontrada) {
       letra = 'LETRA NÃO EXTRAÍDA AUTOMATICAMENTE - Abra a música individualmente e use "Exportar Atual".';
     }
     
     // Extrai estilos da linha atual (procura por texto longo com vírgulas)
     if(row) {
       const textElements = row.querySelectorAll('*');
       for(let el of textElements) {
         const text = el.textContent.trim();
         // Procura por texto com vírgulas, longo, que não seja título nem botões
         if(text.includes(',') && text.length > 30 && 
            !text.includes('Edit') && !text.includes('Publish') && 
            !text.includes('v5.0') && !text.includes('v4.5+') && !text.includes('v1.5') &&
            !text.includes(titulo.split('[')[0])) {
           estilos = text.replace(/Edit|Publish|\d+|\s+/g, ' ').replace(/\s+/g, ' ').trim();
           break;
         }
       }
     }
     
     // Se não encontrou estilos pela busca acima, tenta extrair de forma mais simples
     if(estilos === 'Estilos não encontrados' && row) {
       const allText = row.textContent;
       // Procura por padrões de estilos musicais
       const stylePatterns = /\b(deep house|house|electronic|pop|rock|jazz|classical|ambient|trap|hip hop|r&b|folk|country|metal|punk|reggae|blues|soul|funk|disco|techno|trance|dubstep|drum and bass|breakbeat|garage|synthwave|chillout|lounge|acoustic|instrumental)\b/gi;
       const foundStyles = allText.match(stylePatterns);
       if(foundStyles && foundStyles.length > 0) {
         estilos = foundStyles.join(', ');
       }
     }
     
     // Adiciona ao conteúdo do TXT preservando formatação
     txtContent += `========================================\n`;
     txtContent += `TÍTULO: ${titulo}\n`;
     txtContent += `ID: ${id}\n`;
     txtContent += `ESTILOS: ${estilos}\n`;
     txtContent += `========================================\n`;
     txtContent += `LETRA:\n\n${letra}\n\n`;
     txtContent += `----------------------------------------\n\n`;
     
   } catch(e) {
     console.error(`Erro ao processar ${titulo}:`, e);
     txtContent += `========================================\n`;
     txtContent += `TÍTULO: ${titulo}\n`;
     txtContent += `ID: ${id}\n`;
     txtContent += `ERRO: Não foi possível extrair dados\n`;
     txtContent += `========================================\n\n`;
   }
 }
 
 // Adiciona cabeçalho do arquivo
 let header = `SUNO MÚSICA EXPORT - ${new Date().toLocaleDateString('pt-BR')}\n`;
 header += `Total de músicas: ${lista.length}\n`;
 header += `Letras extraídas: ${letrasEncontradas}/${lista.length}\n`;
 header += `Gerado por: Suno Downloader (Nardoto)\n\n`;
 header += `⚠️ AVISO: Para extrair letras completas, abra cada música individualmente\n`;
 header += `e use o botão "Exportar Atual" no player.\n\n`;
 header += `${'='.repeat(50)}\n\n`;
 
 const finalContent = header + txtContent;
 
 // Gera e baixa o arquivo TXT
 const blob = new Blob([finalContent], {type: 'text/plain;charset=utf-8'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `suno_export_${new Date().toISOString().slice(0,10)}.txt`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 
 btn.disabled=false;
 btn.textContent=`Exportar TXT (${musicasSelecionadas.size})`;
 
 if(letrasEncontradas > 0) {
   alert(`📄 Arquivo TXT gerado!\n\n✅ ${lista.length} músicas exportadas\n🎵 ${letrasEncontradas} letras encontradas\n❌ ${lista.length - letrasEncontradas} letras não encontradas\n\nPara letras completas, use "Exportar Atual" em cada música.`);
 } else {
   alert(`📄 Arquivo TXT gerado com ${lista.length} músicas!\n\n⚠️ Nenhuma letra foi extraída automaticamente.\nPara obter letras, abra cada música e use "Exportar Atual".`);
 }
}

/*──────── 7-C. EXPORTAR MÚSICA ATUAL ────────*/
async function exportarMusicaAtual(){
 const btn = document.getElementById('sbd-export-current-inline');
 btn.disabled = true;
 btn.textContent = 'Extraindo...';
 
 try {
   // Busca informações da música atual no painel lateral direito
   let titulo = 'Título não encontrado';
   let estilos = 'Estilos não encontrados';
   let letra = 'Letra não encontrada';
   
   // Busca o título - baseado nas suas imagens, está em uma div com font-weight
   const titleSelectors = [
     'div[style*="font-weight: 600"][style*="font-size: 24px"]',
     'div[style*="font-weight:600"][style*="font-size:24px"]', 
     'div[style*="font-weight: 600"]',
     'div[style*="font-weight:600"]',
     'h1', 'h2',
     '[class*="title"]'
   ];
   
   for(let selector of titleSelectors) {
     const titleElements = document.querySelectorAll(selector);
     for(let el of titleElements) {
       const text = el.textContent.trim();
       if(text && text.length > 3 && text.length < 100 && 
          !text.includes('Suno') && !text.includes('©') &&
          !text.includes('Edit') && !text.includes('Publish') &&
          !text.includes('Loading') && !text.includes('Button')) {
         titulo = text.replace(/\s*v\d+\.?\d*\+?.*$/i, '').trim();
         console.log('🎵 Título encontrado:', titulo);
         break;
       }
     }
     if(titulo !== 'Título não encontrado') break;
   }
   
   // Busca estilos - baseado nas suas imagens, estão em spans coloridos
   const styleSelectors = [
     'span[style*="background-color"]',
     'span[class*="tag"]',
     'div[style*="background-color"][style*="border-radius"]',
     'span[style*="padding"]',
     'div[class*="genre"]'
   ];
   
   let foundStyles = [];
   for(let selector of styleSelectors) {
     const elements = document.querySelectorAll(selector);
     for(let el of elements) {
       const text = el.textContent.trim();
       if(text && text.length > 2 && text.length < 30 && 
          !text.includes('©') && !text.includes('Edit') && 
          !text.includes('Similar') && !text.includes('By') &&
          !foundStyles.includes(text)) {
         foundStyles.push(text);
       }
     }
   }
   
   if(foundStyles.length > 0) {
     estilos = foundStyles.join(', ');
     console.log('🎨 Estilos encontrados:', estilos);
   }
   
   // Busca a letra - baseado nas suas imagens, está em whitespace-pre-wrap
   const lyricsSelectors = [
     'div[style*="white-space: pre-wrap"]',
     'div[style*="whitespace-pre-wrap"]',
     '[style*="white-space:pre-wrap"]',
     '[style*="whitespace:pre-wrap"]',
     'div[class*="lyrics"]',
     'pre'
   ];
   
   for(let selector of lyricsSelectors) {
     const lyricsElements = document.querySelectorAll(selector);
     for(let lyricsEl of lyricsElements) {
       const lyricsText = lyricsEl.textContent || lyricsEl.innerText;
       // Verifica se é realmente letra (tem mais de 50 caracteres e estrutura de música)
       if(lyricsText && lyricsText.trim().length > 50 && 
          (lyricsText.includes('\n') || lyricsText.includes('[Verse') || 
           lyricsText.includes('[Chorus') || lyricsText.includes('[Bridge') ||
           lyricsText.includes('(') || lyricsText.split('\n').length > 3)) {
         letra = lyricsText.trim();
         console.log('📝 Letra encontrada:', letra.substring(0, 100) + '...');
         break;
       }
     }
     if(letra !== 'Letra não encontrada') break;
   }
   
   // Cria nome do arquivo limpo
   const nomeArquivo = titulo
     .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
     .replace(/\s+/g, '_')     // Espaços viram underscore
     .toLowerCase()            // Minúsculo
     .substring(0, 50);        // Limita tamanho
   
   // Monta o conteúdo do arquivo TXT
   let txtContent = '';
   txtContent += `SUNO MÚSICA EXPORT - ${new Date().toLocaleDateString('pt-BR')}\n`;
   txtContent += `Extraído do painel lateral direito\n`;
   txtContent += `Gerado por: Suno Downloader (Nardoto)\n\n`;
   txtContent += `${'='.repeat(50)}\n\n`;
   
   txtContent += `TÍTULO: ${titulo}\n`;
   txtContent += `ESTILOS: ${estilos}\n`;
   txtContent += `DATA/HORA: ${new Date().toLocaleString('pt-BR')}\n`;
   txtContent += `${'='.repeat(50)}\n\n`;
   txtContent += `LETRA:\n\n${letra}\n\n`;
   txtContent += `${'='.repeat(50)}\n`;
   
   // Gera e baixa o arquivo TXT com nome da música
   const blob = new Blob([txtContent], {type: 'text/plain;charset=utf-8'});
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `${nomeArquivo}.txt`;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
   
   console.log('✅ Arquivo exportado:', `${nomeArquivo}.txt`);
   alert(`Letra de "${titulo}" exportada com sucesso!\nArquivo: ${nomeArquivo}.txt`);
   
 } catch(e) {
   console.error('❌ Erro ao exportar música atual:', e);
   alert('Erro ao extrair informações. Certifique-se de que há uma música aberta no painel lateral.');
 }
 
 btn.disabled = false;
 btn.textContent = 'Exportar Atual';
}

/*──────── 7-D. ADICIONAR BOTÃO INLINE ────────*/
function adicionarBotaoExportarAtual(){
 // Remove botão existente se houver
 const existingBtn = document.getElementById('sbd-export-current-inline');
 if(existingBtn) {
   existingBtn.remove();
 }
 
 // Procura a barra do player na parte inferior (onde aparece o tempo da música)
 let playerBar = null;
 
 // Busca por elementos que contenham tempo no formato MM:SS / MM:SS
 const allElements = document.querySelectorAll('*');
 for(let el of allElements) {
   const text = el.textContent || '';
   
   // Procura por padrão de tempo como "00:48 / 04:08"
   if(text.match(/\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}/)) {
     // Pega o container que contém esse elemento
     let container = el;
     for(let i = 0; i < 5; i++) { // Sobe até 5 níveis para encontrar o container principal
       if(container.parentElement) {
         container = container.parentElement;
         const rect = container.getBoundingClientRect();
         // Verifica se está na parte inferior da tela e tem largura considerável
         if(rect.bottom > window.innerHeight - 150 && rect.width > 300) {
           playerBar = container;
           console.log('🎯 Barra do player encontrada via tempo:', container);
           break;
         }
       }
     }
     if(playerBar) break;
   }
 }
 
 // Se não encontrou pelo tempo, busca por estrutura específica da imagem
 if(!playerBar) {
   // Busca por divs que tenham flex e estejam na parte inferior
   const flexDivs = document.querySelectorAll('div[class*="flex"]');
   for(let div of flexDivs) {
     const rect = div.getBoundingClientRect();
     const hasButtons = div.querySelectorAll('button').length > 0;
     const hasTimeOrProgress = div.textContent.includes(':') || div.querySelector('[style*="width"]');
     
     // Verifica se está na parte inferior, tem botões e elementos de tempo/progresso
     if(rect.bottom > window.innerHeight - 150 && 
        rect.width > 200 && 
        hasButtons && 
        hasTimeOrProgress) {
       playerBar = div;
       console.log('🔍 Barra do player encontrada via estrutura:', div);
       break;
     }
   }
 }
 
 // Última tentativa: busca por qualquer elemento com tempo na parte inferior
 if(!playerBar) {
   const timeElements = document.querySelectorAll('*');
   for(let el of timeElements) {
     if(el.textContent && el.textContent.match(/\d{2}:\d{2}/)) {
       const rect = el.getBoundingClientRect();
       if(rect.bottom > window.innerHeight - 100) {
         playerBar = el.closest('div');
         console.log('⚡ Encontrou elemento com tempo na parte inferior:', playerBar);
         break;
       }
     }
   }
 }
 
 if(!playerBar) {
   console.log('⚠️ Barra do player não encontrada');
   return;
 }
 
 // Cria o botão com estilo discreto que combina com a barra do player
 const button = document.createElement('button');
 button.id = 'sbd-export-current-inline';
 button.innerHTML = `
   <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 4px;">
     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
     <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/>
     <circle cx="12" cy="15" r="2" fill="currentColor"/>
   </svg>
   TXT
 `;
 button.style.cssText = `
   background: rgba(255, 255, 255, 0.08) !important;
   color: rgba(255, 255, 255, 0.7) !important;
   border: 1px solid rgba(255, 255, 255, 0.15) !important;
   border-radius: 6px !important;
   padding: 5px 10px !important;
   font-size: 11px !important;
   font-weight: 500 !important;
   cursor: pointer !important;
   display: inline-flex !important;
   align-items: center !important;
   gap: 4px !important;
   transition: all 0.2s ease !important;
   position: relative !important;
   z-index: 1000 !important;
   margin: 0 8px !important;
 `;
 
 // Hover effect
 button.addEventListener('mouseenter', () => {
   button.style.background = 'linear-gradient(135deg, #d96b00, #ff8c00)';
   button.style.borderColor = '#d96b00';
   button.style.color = 'white';
   button.style.transform = 'translateY(-1px)';
   button.style.boxShadow = '0 2px 8px rgba(217, 107, 0, 0.3)';
 });
 button.addEventListener('mouseleave', () => {
   button.style.background = 'rgba(255, 255, 255, 0.08)';
   button.style.borderColor = 'rgba(255, 255, 255, 0.15)';
   button.style.color = 'rgba(255, 255, 255, 0.7)';
   button.style.transform = 'translateY(0)';
   button.style.boxShadow = 'none';
 });
 
 // Adiciona evento de clique
 button.addEventListener('click', exportarMusicaAtual);
 
 // Adiciona o botão na barra do player
 // Tenta inserir próximo a outros botões ou controles
 let insertLocation = null;
 
 // Procura por botões existentes para inserir próximo
 const existingButtons = playerBar.querySelectorAll('button');
 if(existingButtons.length > 0) {
   // Insere após o último botão
   const lastButton = existingButtons[existingButtons.length - 1];
   insertLocation = lastButton.parentElement;
   if(insertLocation) {
     insertLocation.appendChild(button);
   } else {
     lastButton.insertAdjacentElement('afterend', button);
   }
 } else {
   // Se não tem botões, adiciona no final da barra
   playerBar.appendChild(button);
 }
 
 console.log('🎯 Botão "TXT" adicionado à barra do player');
}

/*──────── 8. OBSERVER ────────*/
console.log('🔍 Configurando observer...');

let lastRun = 0;
let scrollObserverActive = false;

// Observer de Mutações para detectar novos elementos
new MutationObserver((mutations) => {
  const now = Date.now();
  if(now - lastRun < 1000) return; // Limita a 1 execução por segundo

  lastRun = now;

  // Verifica mudanças relevantes dependendo da página
  let hasRelevantChanges = false;

  if(estaNaPaginaCreate()) {
    // Na página /create, procura por clip-row
    hasRelevantChanges = mutations.some(mutation =>
      mutation.addedNodes.length > 0 &&
      [...mutation.addedNodes].some(node =>
        node.nodeType === 1 && (
          node.querySelector && node.querySelector('[data-testid="clip-row"]') ||
          node.getAttribute && node.getAttribute('data-testid') === 'clip-row'
        )
      )
    );
  } else {
    // Em outras páginas, procura por role="row"
    hasRelevantChanges = mutations.some(mutation =>
      mutation.addedNodes.length > 0 &&
      [...mutation.addedNodes].some(node =>
        node.nodeType === 1 && (
          node.querySelector && node.querySelector('[role="row"]') ||
          node.getAttribute && node.getAttribute('role') === 'row'
        )
      )
    );
  }

  if(hasRelevantChanges) {
    console.log('🔄 Mudança relevante detectada, atualizando...');
    setTimeout(() => {
      // Restaurar seleção antes de adicionar checkboxes
      restaurarSelecao();
      addCheckboxes();
      adicionarBotaoExportarAtual();
      protegerPlayerSuno();
    }, 200);
  }

}).observe(document.body, {childList: true, subtree: true});

/*──────── 8-A. SCROLL OBSERVER (para página /create) ────────*/
function setupScrollObserver() {
  if(scrollObserverActive) return;

  // Só ativa na página /create
  if(!estaNaPaginaCreate()) {
    console.log('⏭️ Scroll observer não necessário fora de /create');
    return;
  }

  console.log('🔄 Configurando scroll observer para página /create...');

  // Encontra o container com scroll
  const findScrollContainer = () => {
    // Procura por div com role="rowgroup" ou container de scroll
    const containers = [
      document.querySelector('[role="rowgroup"]'),
      document.querySelector('div[style*="overflow"]'),
      document.querySelector('div[class*="scroll"]'),
      ...document.querySelectorAll('div')
    ].filter(el => {
      if(!el) return false;
      const style = window.getComputedStyle(el);
      return style.overflowY === 'auto' || style.overflowY === 'scroll' ||
             style.overflow === 'auto' || style.overflow === 'scroll';
    });

    return containers.find(el => el.querySelector('[data-testid="clip-row"]'));
  };

  const scrollContainer = findScrollContainer();

  if(!scrollContainer) {
    console.log('⚠️ Container de scroll não encontrado');
    return;
  }

  console.log('✅ Container de scroll encontrado:', scrollContainer);

  // Intersection Observer para detectar quando usuário chega perto do fim
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        console.log('👁️ Usuário chegou perto do fim da lista, processando novos items...');
        setTimeout(() => {
          addCheckboxes();
        }, 500);
      }
    });
  }, {
    root: scrollContainer,
    rootMargin: '200px', // Detecta 200px antes de chegar no fim
    threshold: 0.1
  });

  // Observa o último elemento da lista
  const observeLastElement = () => {
    const clipRows = scrollContainer.querySelectorAll('[data-testid="clip-row"]');
    if(clipRows.length > 0) {
      const lastRow = clipRows[clipRows.length - 1];
      observer.observe(lastRow);
      console.log('👁️ Observando último elemento da lista');
    }
  };

  // Observa inicialmente
  observeLastElement();

  // Re-observa quando novos elementos são adicionados
  const reObserver = new MutationObserver(() => {
    observer.disconnect(); // Desconecta observações antigas
    observeLastElement(); // Re-observa o novo último elemento
  });

  reObserver.observe(scrollContainer, {
    childList: true,
    subtree: true
  });

  // Também detecta scroll manual
  let scrollTimeout;
  scrollContainer.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Se scrollou mais de 70% da lista
      if(scrollPercentage > 0.7) {
        console.log('📜 Scroll detectado (70%), processando novos items...');
        addCheckboxes();
      }
    }, 300);
  });

  scrollObserverActive = true;
  console.log('✅ Scroll observer ativo para página /create');
}

// Auto-detecta mudança de página
let currentUrl = window.location.href;
setInterval(() => {
  if(window.location.href !== currentUrl) {
    console.log('🔄 Mudança de página detectada');
    currentUrl = window.location.href;
    scrollObserverActive = false;

    setTimeout(() => {
      setupScrollObserver();
      addCheckboxes();
    }, 1000);
  }
}, 1000);

/*──────── 9. START ────────*/
console.log('⏰ Iniciando em 1.5 segundos...');

// Execução inicial única
let initialRun = false;

setTimeout(()=>{
  if(!initialRun) {
    console.log('🚀 Executando inicialização...');

    // Carregar configurações primeiro
    carregarConfiguracoes();

    // Detectar usuário atual
    detectarUsuarioAtual();

    // Restaurar seleção
    restaurarSelecao();

    criarBarra();

    // Atualizar botão de segurança após criar a barra
    setTimeout(() => {
      atualizarBotaoSeguranca();
    }, 100);

    addCheckboxes();
    adicionarBotaoExportarAtual();
    protegerPlayerSuno();

    // Configurar scroll observer se estiver em /create
    setTimeout(() => {
      setupScrollObserver();
    }, 500);

    initialRun = true;
  }
},1500);

// Backup: tenta novamente após 5 segundos se não conseguiu na primeira
setTimeout(()=>{
  if(!document.getElementById('sbd-bar')) {
    console.log('🔄 Tentativa backup de criação da barra...');

    // Carregar configurações
    carregarConfiguracoes();

    // Detectar usuário atual
    detectarUsuarioAtual();

    // Restaurar seleção
    restaurarSelecao();

    criarBarra();

    // Atualizar botão de segurança após criar a barra
    setTimeout(() => {
      atualizarBotaoSeguranca();
    }, 100);

    addCheckboxes();
    adicionarBotaoExportarAtual();
    protegerPlayerSuno();

    // Configurar scroll observer se estiver em /create
    setTimeout(() => {
      setupScrollObserver();
    }, 500);
  }
},5000);

})();

console.log('🎵 Suno Bulk Downloader script carregado!');
