from PIL import Image, ImageDraw, ImageFont

# Criar imagem 128x128
img = Image.new('RGB', (128, 128), color=(102, 126, 234))
draw = ImageDraw.Draw(img)

# Desenhar texto "MT" (Múltiplas Tabs)
try:
    font = ImageFont.truetype("arial.ttf", 60)
except:
    font = ImageFont.load_default()

draw.text((20, 30), "MT", fill=(255, 255, 255), font=font)

# Salvar
img.save('icon.png')
print("Ícone criado com sucesso!")
