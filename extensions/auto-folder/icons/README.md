# Ícones da Extensão

Esta pasta contém os ícones da extensão "Abrir Múltiplas Abas" em 3 tamanhos diferentes.

## Arquivos necessários:

- `icon16.png` - Ícone 16x16 pixels (barra de ferramentas)
- `icon48.png` - Ícone 48x48 pixels (página de extensões)
- `icon128.png` - Ícone 128x128 pixels (Chrome Web Store)

## Como gerar os ícones:

### Opção 1: Gerador HTML (Recomendado - Mais fácil)

1. Abra o arquivo `generate_icons.html` no navegador
2. Clique em "Baixar Todos os Ícones"
3. Os arquivos serão baixados automaticamente
4. Renomeie os arquivos:
   - `icon-16.png` → `icon16.png`
   - `icon-48.png` → `icon48.png`
   - `icon-128.png` → `icon128.png`
5. Mova os arquivos para esta pasta (`icons/`)

### Opção 2: Script Python (Automático)

```bash
cd icons
pip install pillow
python create_icons_auto.py
```

## Design do Ícone:

- **Fundo:** Gradiente roxo/azul (#667eea → #764ba2)
- **Elementos:** Três abas em camadas (representando múltiplas abas)
- **Símbolo:** "+" indicando adicionar/abrir mais abas
- **Estilo:** Moderno, flat design com sombras sutis

## Após gerar os ícones:

1. Certifique-se que os 3 arquivos estão nesta pasta
2. Vá em `chrome://extensions/`
3. Clique em "Recarregar" na extensão
4. Os novos ícones serão aplicados!
