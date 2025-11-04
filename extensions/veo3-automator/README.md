# 📂 VEO3 Automator - Estrutura do Projeto

## 🎯 Extensão Chrome para Automatização do Google Labs VEO3
**Versão:** 2.0
**Desenvolvedor:** Nardoto

---

## 📁 Estrutura de Pastas

```
VEO3 LOOPLESS - back up-1/
├── 📁 src/                    # Código fonte principal
│   ├── 📁 core/               # Arquivos principais
│   │   └── content.js         # Script principal da extensão
│   │
│   ├── 📁 license/            # Sistema de licenciamento
│   │   ├── license-system.js          # Lógica principal de licença
│   │   ├── license-activation.html    # Página de ativação
│   │   ├── license-activation-script.js # Script da página de ativação
│   │   ├── device-fingerprint.js      # Identificação de dispositivo
│   │   └── firebase-api.js            # Integração com Firebase
│   │
│   ├── 📁 interface/          # Interface do usuário
│   │   ├── sidebar.html      # HTML da barra lateral
│   │   ├── sidebar.css       # Estilos da barra lateral
│   │   └── sidebar-script.js # Scripts da barra lateral
│   │
│   ├── 📁 automation/         # Scripts de automação
│   │   ├── prompt-organizer.js      # Organizador de prompts
│   │   ├── image-automator.js       # Automação de imagens
│   │   ├── whisk-automator.js       # Automação do Whisk
│   │   └── auto-image-loader.js     # Carregador automático de imagens
│   │
│   └── 📁 utils/              # Utilitários
│       └── find-replace-utils.js    # Ferramenta localizar/substituir
│
├── 📁 assets/                 # Recursos visuais
│   ├── 📁 icons/              # Ícones da extensão
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   │
│   └── 📁 IMAGENS/            # Imagens de teste/demonstração
│
├── 📁 docs/                   # Documentação
│   ├── CHANGELOG-REFACTORING.md     # Histórico de mudanças
│   ├── FIREBASE-SETUP-GUIDE.md      # Guia de configuração Firebase
│   ├── LICENSE-SYSTEM-README.md     # Documentação do sistema de licença
│   ├── README-CONTROLES.md          # Guia de controles
│   ├── README-MASS-DOWNLOAD.md      # Guia de download em massa
│   ├── TESTE-FIREBASE.md            # Testes do Firebase
│   └── TESTE-SISTEMA-AVISOS.md      # Testes do sistema de avisos
│
├── 📄 manifest.json           # Configuração da extensão Chrome
└── 📄 README.md              # Este arquivo
```

---

## 🚀 Funcionalidades Principais

### 1. 🔐 **Sistema de Licenciamento**
- Validação online via Firebase
- Fingerprint de dispositivo único
- Sistema de 20 envios após revogação
- Interface de ativação integrada

### 2. 🎬 **Automação de Vídeos**
- Processamento em lote
- Suporte a imagens (Frame-to-Video)
- Integração com Google Labs VEO3
- Automação do Whisk

### 3. 🎨 **Interface Intuitiva**
- Sidebar deslizante
- Indicador de status de licença
- Contador de vídeos processados
- Sistema de localizar/substituir

### 4. 🛡️ **Segurança**
- Criptografia SHA-256
- Validação de hardware
- Cache inteligente de 5 minutos
- Fallback offline de 7 dias

---

## 📦 Instalação

### 1. **Preparar arquivos**
```bash
# Clone ou baixe o projeto
# Certifique-se que todas as pastas estão corretas
```

### 2. **Instalar no Chrome**
1. Abra `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta do projeto

### 3. **Ativar licença**
1. Clique no ícone da extensão
2. Insira credenciais fornecidas
3. Aguarde validação

---

## 🔧 Configuração

### **Firebase (Admin)**
1. Configure projeto no Firebase Console
2. Atualize credenciais em `firebase-api.js`
3. Configure regras do Firestore

### **Personalização**
- **Tempo de cache:** `license-system.js` → `CACHE_DURATION`
- **Limite de envios:** `license-system.js` → `MAX_SUBMISSIONS_AFTER_REVOKE`
- **Delay entre vídeos:** Interface da extensão

---

## 📱 Uso

### **Para Processar Vídeos**
1. Acesse https://labs.google/fx/tools/video-fx
2. Clique no ícone ⭐ para abrir a sidebar
3. Cole seus prompts no campo de texto
4. Clique em "Processar" para organizar
5. Clique em "Iniciar Automação" para enviar

### **Formato de Prompts**
```
Título do Vídeo 1
Descrição detalhada do vídeo...

Título do Vídeo 2
Descrição detalhada do vídeo...
```

---

## 🛠️ Desenvolvimento

### **Estrutura Modular**
- **Core:** Lógica principal e inicialização
- **License:** Todo sistema de autenticação
- **Interface:** Componentes visuais
- **Automation:** Processamento de vídeos
- **Utils:** Ferramentas auxiliares

### **Fluxo de Execução**
1. `manifest.json` carrega scripts na ordem
2. `license-system.js` valida licença
3. `content.js` inicializa interface
4. Scripts de automação processam vídeos

---

## 📝 Manutenção

### **Logs e Debug**
- Console do Chrome: `F12` → Console
- Mensagens prefixadas com emojis para fácil identificação
- Sistema de status visual na interface

### **Atualizações**
1. Sempre teste em ambiente local
2. Atualize versão no `manifest.json`
3. Documente mudanças em `CHANGELOG-REFACTORING.md`

---

## ⚠️ Avisos Importantes

- **NÃO** compartilhe credenciais de licença
- **NÃO** modifique sistema de fingerprint
- **SEMPRE** faça backup antes de atualizações
- **TESTE** em ambiente separado primeiro

---

## 📞 Suporte

**WhatsApp:** (27) 99913-2594
**Email:** nardoto@suporte.com
**Documentação:** Pasta `/docs`

---

## 📜 Licença

Software proprietário - Todos os direitos reservados
© 2024 Nardoto - VEO3 Automator

---

**Última atualização:** Novembro 2024
**Versão da documentação:** 1.0.0