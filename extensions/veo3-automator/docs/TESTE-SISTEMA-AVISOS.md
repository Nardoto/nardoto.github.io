# 🔐 Sistema de Avisos e Verificação de Licença - VEO3 Automator

## 📋 O que foi implementado:

### 1. **Sistema de 20 Envios após Revogação**
- Quando uma licença é revogada, o usuário recebe **1 AVISO**
- **PROCESSAR** prompts continua funcionando **ILIMITADAMENTE** (apenas organiza)
- **ENVIAR/GERAR** vídeos tem limite de **20 ENVIOS** após revogação
- Após esgotar os 20 envios, acesso **TOTALMENTE BLOQUEADO**

### 2. **Verificação Diferenciada**
- ❌ **"Processar Vídeos"** - NÃO verifica licença (sempre funciona)
- ✅ **"Iniciar Automação"** - Verifica licença e conta envios
- ✅ **A cada lote de 5 vídeos** - Verifica e conta envios
- ✅ **Cada envio individual** - Incrementa contador

### 3. **Cache Inteligente de 5 Minutos**
- Evita múltiplas verificações desnecessárias
- Reduz consumo da cota do Firebase
- Verificações em sequência usam o cache

### 4. **Indicador Visual na Interface**
- Aparece no topo da sidebar quando licença está revogada
- Mostra contador de envios restantes em tempo real
- Muda de cor conforme envios diminuem:
  - **Verde** (20-11 envios): Normal
  - **Laranja** (10-6 envios): Atenção
  - **Vermelho** (5-0 envios): Crítico

## 🧪 Como Testar o Sistema:

### Teste 1: Revogação com Aviso
1. **No Gerador de Licenças** (https://nardoto.github.io):
   - Crie uma nova licença de teste
   - Ative na extensão
   - Teste que está funcionando

2. **Revogue a licença**:
   - No gerador, clique em "🗑️ Revogar" na licença
   - Confirme a revogação

3. **No Chrome (usuário)**:
   - Clique em "Processar Vídeos"
   - **RESULTADO ESPERADO**:
     - Prompts são processados **NORMALMENTE** (sem verificação)
     - Aparece indicador: "⚠️ Licença revogada - 20 envios restantes"

4. **Iniciar Automação**:
   - Clique em "Iniciar Automação"
   - **RESULTADO ESPERADO**:
     - Aparece aviso: "Licença revogada! Você tem 20 envios restantes"
     - Confirmar para continuar
     - Cada vídeo enviado desconta do contador

5. **Após 20 envios**:
   - Ao tentar o 21º envio
   - **RESULTADO ESPERADO**:
     - Aparece: "ACESSO BLOQUEADO - Limite esgotado"
     - Página recarrega e extensão não funciona mais

### Teste 2: Verificação Durante Automação
1. **Configure uma lista com 20+ vídeos**
2. **Inicie a automação**
3. **Durante o processamento do primeiro lote**:
   - Vá ao gerador e revogue a licença
4. **RESULTADO ESPERADO**:
   - Após processar 5 vídeos (1º lote)
   - Durante a pausa de 60 segundos
   - Aparece verificação de licença
   - Recebe o aviso mas continua
   - No próximo lote: BLOQUEIO TOTAL

### Teste 3: Cache de 5 Minutos
1. **Com licença válida**:
   - Processe vídeos (1ª verificação)
   - Imediatamente processe novamente (usa cache)
   - Verifique o console: "✅ Usando cache de licença válida"

2. **Aguarde 5+ minutos**:
   - Processe novamente
   - Verifique o console: "⚡ Verificação rápida de licença..."
   - Nova verificação no Firebase

## 📊 Comportamento após Revogação:

| Ação do Usuário | Comportamento | Contador |
|-----------------|---------------|----------|
| **Processar Vídeos** | ✅ Sempre funciona | Não conta |
| **Iniciar Automação** | ⚠️ Aviso + Continua | Conta envios |
| **Enviar Individual** | ⚠️ Funciona até limite | -1 envio |
| **Após 20 envios** | 🚫 Bloqueio total | Esgotado |
| **Recarregar Página** | Mantém contador | Persistente |

## 🔧 Configurações Ajustáveis:

No arquivo `license-system.js`:
```javascript
licenseCheckCache = {
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos (ajustável)
    MAX_WARNINGS: 1, // Número de avisos antes de contar envios
    MAX_SUBMISSIONS_AFTER_REVOKE: 20, // Máximo de envios após revogação
    submissionCount: 0, // Contador de envios atual
    isRevoked: false // Status de revogação
}
```

## 📱 Mensagens ao Usuário:

### Primeiro Aviso (ao detectar revogação):
```
⚠️ ATENÇÃO: Sua licença foi revogada!

📊 Você ainda pode:
✅ PROCESSAR prompts ilimitadamente (organizar)
⚠️ ENVIAR até 20 vídeos para geração

📢 Após 20 envios, o acesso será bloqueado totalmente.

💡 Entre em contato com o suporte para renovar:
📧 Suporte: nardoto@suporte.com
```

### Aviso de Poucos Envios (5 restantes):
```
⚠️ ATENÇÃO: Você tem apenas 5 envios restantes!

Após esgotar os envios, o acesso será bloqueado.
Entre em contato com o suporte: nardoto@suporte.com
```

### Último Envio:
```
🚨 ÚLTIMO ENVIO!

Este é seu último envio permitido.
Após este envio, o acesso será bloqueado.
Entre em contato urgente: nardoto@suporte.com
```

### Bloqueio Final (após 20 envios):
```
🚫 ACESSO BLOQUEADO

Você utilizou todos os 20 envios permitidos após a revogação.

Para continuar usando a extensão, entre em contato com o suporte:
📧 Suporte: nardoto@suporte.com
```

## 🛡️ Segurança Adicional:

1. **Verificação de Fingerprint**: Impede uso em outra máquina
2. **Validação Online Prioritária**: Firebase sempre consultado primeiro
3. **Fallback Offline Limitado**: Máximo 7 dias sem internet
4. **Cache Temporário**: Apenas 5 minutos para economizar Firebase
5. **Avisos Rastreados**: Contador persiste entre sessões

## 📝 Notas Importantes:

- **Processar** = Organizar prompts (sempre funciona)
- **Enviar** = Gerar vídeos (conta do limite de 20)
- O contador de envios é **PERSISTENTE** (salvo no Chrome)
- Se o usuário limpar dados do Chrome, contador **RESETA**
- O cache de 5 minutos é **POR SESSÃO**, não persiste
- Verificação em lotes ocorre **ENTRE** lotes, não durante

## 🚀 Benefícios:

1. **Para você (admin)**:
   - Revogação com período de cortesia (20 envios)
   - Cliente pode organizar trabalho antes do bloqueio
   - Economia de cota Firebase com cache
   - Controle preciso via contador

2. **Para o usuário**:
   - Pode continuar organizando prompts (processar)
   - 20 envios de cortesia para finalizar trabalhos
   - Avisos progressivos (5 restantes, último envio)
   - Indicador visual do status na interface
   - Tempo para entrar em contato e renovar

---

**Última atualização**: Novembro 2024
**Versão**: 2.0.0 - Sistema de 20 Envios