# 📁 Estrutura Organizada do Projeto

## 🏗️ Arquitetura de Pastas

```
AUTOMAÇÕES/
│
├── 📄 index.html                 # Página principal de vendas
├── 📄 CNAME                      # Configuração do domínio
├── 📄 ESTRUTURA.md              # Este arquivo (documentação)
│
├── 📂 landing-page/             # Arquivos da página de vendas
│   ├── styles.css               # Estilos da landing page
│   └── script.js                # JavaScript da landing page
│
├── 📂 geradores/                # Geradores de licenças
│   ├── license-generator.html   # Gerador versão 1
│   ├── gerador-online.html      # Gerador versão 2 (principal)
│   └── gerador-licencas-backup.html # Backup do gerador
│
├── 📂 depoimentos/              # Prints de depoimentos
│   ├── depoimento-1.png        # Depoimentos de clientes
│   ├── depoimento-2.png
│   ├── depoimento-3.png
│   ├── depoimento-4.png
│   ├── depoimento-5.png
│   ├── depoimento-6.PNG
│   └── depoimento-7.PNG
│
├── 📂 images/                   # Imagens gerais
│   ├── Create a sleek*.jpg     # Imagens de pacotes
│   ├── ### 2. AUTOMAÇÃO*.jpg
│   ├── ### 3. AUTOMAÇÃO*.jpg
│   ├── ### CLUBE*.jpg
│   └── WhatsApp Image*.jpeg
│
├── 📂 print-ferramentas/        # Screenshots das ferramentas
│   ├── tool-suno-automator.png
│   ├── tool-suno-downloader.png
│   ├── tool-veo3-automator.png
│   ├── tool-wisk-automator.png
│   ├── tool-capcut-prompt-extractor.png
│   ├── tool-capcut-script-sender.png
│   ├── tool-google-speech-automator.png
│   ├── tool-claude-prompt-automator.png
│   ├── tool-gemini-prompt-automator.png
│   ├── tool-gpt-prompt-automator.png
│   ├── tool-midjourney-automator.png
│   └── tool-multi-tab-opener.png
│
├── 📂 docs/                     # Documentação
│   ├── README.md                # Documentação principal
│   ├── COMO-HOSPEDAR-NO-GITHUB.md
│   ├── HOSPEDAR-GITHUB-PAGES.md
│   ├── CREDENCIAIS-MASTER-VEO3.md
│   ├── ORGANIZAR-EXTENSAO.md
│   ├── CODIGO PAGINA.txt
│   └── CONTRATO DE LOCAÇÃO*.docx
│
├── 📂 extensions/               # Extensões Chrome
│   └── ibldaclgfijocpbkmoggknmkebbbldcb.crx
│
├── 📂 .git/                     # Controle de versão
└── 📂 .claude/                  # Configurações Claude

```

## 🌐 URLs do Projeto

### Produção (Online)
- **Página Principal**: https://nardoto.com.br
- **Gerador de Licenças**: https://nardoto.com.br/veo3-licenses/
- **Gerador Alternativo**: https://nardoto.com.br/geradores/gerador-online.html

### Desenvolvimento (Local)
- **Landing Page**: `index.html`
- **Geradores**: `geradores/*.html`

## 🔧 Arquivos Importantes

### Core Files
- `index.html` - Landing page principal
- `landing-page/styles.css` - Estilos customizados
- `landing-page/script.js` - Lógica da página (links Kiwify, countdown, etc)

### Geradores de Licença
- `geradores/gerador-online.html` - Gerador principal com Firebase
- `geradores/license-generator.html` - Versão alternativa

### Configuração
- `CNAME` - Domínio customizado (nardoto.com.br)
- `.git/` - Configuração do Git

## 📝 Notas de Desenvolvimento

### Para Adicionar Novos Depoimentos
1. Salve o print em `depoimentos/`
2. Nome padrão: `depoimento-X.png`
3. Atualize `index.html` com o novo caminho

### Para Adicionar Novas Ferramentas
1. Salve o screenshot em `print-ferramentas/`
2. Nome padrão: `tool-nome-ferramenta.png`
3. Atualize a seção de ferramentas no `index.html`

### Para Modificar Estilos
1. Edite `landing-page/styles.css`
2. Teste localmente antes do push

### Para Atualizar Scripts
1. Edite `landing-page/script.js`
2. Atualize links da Kiwify se necessário

## 🚀 Deploy

```bash
# Fazer commit das mudanças
git add .
git commit -m "Descrição da mudança"
git push

# GitHub Pages atualiza automaticamente em 2-5 minutos
```

## 🔐 Segurança

- **NÃO** commitar credenciais reais
- **NÃO** expor APIs privadas
- Manter senhas em arquivo `.env` (não commitado)
- Usar Firebase Security Rules para proteger dados

## 📞 Contato

**Tharcisio Nardoto**
- WhatsApp: (27) 99913-2594
- Site: https://nardoto.com.br

---

*Última atualização: Novembro 2024*