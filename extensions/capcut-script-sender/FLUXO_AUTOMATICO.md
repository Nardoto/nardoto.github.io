# Fluxo Automático de Extração e Edição

## Nova Funcionalidade (v1.2)

A extensão agora possui um **fluxo completo automatizado** que:

1. ✅ Extrai todos os prompts e imagens
2. ✅ Exporta automaticamente TXT + imagens
3. ✅ Clica no botão "Edit more"
4. ✅ Substitui o nome do projeto no editor

## Como Funciona

### Passo 1: Configurar Nome do Projeto

No popup da extensão, digite o nome desejado no campo:
```
Nome do Arquivo TXT: [meu_projeto_2025]
```

Este nome será usado para:
- Nome do arquivo TXT exportado
- Nome do projeto no editor do CapCut

### Passo 2: Iniciar Extração

Clique em **"🔍 Extrair Todos"**

### Passo 3: Fluxo Automático

A extensão executará automaticamente:

1. **Extração de Prompts e Imagens**
   - Varre todas as cenas
   - Captura prompts de 3 formas (logs, API, modal)
   - Converte imagens blob para base64

2. **Exportação Automática** (após 3 segundos)
   - Baixa arquivo TXT com prompts
   - Baixa todas as imagens com nomes baseados nos prompts
   - Usa prefixos configurados (se houver)

3. **Abertura do Editor**
   - Procura o botão "Edit more"
   - Clica automaticamente
   - Abre nova aba/janela do editor

4. **Configuração do Nome do Projeto**
   - Detecta a mudança para URL `/editor/`
   - Procura o elemento `<div class="draft-input__read-only">`
   - Substitui o conteúdo pelo nome configurado

## Exemplo de Uso Completo

### Configuração Inicial

```
Nome do Arquivo: projeto_carros_futuristas
Prefixo da Linha: Cena
Prefixo do Prompt: hyper realistic 4k
```

### Resultado Esperado

1. **Arquivos Baixados**:
   ```
   Downloads/
   ├── projeto_carros_futuristas.txt
   ├── Cena_1_hyper_realistic_4k_sports_car_concept.png
   ├── Cena_2_hyper_realistic_4k_engine_details.png
   └── Cena_3_hyper_realistic_4k_interior_design.png
   ```

2. **No Editor do CapCut**:
   - O nome do projeto aparecerá como: `projeto_carros_futuristas`
   - Em vez do padrão: `202510280521`

## Elementos HTML Alvo

### Botão "Edit more"
```html
<button class="lv-btn lv-btn-secondary lv-btn-size-small lv-btn-shape-square button-OU7gqF" type="button">
  <span>Edit more</span>
</button>
```

### Campo do Nome do Projeto
```html
<div class="draft-input__read-only">202510280521</div>
```
Será substituído por:
```html
<div class="draft-input__read-only">projeto_carros_futuristas</div>
```

## Mensagens no Console

Durante o processo, você verá:

```
✅ Extração concluída! X prompts foram extraídos.
📥 Iniciando exportação automática...
✅ Exportando automaticamente...
🔍 Procurando botão Edit more...
✅ Botão Edit more encontrado, clicando...
🌐 URL mudou para: https://www.capcut.com/editor/...
✅ Draft input encontrado. Conteúdo atual: 202510280521
✅ Conteúdo substituído por: projeto_carros_futuristas
✅ Nome do projeto definido: projeto_carros_futuristas
```

## Troubleshooting

### O botão "Edit more" não é clicado

**Possíveis causas**:
1. O botão ainda não carregou na página
2. A estrutura HTML mudou
3. O botão tem classes diferentes

**Soluções**:
1. Aguarde a página carregar completamente
2. Verifique se o botão está visível
3. Reporte com o HTML do botão para atualização

### O nome do projeto não é substituído

**Possíveis causas**:
1. A página do editor ainda não carregou
2. O elemento `draft-input__read-only` mudou
3. Não foi configurado um nome no campo

**Soluções**:
1. Digite um nome no campo antes de extrair
2. Aguarde a página do editor carregar
3. Verifique o console (F12) por mensagens de erro

### Exportação não acontece automaticamente

**Possíveis causas**:
1. Popup fechado durante a extração
2. Erro ao salvar prompts
3. Nenhum prompt foi extraído

**Soluções**:
1. Mantenha o popup aberto ou minimizado
2. Verifique se há prompts extraídos
3. Tente exportar manualmente depois

## Configurações Avançadas

### Desabilitar Fluxo Automático

Se preferir o comportamento manual, você pode:

1. Extrair os prompts normalmente
2. Exportar manualmente com os botões
3. Clicar manualmente em "Edit more"

O fluxo automático só é ativado quando:
- A extração completa com sucesso
- Há pelo menos 1 prompt extraído
- Não foi interrompida pelo botão "Parar"

### Tempos de Espera

Os delays padrão são:
- **3 segundos** após extração para exportar
- **1 segundo** após mudar de página para substituir nome

Se sua máquina for lenta, estes valores podem ser ajustados no código.

## Permissões Necessárias

A extensão precisa das permissões:
- `activeTab` - Para interagir com a página
- `storage` - Para salvar prompts e configurações
- `downloads` - Para exportar arquivos automaticamente
- `sidePanel` - Para funcionar no painel lateral
- `host_permissions` - Para funcionar em capcut.com

## Versão

**v1.2** - Fluxo Automático Completo
- Exportação automática após extração
- Clique automático em "Edit more"
- Substituição do nome do projeto
- Background service worker para downloads

## Notas Técnicas

### Comunicação entre Scripts

```
content.js → background.js → popup.js
    ↓              ↓            ↓
Extração    Downloads    Interface
    ↓              ↓            ↓
Edit more   Exportação   Feedback
    ↓
Editor
```

### Armazenamento

```javascript
chrome.storage.local:
{
  prompts: [...],        // Array de prompts com imagens
  lastFilename: "...",   // Nome configurado do projeto
}
```

### Detecção de Mudança de URL

Usa `MutationObserver` + verificação periódica para detectar quando a URL muda para `/editor/`.

## Changelog

**v1.2** (Outubro 2025)
- ✅ Fluxo automático completo
- ✅ Exportação automática após extração
- ✅ Clique em "Edit more"
- ✅ Substituição do nome do projeto
- ✅ Background service worker
- ✅ Downloads API integration