# Estrutura de Ícones - CapCut Prompt Extractor

## Visão Geral

Esta pasta contém todos os ícones necessários para a extensão CapCut Prompt Extractor.

## Estrutura de Arquivos

```
icons/
├── icon-16.svg          # Ícone vetorial 16x16 (fonte)
├── icon-48.svg          # Ícone vetorial 48x48 (fonte)
├── icon-128.svg         # Ícone vetorial 128x128 (fonte)
├── icon-16.png          # Ícone PNG 16x16 (gerado)
├── icon-48.png          # Ícone PNG 48x48 (gerado)
├── icon-128.png         # Ícone PNG 128x128 (gerado)
├── gerar-png.html       # Gerador de ícones PNG
└── README.md            # Esta documentação
```

## Tamanhos de Ícones

As extensões do Chrome/Edge precisam de 3 tamanhos principais:

- **16x16**: Usado na barra de ferramentas do navegador
- **48x48**: Usado na página de gerenciamento de extensões
- **128x128**: Usado na Chrome Web Store e em promoções

## Como Gerar os Ícones PNG

### Opção 1: Usar o Gerador HTML (Recomendado)

1. Abra o arquivo [gerar-png.html](gerar-png.html) no seu navegador
2. Clique em "Baixar Todos os Ícones" para baixar todos de uma vez
3. Os arquivos serão salvos automaticamente na sua pasta de Downloads
4. Mova os arquivos PNG para esta pasta `icons/`

### Opção 2: Usar Ferramentas Online

Se preferir usar ferramentas online:

1. Acesse https://cloudconvert.com/svg-to-png
2. Faça upload dos arquivos SVG
3. Especifique as dimensões corretas (16x16, 48x48, 128x128)
4. Baixe os PNGs gerados
5. Renomeie para `icon-16.png`, `icon-48.png`, `icon-128.png`

### Opção 3: Usar ImageMagick (Linha de Comando)

Se você tiver o ImageMagick instalado:

```bash
# No diretório icons/
magick icon-16.svg -resize 16x16 icon-16.png
magick icon-48.svg -resize 48x48 icon-48.png
magick icon-128.svg -resize 128x128 icon-128.png
```

## Design dos Ícones

### Conceito
- **Letra "P"**: Representa "Prompt" (principal função da extensão)
- **Cor Verde (#4CAF50)**: Transmite criatividade e positividade
- **Cantos Arredondados**: Design moderno e amigável
- **Gradiente** (no ícone 128x128): Adiciona profundidade visual
- **Detalhe Amarelo** (no ícone 128x128): Representando "ideias/criatividade"

### Personalização

Para personalizar os ícones, edite os arquivos SVG:

```svg
<!-- Mudar a cor de fundo -->
<rect width="128" height="128" fill="#SUA_COR" rx="16"/>

<!-- Mudar a letra -->
<text ... >P</text>  <!-- Mude "P" para outra letra -->

<!-- Mudar o gradiente -->
<linearGradient id="grad" ...>
  <stop offset="0%" style="stop-color:#COR1" />
  <stop offset="100%" style="stop-color:#COR2" />
</linearGradient>
```

Depois de editar os SVGs, gere novos PNGs usando o `gerar-png.html`.

## Uso no Manifest

Os ícones estão referenciados no [manifest.json](../manifest.json):

```json
{
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  }
}
```

## Checklist de Implementação

- [x] Criar arquivos SVG nos 3 tamanhos
- [x] Criar gerador de PNG automatizado
- [x] Atualizar manifest.json com referências aos ícones
- [ ] Gerar arquivos PNG usando o gerador
- [ ] Mover PNGs para a pasta icons/
- [ ] Testar a extensão no navegador

## Próximos Passos

1. Abra [gerar-png.html](gerar-png.html) e baixe os PNGs
2. Mova os arquivos PNG baixados para esta pasta
3. Recarregue a extensão no navegador para ver os ícones
4. Verifique se os ícones aparecem corretamente na barra de ferramentas

## Recursos Adicionais

- [Chrome Extension Icons Guide](https://developer.chrome.com/docs/extensions/mv3/user_interface/#icons)
- [Favicon Generator](https://favicon.io/favicon-generator/)
- [SVG to PNG Converter](https://cloudconvert.com/svg-to-png)

## Licença

Os ícones fazem parte da extensão CapCut Prompt Extractor e seguem a mesma licença do projeto.
