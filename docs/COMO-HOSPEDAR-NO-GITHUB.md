# 🌐 Como Hospedar o Gerador de Licenças no GitHub Pages

## Passo 1: Criar Conta no GitHub
1. Acesse: https://github.com
2. Clique em "Sign up"
3. Crie sua conta (use email nardoto ou pessoal)

## Passo 2: Criar Novo Repositório
1. Após fazer login, clique no "+" no canto superior direito
2. Selecione "New repository"
3. Preencha:
   - **Repository name**: `veo3-license-generator` (ou outro nome)
   - **Description**: "Gerador de Licenças VEO3 Automator"
   - Marque **Public** (ou Private se preferir privado - precisa pagar)
   - ✅ Marque "Add a README file"
4. Clique em "Create repository"

## Passo 3: Fazer Upload do Arquivo
1. No seu repositório, clique em "Add file" → "Upload files"
2. Arraste o arquivo **index.html** (da pasta AUTOMAÇÕES)
3. No campo "Commit changes", escreva: "Adiciona gerador de licenças"
4. Clique em "Commit changes"

## Passo 4: Ativar GitHub Pages
1. No repositório, clique em "Settings" (no menu superior)
2. No menu lateral esquerdo, clique em "Pages"
3. Em "Source", selecione:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Clique em "Save"
5. Aguarde 1-2 minutos

## Passo 5: Acessar Seu Site
Após alguns minutos, o GitHub mostrará um link tipo:
```
https://seunome.github.io/veo3-license-generator/
```

🎉 **Pronto!** Seu gerador estará online!

## 🔐 IMPORTANTE: Mudar a Senha

**ANTES de usar, mude a senha de acesso:**

1. No GitHub, clique no arquivo **index.html**
2. Clique no ícone de lápis (Edit)
3. Procure a linha 455:
   ```javascript
   const ADMIN_PASSWORD = 'nardoto2024';
   ```
4. Mude para uma senha forte:
   ```javascript
   const ADMIN_PASSWORD = 'MinhaS3nhaSup3rS3gur@2024!';
   ```
5. Role até o fim, clique em "Commit changes"

## 📱 Como Usar de Qualquer Lugar

Agora você pode:
- Acessar de qualquer computador
- Acessar do celular
- Compartilhar o link (mas só você tem a senha!)

**Seu workflow:**
1. Cliente compra
2. Você acessa: `https://seunome.github.io/veo3-license-generator/`
3. Digite sua senha
4. Gera licença
5. Copia credenciais
6. Envia no WhatsApp do cliente

---

## 🆘 Problemas Comuns

**Erro 404 - Página não encontrada:**
- Aguarde 2-3 minutos após ativar Pages
- Verifique se o arquivo se chama exatamente `index.html`

**Esqueci minha senha:**
- Entre no repositório
- Edite o arquivo `index.html`
- Mude a linha do `ADMIN_PASSWORD`

**Quero domínio personalizado (nardoto.com.br):**
- No "Settings" → "Pages"
- Em "Custom domain", digite: `licencas.nardoto.com.br`
- Configure DNS no seu provedor de domínio

---

## 🔒 Sobre Segurança

**Como funciona a proteção:**
- ✅ Senha protege acesso ao gerador
- ✅ Licenças ficam salvas no navegador (localStorage)
- ⚠️ Qualquer pessoa técnica pode ver a senha no código-fonte
- ⚠️ Não é 100% seguro para dados sensíveis

**Para melhorar (futuro):**
- Implementar Firebase (banco de dados online)
- Backend com validação real
- Autenticação robusta

**Por enquanto é suficiente porque:**
- 95% dos clientes não sabem programar
- É rápido e simples de usar
- Funciona offline
