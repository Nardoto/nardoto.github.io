# 📥 Flow Mass Downloader - Download em Massa de Vídeos

## 🎯 Funcionalidade

Esta nova funcionalidade permite baixar **TODOS os vídeos** do Google Flow automaticamente, resolvendo o problema de ter que baixar vídeo por vídeo manualmente.

## ✨ Recursos

- 🔍 **Detecção Automática**: Detecta automaticamente todos os vídeos na página
- 📜 **Scroll Infinito**: Faz scroll automático para carregar todos os vídeos
- 🚀 **Download em Massa**: Baixa todos os vídeos automaticamente
- ⏱️ **Controle de Velocidade**: Configuração de delay entre downloads
- 📊 **Estatísticas em Tempo Real**: Mostra progresso e status dos downloads
- 🎛️ **Interface Integrada**: Totalmente integrado com o VEO3 Automator

## 🚀 Como Usar

### 1. Acessar a Funcionalidade
- Abra o Google Flow (https://labs.google/fx/pt/tools/flow/project)
- Clique no botão do VEO3 Automator (ícone +) para abrir a sidebar
- Na sidebar, você verá a seção **"📥 Download em Massa de Vídeos"**

### 2. Detectar Vídeos
- Clique em **"🔍 Detectar Vídeos"** para encontrar todos os vídeos na página atual
- O sistema irá mostrar quantos vídeos foram detectados

### 3. Carregar Todos os Vídeos (Opcional)
- Se a página usa scroll infinito, clique em **"📜 Carregar Todos"**
- Isso fará scroll automático para carregar todos os vídeos disponíveis
- Aguarde até que todos os vídeos sejam carregados

### 4. Configurar Delay (Opcional)
- Ajuste o delay entre downloads no campo **"⏱️ Delay entre downloads"**
- Padrão: 3 segundos (recomendado para evitar sobrecarga)

### 5. Iniciar Download em Massa
- Clique em **"🚀 Baixar Todos"** para iniciar o download automático
- O sistema baixará todos os vídeos detectados automaticamente
- Você pode parar a qualquer momento clicando em **"⏹️ Parar Download"**

### 6. Acompanhar Progresso
- As estatísticas são atualizadas em tempo real:
  - **Vídeos Detectados**: Total de vídeos encontrados
  - **Baixados**: Quantos já foram baixados
  - **Status**: Estado atual do processo

## 📋 Lista de Vídeos

Após detectar os vídeos, você verá uma lista com:
- Título de cada vídeo
- Status (Aguardando/Baixado)
- Botão para download individual (se necessário)

## ⚙️ Configurações

### Delay Entre Downloads
- **Recomendado**: 3-5 segundos
- **Rápido**: 1-2 segundos (pode causar sobrecarga)
- **Lento**: 5+ segundos (mais seguro)

### Comportamento do Scroll
- O sistema faz até 50 tentativas de scroll
- Delay de 2 segundos entre cada scroll
- Para automaticamente quando não há mais vídeos para carregar

## 🔧 Detalhes Técnicos

### Seletores de Botões de Download
O sistema detecta botões de download usando múltiplos seletores:
```javascript
[
    '[aria-label*="download"]',
    '[title*="download"]',
    '[data-testid*="download"]',
    'button[aria-label*="Download"]',
    '.download-button',
    'button[title*="Baixar"]',
    'button[title*="Download"]'
]
```

### Estratégias de Download
1. **Simulação de Hover**: Revela botões ocultos
2. **Múltiplas Estratégias de Clique**: Garante que o download seja iniciado
3. **Processamento em Lotes**: Baixa 5 vídeos por vez para melhor performance

## 🚨 Limitações e Considerações

### Limitações do Navegador
- Downloads são limitados pelas configurações do navegador
- Alguns vídeos podem não ter botão de download disponível
- Rate limiting pode afetar downloads muito rápidos

### Recomendações
- Use delays apropriados (3+ segundos)
- Não deixe a aba inativa durante downloads longos
- Verifique se há espaço suficiente no disco
- Alguns vídeos podem precisar de download manual

## 🐛 Solução de Problemas

### "Nenhum vídeo detectado"
- Verifique se você está na página correta do Google Flow
- Tente fazer scroll manual para carregar mais vídeos
- Recarregue a página e tente novamente

### "Download falhou"
- Verifique sua conexão com a internet
- Aumente o delay entre downloads
- Alguns vídeos podem estar indisponíveis

### "Botão de download não encontrado"
- Alguns vídeos podem não ter download disponível
- Tente fazer hover manual no vídeo primeiro
- Verifique se o vídeo foi completamente carregado

## 📝 Logs e Debug

Para acompanhar o processo em detalhes:
1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Procure por mensagens com prefixo "📥 Flow Mass Downloader"

## 🎉 Dicas de Uso

1. **Para muitos vídeos**: Use delay maior (5+ segundos)
2. **Para poucos vídeos**: Pode usar delay menor (1-2 segundos)
3. **Vídeos grandes**: Aumente o delay para evitar sobrecarga
4. **Download interrompido**: Use a lista de vídeos para baixar individualmente os restantes

## 🔄 Atualizações

Esta funcionalidade está em desenvolvimento ativo. Novas melhorias incluem:
- Suporte a mais tipos de botões de download
- Melhor detecção de vídeos
- Configurações avançadas
- Estatísticas mais detalhadas

---

**Desenvolvido por Nardoto** - Para suporte, entre em contato através dos canais oficiais.
