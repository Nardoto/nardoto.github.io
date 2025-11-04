# Extensão: Abrir Múltiplas Abas + CapCut Automation

Esta extensão permite:
1. Abrir uma quantidade específica de abas de um site no Google Chrome
2. Automatizar o processo de criação de vídeos no CapCut AI Creator com um painel lateral

## Como instalar:

1. **Os ícones já estão criados!**
   - Os ícones profissionais já foram gerados na pasta `icons/`
   - Você não precisa fazer nada relacionado aos ícones!

2. **Carregar a extensão no Chrome:**
   - Abra o Chrome e digite na barra de endereços: `chrome://extensions/`
   - Ative o "Modo do desenvolvedor" (canto superior direito)
   - Clique em "Carregar sem compactação"
   - Selecione a pasta: `c:\Users\tharc\Videos\extenções\autopasta`
   - A extensão será instalada!

3. **Como usar:**

   **Abrir múltiplas abas:**
   - Clique no ícone da extensão na barra de ferramentas do Chrome
   - Digite a URL do site que deseja abrir (padrão: CapCut AI Creator)
   - Digite a quantidade de abas (máximo 20)
   - Clique em "Abrir Abas"

   **Automatizar CapCut:**
   - Quando você abrir o site do CapCut, um painel lateral roxo aparecerá automaticamente
   - Cole seu script no campo de texto
   - **Contador de palavras em tempo real:**
     - Mostra quantidade de palavras digitadas
     - Indica quando você atinge 80% do limite (1040 palavras)
     - Alerta quando excede 1300 palavras
     - Cores visuais: Verde (OK), Amarelo (Atenção), Vermelho (Excedido)
   - **Selecione o estilo de ilustração** desejado (55 opções disponíveis)
   - **Selecione a voz** desejada (122+ opções disponíveis)
   - Clique em "Executar"
   - A extensão fará automaticamente:
     1. Clicar em "Instant AI video"
     2. Selecionar "Enter script"
     3. Procurar e selecionar o estilo escolhido (com scroll automático)
     4. Inserir seu texto
     5. Selecionar a voz escolhida (com scroll automático)
     6. Clicar em "Create"

## Estrutura de arquivos:

```
autopasta/
├── manifest.json        # Configuração da extensão
├── popup.html           # Interface popup para abrir abas
├── popup.js             # Lógica do popup
├── styles.css           # Estilos do popup
├── content.js           # Script de automação do CapCut
├── content-styles.css   # Estilos do painel lateral
├── icons/               # Pasta com os ícones
│   ├── icon16.png       # Ícone 16x16
│   ├── icon48.png       # Ícone 48x48
│   ├── icon128.png      # Ícone 128x128
│   ├── generate_icons.html       # Gerador visual de ícones
│   ├── create_icons_auto.py      # Script Python para gerar ícones
│   └── README.md                 # Documentação dos ícones
└── README.md            # Este arquivo
```

## Funcionalidades:

### Abrir Múltiplas Abas
- Abre até 20 abas simultaneamente
- URL padrão: CapCut AI Creator
- Validação de URLs

### Automação CapCut
- Painel lateral fixo e elegante (roxo/azul)
- **Contador de palavras em tempo real**
  - Limite recomendado: 1300 palavras para melhor funcionamento do CapCut
  - Feedback visual com cores (verde/amarelo/vermelho)
  - Alerta quando próximo ou acima do limite
- **Seletor de estilo de ilustração**
  - 55 estilos disponíveis (Realistic Film, Cartoon 3D, Anime, Horror, etc.)
  - Busca automática com scroll até encontrar o estilo escolhido
- **Seletor de voz**
  - 122+ vozes disponíveis (Knightley, Ms. Labebe, Adam, Marcus, etc.)
  - Busca automática com scroll vertical no dropdown de vozes
- Inserção automática de scripts
- Feedback em tempo real do processo (6 passos)
- Botão para minimizar/maximizar o painel

## Observações:

- A extensão tem um limite de 20 abas por segurança
- A URL deve começar com http:// ou https://
- O painel de automação só aparece no site do CapCut
- Cada aba tem seu próprio painel independente
- **O CapCut funciona melhor com scripts de até 1300 palavras**
  - O contador ajuda você a manter o script no tamanho ideal
  - Scripts muito longos podem causar problemas na geração de vídeos
