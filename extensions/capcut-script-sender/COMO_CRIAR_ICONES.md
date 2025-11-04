# Como criar os ícones PNG para a extensão

## Solução Rápida - Use o arquivo gerar_icones.html

1. **Abra o arquivo `gerar_icones.html`** no seu navegador
2. **Clique nos botões** para baixar os 3 ícones PNG:
   - icon16.png (16x16 pixels)
   - icon48.png (48x48 pixels) 
   - icon128.png (128x128 pixels)
3. **Salve os arquivos** na pasta da extensão
4. **Atualize o manifest.json** para incluir os ícones

## Alternativa - Ícones simples online

Se preferir, você pode:
1. Ir em https://favicon.io/favicon-generator/
2. Criar um ícone simples com a letra "P" em fundo verde
3. Baixar nos tamanhos 16x16, 48x48 e 128x128
4. Renomear para icon16.png, icon48.png e icon128.png

## Depois de ter os ícones PNG:

Adicione esta seção de volta ao manifest.json:

```json
"icons": {
  "16": "icon16.png",
  "48": "icon48.png", 
  "128": "icon128.png"
}
```

## Solução Temporária (sem ícones):

A extensão já funciona sem ícones! O manifest.json foi ajustado para não precisar dos ícones por enquanto.
