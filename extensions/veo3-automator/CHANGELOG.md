# Changelog - VEO3 Automator

## Versão 3.0 - 02/11/2024

### 🎉 Novidades

**Sistema de Mensagens do Administrador**
- Admins podem enviar mensagens personalizadas para usuários específicos
- Mensagens aparecem na tela de ativação da licença
- Útil para avisos de renovação, manutenção, atualizações, etc.

**Melhorias na Integração Firebase**
- Suporte completo para campo `message` nas licenças
- Suporte para campo `messageUpdatedAt` (timestamp da mensagem)
- Melhor sincronização de dados entre gerador e extensão

### 🔧 Correções

**Firebase API**
- Adicionado retorno dos campos `message` e `messageUpdatedAt`
- Melhoria na validação de licenças

**Sistema de Licenciamento**
- Mensagens do admin incluídas em `userData` após ativação
- Exibição de mensagens na tela de ativação

**Interface**
- Novo componente visual para mensagens do admin
- Animação suave ao exibir mensagens
- Estilo moderno com glassmorphism

### 📋 Arquivos Modificados

- `manifest.json` - Versão atualizada para 3.0
- `src/license/firebase-api.js` - Suporte a mensagens
- `src/license/license-system.js` - Integração com mensagens
- `src/license/license-activation.html` - UI para mensagens
- `src/license/license-activation-script.js` - Lógica de exibição

---

## Versão 2.0 - Anterior

### Funcionalidades Principais

**Automação VEO3**
- Automação de envio de prompts em lote
- Suporte completo a Frame-to-Video
- Carregamento automático de imagens
- Organizador de prompts

**Sistema de Licenciamento**
- Ativação por chave de licença
- Proteção por device fingerprint (1 PC por licença)
- Validação online e offline (até 7 dias)
- Sistema de trials (3 dias e 7 dias)
- Planos: Mensal, Trimestral, Anual, Vitalício

**Segurança**
- Device fingerprinting para impedir uso em múltiplos PCs
- Validação periódica com Firebase
- Proteção contra clonagem de licenças
- Sistema de revogação de licenças

**Interface**
- Sidebar lateral para controle da automação
- Painel de ativação de licença
- Indicadores de progresso
- Troubleshooting integrado

---

## Compatibilidade

- **Chrome:** Versão 88+
- **Manifest:** V3
- **Firebase:** Firestore REST API
- **Labs Google:** https://labs.google.com

---

## Notas de Atualização

### Como Atualizar da v2.0 para v3.0

1. Baixe a nova versão da extensão
2. Desinstale a versão antiga
3. Instale a nova versão
4. Faça login novamente com suas credenciais
5. Sua licença será mantida automaticamente

**Nenhuma reativação é necessária** - suas credenciais continuam as mesmas.

---

Desenvolvido por **Nardoto**
