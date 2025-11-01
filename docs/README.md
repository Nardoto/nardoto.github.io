# Landing Page - Automação de Conteúdo

Página de vendas profissional para seus produtos de automação, hospedada gratuitamente no GitHub Pages.

## 🚀 Como Hospedar no GitHub Pages

### Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** (canto superior direito) → **"New repository"**
3. Configure o repositório:
   - **Nome:** `automacao-vendas` (ou qualquer nome)
   - **Descrição:** "Landing page de automação para YouTube"
   - **Público** (deixe público para funcionar com GitHub Pages gratuito)
   - ✅ Marque: "Add a README file"
4. Clique em **"Create repository"**

### Passo 2: Fazer Upload dos Arquivos

**Opção A: Via Interface Web (Mais Fácil)**

1. No repositório criado, clique em **"Add file"** → **"Upload files"**
2. Arraste os arquivos:
   - `index.html`
   - `styles.css`
   - `script.js`
3. Clique em **"Commit changes"**

**Opção B: Via Git (Linha de Comando)**

```bash
# 1. Inicializar Git na pasta
cd "c:\Users\tharc\Videos\AUTOMAÇÕES"
git init

# 2. Adicionar todos os arquivos
git add index.html styles.css script.js README.md

# 3. Fazer commit
git commit -m "Adiciona landing page de automação"

# 4. Conectar com seu repositório GitHub
git remote add origin https://github.com/SEU-USUARIO/automacao-vendas.git

# 5. Enviar arquivos
git branch -M main
git push -u origin main
```

### Passo 3: Ativar GitHub Pages

1. No seu repositório, vá em **Settings** (Configurações)
2. No menu lateral esquerdo, clique em **Pages**
3. Em **"Source"**, selecione:
   - Branch: **main**
   - Folder: **/ (root)**
4. Clique em **"Save"**
5. Aguarde 1-2 minutos

✅ **Sua página estará no ar em:**
```
https://SEU-USUARIO.github.io/automacao-vendas/
```

## 🔧 Personalização

### 1. Adicionar Links da Kiwify

Edite o arquivo `script.js` e substitua os links:

```javascript
const LINKS = {
    // Pacotes de Implementação
    essencial: 'https://pay.kiwify.com.br/SEU-LINK-ESSENCIAL',
    acelerada: 'https://pay.kiwify.com.br/SEU-LINK-ACELERADA',
    vip: 'https://pay.kiwify.com.br/SEU-LINK-VIP',

    // Planos de Assinatura
    basico: 'https://pay.kiwify.com.br/SEU-LINK-BASICO',
    pro: 'https://pay.kiwify.com.br/SEU-LINK-PRO',
    vipClube: 'https://pay.kiwify.com.br/SEU-LINK-VIP-CLUBE'
};
```

### 2. Mudar Cores (Opcional)

Edite o arquivo `styles.css` no topo:

```css
:root {
    --primary: #2563eb;        /* Cor principal (azul) */
    --secondary: #8b5cf6;      /* Cor secundária (roxo) */
    --accent: #f59e0b;         /* Cor de destaque (laranja) */
}
```

### 3. Adicionar Imagens dos Produtos

1. Crie uma pasta `images/` no repositório
2. Adicione suas imagens (produtos-essencial.png, etc.)
3. No `index.html`, adicione antes do `<h3>`:

```html
<img src="images/produto-essencial.png" alt="Automação Essencial">
```

### 4. Adicionar WhatsApp

No `index.html`, encontre o footer e adicione:

```html
<p>
    <a href="https://wa.me/5511999999999?text=Olá,%20tenho%20interesse%20nos%20pacotes"
       style="color: #10b981; text-decoration: none; font-weight: 700;">
        📱 (11) 99999-9999
    </a>
</p>
```

### 5. Google Analytics (Opcional)

Adicione antes do `</head>` no `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 6. Facebook Pixel (Opcional)

Adicione antes do `</head>` no `index.html`:

```html
<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'SEU-PIXEL-ID');
  fbq('track', 'PageView');
</script>
```

## 📱 Como Compartilhar

Depois de publicar, você terá um link do tipo:
```
https://seu-usuario.github.io/automacao-vendas/
```

### Encurtar o Link (Opcional)

Use serviços gratuitos:
- [bit.ly](https://bit.ly)
- [tinyurl.com](https://tinyurl.com)

Exemplo: `bit.ly/automacao-lucas`

## 🎨 Recursos Adicionais

### Adicionar Favicon

1. Crie ou baixe um ícone (16x16 ou 32x32 pixels)
2. Salve como `favicon.ico` na pasta do projeto
3. Adicione no `<head>` do `index.html`:

```html
<link rel="icon" type="image/x-icon" href="favicon.ico">
```

### Adicionar Meta Tags para Compartilhamento

Adicione no `<head>` para melhorar compartilhamentos:

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:title" content="Automação de Conteúdo para YouTube">
<meta property="og:description" content="Economize 20+ horas por semana com extensões Chrome + IA">
<meta property="og:image" content="https://seu-usuario.github.io/automacao-vendas/images/preview.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:title" content="Automação de Conteúdo para YouTube">
<meta property="twitter:description" content="Economize 20+ horas por semana">
```

## 🔄 Atualizar a Página

Sempre que fizer mudanças:

**Via Web:**
1. Vá no arquivo no GitHub
2. Clique no ícone de lápis (editar)
3. Faça as mudanças
4. Clique em "Commit changes"

**Via Git:**
```bash
git add .
git commit -m "Atualiza preços/conteúdo"
git push
```

As mudanças aparecem em 1-2 minutos.

## 📊 Monitoramento

### Ver Acessos do GitHub

1. Repositório → **Insights**
2. **Traffic** (mostra visitas dos últimos 14 dias)

### Google Analytics (Recomendado)

Veja estatísticas completas:
- Número de visitantes
- Tempo na página
- Cliques nos botões
- Origem do tráfego

## ⚠️ Importante

- ✅ Substitua TODOS os links da Kiwify no `script.js`
- ✅ Teste todos os botões antes de compartilhar
- ✅ Verifique se está responsivo (abra no celular)
- ✅ Adicione seu contato de WhatsApp

## 🆘 Problemas Comuns

**Página não carrega:**
- Verifique se o repositório está público
- Confirme que o GitHub Pages está ativo
- Aguarde 2-5 minutos após publicar

**Links não funcionam:**
- Verifique os links no `script.js`
- Abra o Console do navegador (F12) para ver erros

**Página sem estilo:**
- Confirme que `styles.css` está na mesma pasta
- Limpe o cache do navegador (Ctrl + F5)

## 📞 Contato

Se tiver dúvidas sobre a página, pode me chamar!

---

**Boa sorte com as vendas!** 🚀
