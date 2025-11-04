# 🔥 Guia de Configuração do Firebase - VEO3 Automator

## Passo 1: Criar Conta Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em "Get Started" ou "Começar"
3. Faça login com sua conta Google (pode ser a do nardoto.com.br)

## Passo 2: Criar Novo Projeto

1. Clique em "Add Project" (Adicionar Projeto)
2. Nome do projeto: **VEO3-Automator** (ou outro nome que preferir)
3. Clique em "Continue"
4. **Google Analytics**: Pode desativar (não precisa para licenças)
5. Clique em "Create Project"
6. Aguarde 30 segundos enquanto cria
7. Clique em "Continue"

## Passo 3: Configurar Firestore Database

1. No menu lateral esquerdo, clique em "Build" → "Firestore Database"
2. Clique em "Create Database"
3. Escolha **"Production mode"** (mais seguro)
4. Escolha localização: **southamerica-east1** (São Paulo, Brasil) - mais rápido!
5. Clique em "Enable"
6. Aguarde a criação do banco

## Passo 4: Configurar Regras de Segurança

1. No Firestore, clique na aba "Rules" (Regras)
2. **DELETE TUDO** que está lá
3. Cole o seguinte código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura e escrita na coleção de licenças
    match /licenses/{licenseKey} {
      // Qualquer um pode ler (para validação)
      allow read: if true;

      // Só pode criar se não existir ainda (primeira ativação)
      allow create: if !exists(/databases/$(database)/documents/licenses/$(licenseKey));

      // Só você (admin) pode atualizar ou deletar
      allow update, delete: if false;
    }
  }
}
```

4. Clique em "Publish" (Publicar)

## Passo 5: Obter Credenciais do Firebase

1. No menu lateral, clique no ícone de **engrenagem** ⚙️ ao lado de "Project Overview"
2. Clique em "Project Settings" (Configurações do projeto)
3. Role para baixo até "Your apps" (Seus aplicativos)
4. Clique no ícone **</>** (Web)
5. Nickname do app: **VEO3-Extension**
6. **NÃO** marque "Firebase Hosting"
7. Clique em "Register app"
8. Você verá um código JavaScript. **COPIE APENAS A PARTE DO firebaseConfig**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "veo3-automator.firebaseapp.com",
  projectId: "veo3-automator",
  storageBucket: "veo3-automator.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

9. **GUARDE ESSE CÓDIGO!** Vou precisar dele no próximo passo

## Passo 6: Me Envie as Credenciais

Cole aqui no chat o firebaseConfig que você copiou (é seguro, são credenciais públicas com regras de segurança configuradas).

---

## ✅ Pronto!

Depois que você me enviar o firebaseConfig, vou:
1. Criar o arquivo de configuração
2. Atualizar a extensão para usar Firebase
3. Testar a validação funcionando

**Importante:** As credenciais Firebase são públicas e ficam no código da extensão. A segurança vem das **regras** que configuramos no Passo 4!
