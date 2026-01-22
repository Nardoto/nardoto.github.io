# Documentacao do Sistema Nardoto Labs

## Ultima Atualizacao: 30/12/2024

---

# PARTE 1: SISTEMA DE EMAILS AUTOMATICOS (SendGrid)

## 1. VISAO GERAL

O sistema de emails automaticos foi implementado usando **SendGrid** integrado com **Firebase Cloud Functions**. Os emails sao enviados automaticamente em eventos especificos como compras, assinaturas VIP e lembretes de trial.

---

## 2. INFORMACOES IMPORTANTES (GUARDAR!)

### 2.1 Projeto Firebase
- **Nome do projeto:** tradutor-profissional-ai
- **Console:** https://console.firebase.google.com/project/tradutor-profissional-ai

### 2.2 SendGrid
- **Dashboard:** https://app.sendgrid.com
- **Dominio autenticado:** nardoto.com.br
- **Email remetente:** contato@nardoto.com.br
- **Nome do remetente:** Nardoto Labs
- **Plano:** Free (100 emails/dia)

### 2.3 URLs das Funcoes

```
CHECKOUT EXTENSAO:
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/createStripeCheckout

CHECKOUT VIP:
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/createVipCheckout

WEBHOOK STRIPE:
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/stripeWebhook

VERIFICAR STATUS COMPRA:
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/checkPurchaseStatus

TESTE DE EMAIL:
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/testEmail
```

---

## 3. COMO TESTAR EMAILS MANUALMENTE

Abra no navegador substituindo `SEU_EMAIL` pelo email destino:

| Tipo | URL |
|------|-----|
| Trial Expirando | `https://us-central1-tradutor-profissional-ai.cloudfunctions.net/testEmail?email=SEU_EMAIL` |
| Compra Confirmada | `https://us-central1-tradutor-profissional-ai.cloudfunctions.net/testEmail?email=SEU_EMAIL&type=purchase` |
| Boas-vindas VIP | `https://us-central1-tradutor-profissional-ai.cloudfunctions.net/testEmail?email=SEU_EMAIL&type=vip` |
| Trial Expirado | `https://us-central1-tradutor-profissional-ai.cloudfunctions.net/testEmail?email=SEU_EMAIL&type=expired` |

---

## 4. EMAILS AUTOMATICOS (FUNCIONANDO)

| Tipo de Email | Quando e Enviado | Automatico? |
|---------------|------------------|-------------|
| Confirmacao de Compra | Apos compra via Stripe | SIM |
| Boas-vindas VIP | Apos assinar VIP via Stripe | SIM |
| Trial Expirando (2 dias) | Todo dia as 10h (Sao Paulo) | SIM |
| Trial Expirando (1 dia) | Todo dia as 10h (Sao Paulo) | SIM |
| Trial Expirado | Todo dia as 10h (Sao Paulo) | SIM |

---

## 5. COMANDOS FIREBASE (TERMINAL)

```bash
# Deploy das funcoes
cd C:/Users/tharc/Documents/nardoto-firebase
firebase deploy --only functions --project tradutor-profissional-ai

# Ver logs das funcoes
firebase functions:log --project tradutor-profissional-ai

# Ver configuracoes (API keys)
firebase functions:config:get --project tradutor-profissional-ai

# Atualizar API Key do SendGrid
firebase functions:config:set sendgrid.api_key="NOVA_API_KEY" --project tradutor-profissional-ai
```

---

## 6. DNS CONFIGURADOS NO REGISTRO.BR

Para o dominio `nardoto.com.br`:

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | em8729 | u58448794.wl045.sendgrid.net |
| CNAME | s1._domainkey | s1.domainkey.u58448794.wl045.sendgrid.net |
| CNAME | s2._domainkey | s2.domainkey.u58448794.wl045.sendgrid.net |
| TXT | _dmarc | v=DMARC1; p=none; |

---

# PARTE 2: SISTEMA DE AUTENTICACAO DAS EXTENSOES

