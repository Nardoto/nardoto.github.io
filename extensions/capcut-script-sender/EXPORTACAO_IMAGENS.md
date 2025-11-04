# Exportação de Imagens com Nome dos Prompts

## Nova Funcionalidade

A extensão agora **extrai e exporta imagens** junto com os prompts, permitindo que você baixe as imagens com nomes baseados no texto do prompt!

## Como Funciona

### 1. Durante a Extração

Quando você clica em **"Extrair Todos"**, a extensão:

1. **Localiza a imagem** em cada cena (`<img crossorigin="anonymous" src="blob:...">`)
2. **Converte blob URL para base64** (para armazenamento temporário)
3. **Associa a imagem ao prompt** extraído
4. **Armazena tudo junto** no Chrome Storage

### 2. Visualização

No popup da extensão, você verá:
- **Preview das imagens** (80x80px) ao lado de cada prompt
- Se não houver imagem, mostra apenas o texto do prompt

### 3. Exportação

Você tem 3 opções de exportação:

#### 🖼️ Exportar Imagens
- Exporta **apenas as imagens**
- Nome do arquivo baseado no prompt
- Usa os mesmos prefixos configurados (Linha e Prompt)

#### 📄 Exportar TXT
- Exporta **apenas o arquivo TXT** com os prompts
- Funciona como antes

#### 📦 Exportar Tudo
- Exporta **TXT + todas as imagens** de uma vez
- Mais conveniente para backup completo

## Formato dos Nomes de Arquivo

### Sem Prefixo de Linha

```
001_[prompt_sanitizado].png
002_[prompt_sanitizado].png
003_[prompt_sanitizado].png
```

**Exemplo real**:
```
001_beautiful_sunset_over_the_ocean_with_dramatic_clouds.png
002_futuristic_city_with_flying_cars_cyberpunk_style.png
```

### Com Prefixo de Linha

Se você configurar "Prefixo da Linha" como **"Cena"**:

```
Cena_1_[prompt_sanitizado].png
Cena_2_[prompt_sanitizado].png
Cena_3_[prompt_sanitizado].png
```

**Exemplo real**:
```
Cena_1_beautiful_sunset_over_the_ocean.png
Cena_2_futuristic_city_with_flying_cars.png
```

### Com Prefixo de Prompt

Se você configurar "Prefixo do Prompt" como **"cena cinematica hyper realista"**:

```
001_cena_cinematica_hyper_realista_beautiful_sunset.png
002_cena_cinematica_hyper_realista_futuristic_city.png
```

### Com Ambos os Prefixos

Prefixo da Linha: **"Cena"**
Prefixo do Prompt: **"cena cinematica"**

```
Cena_1_cena_cinematica_beautiful_sunset.png
Cena_2_cena_cinematica_futuristic_city.png
```

## Sanitização de Nomes

A extensão remove automaticamente caracteres inválidos:

**Caracteres Removidos**:
- `< > : " / \ | ? *` (inválidos no Windows)
- Espaços → substituídos por `_`
- Caracteres especiais não-ASCII → removidos
- Limite: 100 caracteres

**Exemplos de Transformação**:

| Prompt Original | Nome do Arquivo |
|----------------|-----------------|
| `"Beautiful sunset"` | `Beautiful_sunset.png` |
| `A man walking in Paris/France` | `A_man_walking_in_ParisFrance.png` |
| `Scene #1: hero's journey` | `Scene_1_heros_journey.png` |

## Passo a Passo de Uso

### 1. Configurar Prefixos (Opcional)

Na interface do popup:
- **Nome do Arquivo TXT**: Nome do arquivo TXT (ex: `projeto_carros`)
- **Prefixo da Linha**: Prefixo para numeração (ex: `Cena`, `Shot`, `Frame`)
- **Prefixo do Prompt**: Texto a adicionar antes de cada prompt (ex: `hyper realistic`)

### 2. Extrair Prompts e Imagens

1. Abra o CapCut no navegador
2. Navegue até a página com suas gerações de IA
3. Clique no ícone da extensão
4. Clique em **"🔍 Extrair Todos"**
5. Aguarde a varredura completar
6. Veja os prompts **com preview das imagens**

### 3. Exportar

Escolha uma das opções:

