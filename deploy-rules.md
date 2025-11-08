# Deploy das Regras do Firebase

## ⚠️ IMPORTANTE: Execute estes passos para aplicar as novas regras

### Opção 1: Via Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto **veo3automator**
3. No menu lateral, vá para **Firestore Database**
4. Clique na aba **Rules** (Regras)
5. **DELETE** todo o conteúdo atual
6. **COPIE E COLE** o conteúdo do arquivo `firestore.rules`
7. Clique em **Publish** (Publicar)

### Opção 2: Via Firebase CLI

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto (apenas primeira vez)
firebase init firestore

# Deploy das regras
firebase deploy --only firestore:rules
```

## 📋 O que as novas regras permitem:

- ✅ **Case 5**: Marcar licenças como `deleted` (status = "deleted" + deletedAt)
- ✅ **Case 6**: Toggle de status entre `active` e `disabled`
- ✅ Mantém todas as regras anteriores funcionando

## 🔍 Como verificar se funcionou:

1. Tente deletar uma licença no gerador
2. Não deve mais aparecer erro 403
3. A licença deve ser marcada como "deleted" no Firebase

## 📝 Regras adicionadas:

```javascript
// Case 5: Marcar como deletada (v3.1.0)
(
  request.resource.data.status == "deleted" &&
  request.resource.data.deletedAt != null
) ||
// Case 6: Toggle status (ativar/desativar)
(
  (resource.data.status == "active" && request.resource.data.status == "disabled") ||
  (resource.data.status == "disabled" && request.resource.data.status == "active")
)
```