## 7. HIERARQUIA DE ACESSO

As extensoes verificam acesso na seguinte ordem:

1. **plan === 'vip' ou 'basic'** → Acesso total
2. **isPro === true** → Acesso total (legado)
3. **features.includes('all-features')** → Acesso total
4. **features.includes(EXTENSION_ID)** → Acesso a extensao especifica
5. **purchasedExtensions.includes(EXTENSION_ID)** → Comprou extensao individual
6. **Trial ativo (10 dias)** → Acesso limitado (15 envios/dia)

---

## 8. PLANOS EXIBIDOS NA EXTENSAO

| Situacao | Plano Exibido |
|----------|---------------|
| Usuario VIP | VIP |
| Usuario Basic | BASIC |
| Comprou extensao individual | PRO |
| Trial ativo | FREE (com dias restantes) |
| Trial expirado | FREE (bloqueado) |

---

## 9. ARQUIVOS DE AUTENTICACAO (POR EXTENSAO)

Cada extensao tem estes arquivos:

```
src/auth/
  ├── firebase-config.js   # Configuracao Firebase + alias window.firebaseTTS
  └── auth-manager.js      # Logica de autenticacao + alias window.authXXX
```

### Aliases importantes:
- `window.firebaseTTS` = `window.firebaseXXX` (compatibilidade)
- `window.authXXX` = `window.ttsAuthManager` (compatibilidade)

---

## 10. CORRECOES FEITAS (30/12/2024)

### Whisk Automator v2.6.3

| Problema | Solucao |
|----------|---------|
| `window.authWhisk` undefined | Adicionado alias em auth-manager.js |
| `window.firebaseTTS` undefined | Adicionado alias em firebase-config.js |
| `initAuthSystem()` retornava boolean | Agora retorna `checkUserAccess()` |
| Mostrava "FREE" para quem comprou | Alterado para mostrar "PRO" |

---

# PARTE 3: PRECOS E PLANOS

## 11. TABELA DE PRECOS

| Quantidade | Preco por Extensao |
|------------|-------------------|
| 1a extensao | R$80 |
| 2a extensao | R$70 |
| 3a extensao | R$60 |
| 4a extensao | R$55 |
| 5a-8a extensao | R$50 cada |
| 9a extensao | R$35 |
| **VIP Mensal** | **R$500/mes** |

---

# PARTE 4: TROUBLESHOOTING

## 12. PROBLEMAS COMUNS

### Email nao chega
1. Verificar pasta de spam/lixo eletronico
2. Verificar aba "Promocoes" do Gmail
3. Ver logs: `firebase functions:log --project tradutor-profissional-ai`
4. Verificar se dominio esta verificado no SendGrid

### Extensao mostra "Usuario nao autenticado"
1. Verificar se `firebase-config.js` exporta `window.firebaseTTS`
2. Verificar se `auth-manager.js` exporta alias correto
3. Verificar console do navegador para erros

### Erro 403 no deploy Firebase
- Use sempre `--project tradutor-profissional-ai`

---

# PARTE 5: LINKS UTEIS

| Servico | URL |
|---------|-----|
| Firebase Console | https://console.firebase.google.com/project/tradutor-profissional-ai |
| SendGrid Dashboard | https://app.sendgrid.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| Registro.br (DNS) | https://registro.br |
| Nardoto Labs | https://nardoto-labs.web.app |
| GitHub - Site | https://github.com/nardoto/nardoto.github.io |
| GitHub - Extensoes | https://github.com/Nardoto/nardoto-labs-extension |

---

# PARTE 6: CHANGELOG

## 30/12/2024
- Implementado sistema de emails automaticos com SendGrid
- Configurado dominio nardoto.com.br no SendGrid
- Criados templates de email (compra, VIP, trial)
- Corrigido sistema de autenticacao do Whisk Automator v2.6.3
- Adicionados aliases de compatibilidade nas extensoes

---

*Documentacao gerada automaticamente pelo Claude Code*
