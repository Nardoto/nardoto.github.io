# Whisk Image Downloader - Guia de Uso

## 📸 Sobre o Whisk Downloader

O Whisk Downloader é uma funcionalidade da extensão que permite baixar todas as imagens geradas no Google Labs Whisk de uma vez, com nomes baseados nos prompts usados para gerar as imagens.

## 🎯 Problema Resolvido

- **Antes**: As imagens baixadas do Whisk vêm com nomes genéricos (ex: `download.png`, `image_123456.jpg`)
- **Depois**: As imagens são baixadas com nomes descritivos baseados nos prompts (ex: `whisk_1_sunset_landscape.png`)

## 🚀 Como Usar

1. **Acesse o Whisk**
   - Navegue até seu projeto no Whisk: `https://labs.google/fx/pt/tools/whisk/project/[seu-id]`

2. **Interface do Downloader**
   - Um botão flutuante aparecerá no canto inferior direito da tela
   - O botão mostra "Baixar Todas as Imagens" com um ícone de download

3. **Baixar Imagens**
   - Clique no botão para iniciar o download em massa
   - O progresso será mostrado em tempo real (ex: "Baixando... 50% (5/10)")
   - As imagens já baixadas receberão uma borda verde e um check mark

4. **Nomes dos Arquivos**
   - Formato: `whisk_[número]_[prompt].extensão`
   - Exemplo: `whisk_1_abstract_colorful_art.png`
   - Caracteres especiais são automaticamente removidos/substituídos

## 🎨 Recursos

### Interface Visual
- **Botão Principal**: Azul com ícone do Material Design
- **Estados do Botão**:
  - 🔵 Azul: Pronto para baixar
  - 🔴 Vermelho: Baixando...
  - 🟢 Verde: Concluído
  - 🟠 Laranja: Nenhuma imagem encontrada

### Painel de Informações
- Mostra instruções básicas
- Indica quantas imagens estão disponíveis
- Exibe status do processo

### Indicadores Visuais
- ✅ Check mark verde nas imagens já baixadas
- 🔲 Borda verde nas imagens processadas
- 📊 Progresso em porcentagem

## ⚙️ Configurações (Editáveis no código)

```javascript
const CONFIG = {
    DELAY_BETWEEN_DOWNLOADS: 500,  // Tempo entre downloads (ms)
    DEBUG: true,                   // Logs no console
    AUTO_RENAME: true              // Renomear automaticamente
};
```

## 🔍 Como o Script Detecta as Imagens

O script procura imagens usando múltiplos seletores:
- Imagens em containers com `data-item-index`
- Imagens dentro de divs com classes relacionadas a "image", "grid", "gallery"
- Elementos `<figure>` e `<article>` com imagens
- Imagens com URLs do Google/Whisk

## 📝 Como os Prompts são Extraídos

1. **Prioridade 1**: Atributo `alt` da imagem
2. **Prioridade 2**: Atributo `title` da imagem
3. **Prioridade 3**: Texto em elementos próximos (p, span, div)
4. **Prioridade 4**: Texto do container pai
5. **Fallback**: Nome com timestamp (`whisk_image_1234567890`)

## 🛠️ Solução de Problemas

### Botão não aparece
- Aguarde a página carregar completamente (2 segundos)
- Verifique se está na URL correta do Whisk
- Abra o console (F12) e procure por logs "[Whisk-Downloader]"

### Imagens não são baixadas
- Verifique se as imagens estão completamente carregadas
- Algumas imagens podem estar protegidas ou indisponíveis
- Verifique permissões do navegador para downloads múltiplos

### Nomes incorretos
- O script tenta extrair o prompt de várias formas
- Se não encontrar, usa um nome genérico com timestamp
- Você pode renomear manualmente após o download

## 🔄 Atualizações Dinâmicas

O script detecta automaticamente quando novas imagens são adicionadas à página e remove a marcação de "processado", permitindo baixá-las novamente.

## 📊 Limitações

- Downloads simultâneos são feitos em sequência para evitar sobrecarga
- Nomes de arquivo são limitados a 100 caracteres
- Caracteres especiais são substituídos por underscore
- Extensões suportadas: .jpg, .png, .webp, .gif

## 🎯 Casos de Uso

1. **Organização de Projetos**: Baixe todas as variações de um projeto com nomes descritivos
2. **Backup**: Salve todas as suas criações localmente
3. **Portfolio**: Organize suas imagens por prompt/tema
4. **Comparação**: Compare diferentes versões lado a lado com nomes claros