# Melhorias na Extração de Prompts

## O que foi melhorado

A extensão agora possui **3 camadas de extração** para garantir que TODOS os prompts sejam capturados:

### 1. Interceptação de Logs do Console
- Monitora mensagens de log do CapCut que contêm `text to image resp=`, `image to image resp=` e `genVideo resp=`
- Extrai prompts diretamente das respostas JSON nos logs
- **Indicador no console**: `✅ Prompt capturado do log: ...`

### 2. Interceptação de Requisições de Rede
- Intercepta XMLHttpRequest e Fetch API
- Captura respostas da API do CapCut em tempo real
- Processa JSON automaticamente para extrair prompts
- **Indicador no console**: `🔍 Prompt capturado da API: ...`

### 3. Extração do Modal Visual (Método Original)
- Procura campos de texto e textareas visíveis na página
- Seletores mais robustos e amplos
- Funciona como fallback caso os métodos acima falhem

## Como funciona

### Fluxo de Extração

1. **Ao clicar no botão "Substituir"**:
   - A extensão limpa o cache de prompts capturados
   - Clica no botão
   - Aguarda 300ms para capturar logs e requisições
   - Verifica se há prompts capturados automaticamente
   - Se não houver, tenta extrair do modal visual

2. **Prioridade de Extração**:
   - 1º: Prompts capturados de logs/API (mais confiável)
   - 2º: Prompts extraídos do modal visual

3. **Filtragem**:
   - Remove prompts de teste em chinês (`测试生成一张图`, `测试图生图`, `测试生视频`)
   - Remove prompts muito curtos (menos de 3 caracteres)
   - Remove duplicatas usando hash SHA-256

## Estrutura de Dados Capturados

### Prompt Capturado
```javascript
{
  text: "texto do prompt",
  timestamp: "27/10/2025, 14:30:00",
  source: "api_response" | "console_log" | "modal"
}
```

### Tipos de Componentes Suportados

1. **Text to Image** (Texto para Imagem)
   - Caminho: `component.abilities.generate.core_param.prompt`

2. **Image to Image** (Imagem para Imagem / Blend)
   - Caminho: `component.abilities.blend.core_param.prompt`

3. **Video Generation** (Geração de Vídeo)
   - Caminho: `component.abilities.gen_video.text_to_video_params.video_gen_inputs[0].prompt`

## Seletores CSS Utilizados

### Elementos de Cena
- `.shotItem-E5KGax` - Container de cada cena

### Botões de Substituir
- `.toolItem-CZ28Et` - Classe principal do botão
- SVG path específico (fallback)

### Campos de Prompt
Prioridade dos seletores:
1. `textarea[class*="prompt"]`
2. `textarea[placeholder*="prompt"]`
3. `textarea[placeholder*="Describe"]`
4. `textarea[placeholder*="描述"]` (chinês)
5. `.lv-textarea[class*="prompt-input"]`
6. `.aigc-prompt-input`
7. `textarea` (genérico)
8. `[contenteditable="true"]` (editor rico)

### Modais
1. `.aigc-creator-modal-content`
2. `.semi-modal-content`
3. `[class*="modal-content"]`
4. `[role="dialog"]`

## Debugging

### Mensagens no Console

- `✅ Prompt capturado do log:` - Capturado de console.log
- `🔍 Prompt capturado da API:` - Capturado de requisição
- `Processando elemento X/Y` - Progresso da extração
- `Clicando no botão de substituir` - Ação executada
- `Botão de substituir não encontrado` - Erro ao localizar botão

### Verificar Extração

1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Execute a extração
4. Observe as mensagens com emojis (✅ e 🔍)

## Resolução de Problemas

### Nenhum prompt é extraído

**Possíveis causas**:
1. Página do CapCut ainda não carregou completamente
2. Estrutura HTML do CapCut mudou
3. Bloqueio de interceptação

**Soluções**:
1. Recarregue a página do CapCut (F5)
2. Recarregue a extensão no Chrome
3. Verifique o console por erros

### Alguns prompts não são capturados

**Possíveis causas**:
1. Tempo de espera muito curto
2. Modal demora para abrir
3. Rede lenta

**Soluções**:
1. A extensão já possui sistema de retry (2 tentativas)
2. Verifique sua conexão de internet
3. Se persistir, entre em contato com logs do console

### Prompts duplicados

**Não deve acontecer** - a extensão usa hash SHA-256 para evitar duplicatas. Se acontecer, reporte o bug.

## Melhorias Futuras Planejadas

- [ ] Suporte para mais tipos de geração (text-to-video, etc)
- [ ] Exportação com metadados completos (tipo de geração, parâmetros)
- [ ] Interface para revisar prompts antes de salvar
- [ ] Sincronização com cloud storage
- [ ] Importação de prompts de outros formatos

## Compatibilidade

- **Navegador**: Chrome/Edge (Manifest V3)
- **Site**: CapCut Web (capcut.com)
- **Versão testada**: Outubro 2025

## Contribuindo

Se encontrar bugs ou tiver sugestões, por favor:
1. Abra o console (F12)
2. Copie os logs relevantes
3. Reporte com detalhes sobre o que estava fazendo