- **🖼️ Exportar Imagens**: Baixa só as imagens
- **📄 Exportar TXT**: Baixa só o arquivo de texto
- **📦 Exportar Tudo**: Baixa TXT + imagens

## Armazenamento

### Onde as Imagens São Armazenadas?

- **Temporariamente**: No Chrome Storage (como base64)
- **Permanentemente**: Quando você exporta, as imagens são baixadas para sua pasta de Downloads

### Limites de Armazenamento

- Chrome Storage: ~5MB por extensão
- Cada imagem em base64: ~100-300KB (dependendo da resolução)
- **Capacidade estimada**: 15-50 imagens

> **Dica**: Exporte regularmente para não perder dados se o limite for atingido!

## Formato das Imagens

- **Formato**: PNG
- **Qualidade**: Original (sem compressão adicional)
- **Resolução**: Mantém a resolução original do CapCut

## Exemplos de Uso

### Caso 1: Produção de Vídeo

**Configuração**:
- Prefixo da Linha: `Shot`
- Prefixo do Prompt: `cinematic 4k`

**Resultado**:
```
Shot_1_cinematic_4k_hero_walks_into_sunset.png
Shot_2_cinematic_4k_aerial_view_of_city.png
Shot_3_cinematic_4k_close_up_of_face.png
```

### Caso 2: Biblioteca de Assets

**Configuração**:
- Prefixo da Linha: *(vazio)*
- Prefixo do Prompt: *(vazio)*

**Resultado**:
```
001_beautiful_landscape_with_mountains.png
002_portrait_of_young_woman_smiling.png
003_abstract_geometric_pattern.png
```

### Caso 3: Projeto Específico

**Configuração**:
- Prefixo da Linha: `Projeto_CarroFuturista`
- Prefixo do Prompt: `hyper realistic concept art`

**Resultado**:
```
Projeto_CarroFuturista_1_hyper_realistic_concept_art_sleek_sports_car.png
Projeto_CarroFuturista_2_hyper_realistic_concept_art_engine_details.png
```

## Troubleshooting

### Imagens não aparecem no preview

**Possíveis causas**:
1. Imagens ainda não foram carregadas na página
2. Estrutura HTML do CapCut mudou
3. Erro ao converter blob para base64

**Soluções**:
1. Aguarde a página carregar completamente
2. Recarregue a extensão
3. Verifique o console (F12) por erros

### Algumas imagens não são exportadas

**Possíveis causas**:
1. Nem todas as cenas têm imagens
2. Erro ao capturar a imagem específica

**Soluções**:
1. Verifique quais prompts têm preview de imagem
2. Tente extrair novamente

### Nome do arquivo muito curto

**Causa**: O prompt tem muitos caracteres especiais que foram removidos

**Solução**: A extensão usa um nome padrão `prompt.png` se o nome ficar vazio

### Limite de armazenamento atingido

**Sintomas**: Algumas imagens não são salvas

**Solução**:
1. Exporte as imagens atuais
2. Limpe os prompts
3. Continue extraindo novos prompts

## Melhorias Futuras

- [ ] Opção de escolher formato (PNG, JPG, WEBP)
- [ ] Compressão de imagens antes de armazenar
- [ ] Exportar como ZIP (TXT + imagens em um arquivo)
- [ ] Sincronização com cloud storage
- [ ] Edição de nomes antes de exportar

## Notas Técnicas

### Conversão Blob → Base64

```javascript
async function blobUrlToBase64(blobUrl) {
  const response = await fetch(blobUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### Estrutura de Dados

```javascript
{
  text: "beautiful sunset over ocean",
  image: "data:image/png;base64,iVBORw0KGgoAAAANS...",
  timestamp: "27/10/2025, 15:30:00",
  id: 1761537000123.456,
  sceneIndex: 1,
  hash: "a3f5b2c..."
}
```

## Changelog

**Versão 1.2** (Outubro 2025)
- ✅ Extração automática de imagens
- ✅ Conversão blob → base64
- ✅ Preview de imagens no popup
- ✅ Exportação com nome baseado no prompt
- ✅ Sanitização de nomes de arquivo
- ✅ Suporte para prefixos customizáveis
- ✅ Botão "Exportar Tudo"
