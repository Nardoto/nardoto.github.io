# Organização Completa - Nardoto Web (Firebase + GitHub Pages)

**Última atualização:** 27/03/2026
**Autor:** Sessão Claude Code

---

## 1. VISÃO GERAL - DOIS REPOSITÓRIOS

```
nardoto.com.br (GitHub Pages)          nardoto-labs.web.app (Firebase Hosting)
├── Site vitrine (sem preços)          ├── Dashboard do cliente
├── Página de vendas /studio/          ├── Login
├── FAQ, termos, extensões             ├── Checkout Stripe
└── Links levam pro Firebase →         ├── Cloud Functions (pagamentos)
                                       └── Sistema de afiliados
```

### Repo 1: Site Principal
- **Repo:** https://github.com/Nardoto/nardoto.github.io
- **URL:** https://nardoto.com.br
- **Hospedagem:** GitHub Pages
- **Conta Git:** Nardoto (não nardotoengenharia)
- **Pasta local:** `C:\Users\tamym\AppData\Local\Temp\nardoto-site`
- **Branch:** main

### Repo 2: Firebase (Dashboard + Cloud Functions)
- **Repo:** https://github.com/Nardoto/nardoto-firebase.git
- **URL:** https://nardoto-labs.web.app
- **Hospedagem:** Firebase Hosting (projeto: `tradutor-profissional-ai`)
- **Target:** nardoto-labs
- **Pasta local:** `C:\Users\tamym\AppData\Local\Temp\nardoto-firebase`
- **Branch:** master
- **Deploy:** `npx firebase deploy --only hosting` (hosting) ou `npx firebase deploy --only functions` (functions)

---

## 2. CONTAS GIT NO WINDOWS

Duas contas configuradas via `gh auth`:

| Conta | Uso | Status padrão |
|-------|-----|---------------|
| **nardotoengenharia** | NardotoStudio, nardoto-flow | Ativa (padrão) |
| **Nardoto** | nardoto.github.io, nardoto-firebase | Inativa |

### Como fazer push com a conta Nardoto:
```bash
gh auth switch --user Nardoto
GH_TOKEN=$(gh auth token) git -c "http.https://github.com/.extraheader=Authorization: basic $(echo -n "x-access-token:$(gh auth token)" | base64 -w0)" push origin main
gh auth switch --user nardotoengenharia
```
**IMPORTANTE:** O Git Credential Manager usa `nardotoengenharia` por padrão. Precisa usar o truque do token via header pra push no repo Nardoto.

---

## 3. ESTRUTURA DO SITE (nardoto.com.br)

### Páginas ativas
| Arquivo | URL | Descrição |
|---------|-----|-----------|
| `index.html` | nardoto.com.br | Home - vitrine, SEM preços |
| `studio/index.html` | nardoto.com.br/studio/ | **PÁGINA DE VENDAS** - todos os planos e preços |
| `extensoes.html` | nardoto.com.br/extensoes.html | Lista de extensões (sem preços) |
| `faq.html` | nardoto.com.br/faq.html | Perguntas frequentes |
| `flow.html` | nardoto.com.br/flow.html | Página do Nardoto Flow |
| `ferramentas.html` | nardoto.com.br/ferramentas.html | Ferramentas do Studio |
| `termos.html` | nardoto.com.br/termos.html | Termos de uso |
| `privacidade.html` | nardoto.com.br/privacidade.html | Política de privacidade |
| `precos.html` | nardoto.com.br/precos.html | **REDIRECT** para /studio/ |

### Páginas legado (podem ser removidas no futuro)
`ativar-licenca.html`, `cadastro.html`, `instalado.html`, `lore.html`, `newtab.html`, `painel-leads.html`, `producoes.html`

### Studio - Internacionalização
A página `studio/index.html` tem sistema i18n completo PT/EN com ~200 chaves. Botões PT/EN no canto superior direito.

### Studio - Script de afiliado
No final do `studio/index.html` há um script que detecta `?ref=XXX` na URL e injeta em todos os links de `nardoto-labs.web.app`:
```js
(function() {
  var params = new URLSearchParams(window.location.search);
  var ref = params.get('ref');
  if (!ref) return;
  document.querySelectorAll('a[href*="nardoto-labs.web.app"]').forEach(function(a) {
    var url = new URL(a.href);
    url.searchParams.set('ref', ref);
    a.href = url.toString();
  });
})();
```

