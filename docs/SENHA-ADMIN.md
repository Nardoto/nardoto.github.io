# 🔐 SENHA DO GERADOR DE LICENÇAS

## ⚠️ IMPORTANTE - LEIA AGORA!

### Acesso ao Gerador PRO
**URL:** https://nardoto.com.br/geradores/gerador-pro.html

### Senha Atual (MUDE IMEDIATAMENTE!)
```
veo3admin2024
```

## 🔄 Como Mudar a Senha

1. Abra o arquivo: `geradores/gerador-pro.html`
2. Procure pela linha 1017 (ou busque por "ADMIN_PASSWORD")
3. Encontre este código:
```javascript
const ADMIN_PASSWORD = 'veo3admin2024'; // MUDE ESTA SENHA!
```
4. Troque para sua senha segura:
```javascript
const ADMIN_PASSWORD = 'SuaSenhaSuperSegura123!';
```
5. Salve o arquivo
6. Faça commit e push:
```bash
git add geradores/gerador-pro.html
git commit -m "Atualiza senha do admin"
git push
```

## 🛡️ Dicas de Segurança

### Senha Forte
Use uma senha com:
- Mínimo 12 caracteres
- Letras maiúsculas e minúsculas
- Números
- Caracteres especiais (!@#$%^&*)

### Exemplos de Senhas Fortes:
```
Veo3@Nardoto#2024!Pro
Ger@dor#Lic3nc@s$2024
N@rdoto!Pro#VEO3$2024
```

## ⚠️ AVISOS IMPORTANTES

1. **NÃO compartilhe** esta senha com ninguém
2. **NÃO use** senhas óbvias como "admin", "123456", "password"
3. **MUDE** a senha AGORA MESMO antes de usar em produção
4. **CONSIDERE** implementar autenticação server-side para maior segurança

## 🔒 Como o Sistema Funciona

- **Login:** Senha verificada no próprio JavaScript (client-side)
- **Sessão:** Mantida via sessionStorage (expira ao fechar navegador)
- **Logout:** Botão no canto superior direito (🚪 Sair)

## 📝 Limitações Atuais

⚠️ **ATENÇÃO:** A senha está no código JavaScript, visível para quem inspecionar o código-fonte!

### Para Produção Real, Considere:
1. **Autenticação server-side** com Node.js/PHP/Python
2. **Sistema de tokens JWT** para sessões seguras
3. **Hash de senhas** com bcrypt ou similar
4. **2FA** (autenticação de dois fatores)

## 🆘 Esqueceu a Senha?

Se você esqueceu a senha que configurou:
1. Acesse o código no GitHub
2. Edite o arquivo `geradores/gerador-pro.html`
3. Procure por `ADMIN_PASSWORD`
4. Configure uma nova senha

---

**LEMBRE-SE:** Esta é uma solução temporária para proteção básica. Para um sistema de produção com dados sensíveis, implemente autenticação server-side adequada!

---

*Arquivo criado em: 01/11/2024*