---

## 4. PLANOS E PREÇOS (Atualizados 27/03/2026)

**TODOS os preços ficam SOMENTE em `nardoto.com.br/studio/`**. O site principal NÃO tem preços.

| Plano | Preço | Descrição |
|-------|-------|-----------|
| **Nardoto Labs** | R$ 97/mês | Uma extensão única com todas as ferramentas. VEO3 incluso. Extensões avulsas gratuitas serão descontinuadas. |
| **Lite + Flow** | R$ 197/mês | Plugin CapCut + Nardoto Flow + todas extensões Chrome |
| **Individual** | R$ 500/mês | Tudo anterior + 1 call técnica de 1h/mês + 1 automação personalizada por pessoa |
| **Família** | R$ 920/mês | Tudo do Individual para 4 usuários (sem acompanhamento individual) |
| **Família Ultra** | R$ 1.290/mês | Tudo do Individual para 6 usuários (sem acompanhamento individual) |

### Detalhes do plano Individual
- **Call mensal:** 1 hora por mês enquanto mantiver assinatura. Foco TÉCNICO (uso de IA e automação). NÃO é consultoria de estratégia de YouTube/conteúdo.
- **Automação personalizada:** 1 por pessoa (não por mês). Criada sob demanda quando o assinante identificar necessidade.

### Nardoto Labs - Extensão única
- A Nardoto Labs é UMA extensão Chrome que contém todas as outras dentro
- As extensões avulsas gratuitas serão descontinuadas e não receberão atualizações
- Somente a Labs recebe atualizações
- Chrome Web Store: `nnpnkladbgkepbaljcjlljckhppmocbl`

---

## 5. ESTRUTURA DO FIREBASE (nardoto-labs.web.app)

### Hosting (public/)
| Arquivo | URL | Descrição |
|---------|-----|-----------|
| `dashboard.html` | nardoto-labs.web.app/ | Dashboard principal (login, compras, downloads) |
| `login.html` | nardoto-labs.web.app/login.html | Tela de login separada |
| `ref.html` | nardoto-labs.web.app/ref | Redirect de afiliado (salva ref no localStorage) |
| `install-mac.html` | nardoto-labs.web.app/install-mac.html | Página de instalação macOS Studio |
| `install-flow-mac.html` | nardoto-labs.web.app/install-flow-mac.html | Página de instalação macOS Flow |
| `preview-sidebar.html` | nardoto-labs.web.app/preview-sidebar.html | Preview da sidebar |
| `auth/extension-login.html` | Login para extensões |

### Firebase Config
```json
{
  "hosting": {
    "target": "nardoto-labs",
    "public": "public",
    "rewrites": [
      { "source": "/ref", "destination": "/ref.html" },
      { "source": "/", "destination": "/dashboard.html" }
    ]
  }
}
```

### Cloud Functions (functions/index.js)
| Função | URL | Descrição |
|--------|-----|-----------|
| `createStripeCheckout` | POST | Cria sessão de checkout Stripe (aceita `affiliateRef`) |
| `createVipCheckout` | POST | Checkout do plano VIP/Individual (aceita `affiliateRef`) |
| `createFamilyCheckout` | POST | Checkout dos planos Família (aceita `affiliateRef`) |
| `stripeWebhook` | POST | Webhook do Stripe (`checkout.session.completed`) |
| `checkPurchaseStatus` | GET | Verifica extensões compradas |
| `createAffiliateAccount` | POST | Cria conta Express no Stripe Connect |
| `getAffiliateStatus` | GET | Status da conta afiliada |
| `getAffiliateTransferData(ref)` | Interna | Retorna dados de split se ref presente |

### Stripe
- **Modo:** PRODUÇÃO (LIVE) desde 06/02/2026
- **Chaves:** Configuradas via `firebase functions:config`
- **Webhook:** `https://us-central1-tradutor-profissional-ai.cloudfunctions.net/stripeWebhook`
- **Cronograma de repasses:** Diário (configurado em 27/03/2026)
- **Prazo de liberação:** ~30 dias (definido pelo Stripe, não configurável manualmente)

---

## 6. SISTEMA DE AFILIADOS

### Afiliada ativa
| Campo | Valor |
|-------|-------|
| **Nome** | Daniele Solem |
| **Email** | mybusinessytb01@gmail.com |
| **Account ID** | acct_1T81Rc325lA4sPhq |
| **Comissão** | 25% (plataforma 75%) |
| **Status** | Ativa |

### Links da Daniele
| Link | Função |
|------|--------|
| `https://nardoto.com.br/studio/?ref=daniele` | Página de vendas com ref (pessoa vê planos, tira dúvidas) |
| `https://nardoto-labs.web.app/ref?ref=daniele` | Redirect direto pro dashboard |

### Fluxo completo
1. Pessoa clica no link com `?ref=daniele`
2. Site: script injeta ref nos botões de compra / Firebase: `ref.html` salva no localStorage
3. Vai pro dashboard com `?ref=daniele`
4. Dashboard salva `affiliateRef=daniele` no localStorage
5. Ao comprar, `affiliateRef` é enviado na requisição de checkout
6. Cloud Function aplica split: 75% Nardoto, 25% Daniele
7. Compras sem ref vão 100% pro Nardoto

### Para adicionar novo afiliado
1. Criar conta Express no Stripe (Dashboard ou API)
2. Completar onboarding
3. Atualizar `firebase functions:config` com novo account ID
4. O ref é livre — basta usar `?ref=nomedoafiliado` em qualquer link

---

## 7. DASHBOARD (dashboard.html) - COMO FUNCIONA

### Autenticação
- Firebase Auth (Google login)
- Primeiro login cria documento no Firestore com `plan: 'free'`
- Se veio de link de afiliado, registra `source: 'affiliate_daniele'`

### Afiliado no dashboard
```js
// Detecta ref na URL e salva
(function() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('affiliateRef', ref);
})();

// Retorna ref salvo
function getAffiliateRef() {
    return localStorage.getItem('affiliateRef') || null;
}
```
Todos os checkouts enviam `affiliateRef: getAffiliateRef()` no body.

### Botão de checkout Labs
```js
startLabsCheckout() // R$97/mês - Nardoto Labs
startLiteCheckout() // R$197/mês - Lite
startVipCheckout()  // R$500/mês - Individual
```

---

## 8. DOCUMENTAÇÃO EXISTENTE

| Arquivo | Local | Descrição |
|---------|-------|-----------|
| `DOCUMENTACAO-IMPLEMENTACAO.md` | nardoto-firebase/ | Sistema de vendas individuais + Stripe |
| `SETUP-AFILIADO-STRIPE-CONNECT.md` | nardoto-firebase/ | Setup completo do sistema de afiliados |
| `DOCUMENTACAO_EMAIL_SENDGRID.md` | nardoto-firebase/ | Integração SendGrid |
| `GUIA-VISUAL.html` | nardoto-firebase/ | Guia visual do dashboard |
| `ORGANIZACAO-COMPLETA.md` | nardoto-firebase/ | **ESTE DOCUMENTO** |

---

## 9. COMANDOS ÚTEIS

### Deploy Firebase (hosting)
```bash
cd C:\Users\tamym\AppData\Local\Temp\nardoto-firebase
npx firebase deploy --only hosting
```

### Deploy Firebase (functions)
```bash
cd C:\Users\tamym\AppData\Local\Temp\nardoto-firebase
npx firebase deploy --only functions
```

### Push pro site (GitHub Pages)
```bash
cd C:\Users\tamym\AppData\Local\Temp\nardoto-site
gh auth switch --user Nardoto
GH_TOKEN=$(gh auth token) git -c "http.https://github.com/.extraheader=Authorization: basic $(echo -n "x-access-token:$(gh auth token)" | base64 -w0)" push origin main
gh auth switch --user nardotoengenharia
```

### Ver config do Stripe
```bash
cd C:\Users\tamym\AppData\Local\Temp\nardoto-firebase
npx firebase functions:config:get
```

---

*Documento gerado em 27/03/2026. Manter atualizado a cada mudança significativa.*
