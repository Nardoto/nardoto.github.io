"""
Script para gerar ícones da extensão automaticamente
Requer: pip install pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Erro: PIL nao esta instalado")
    print("Execute: pip install pillow")
    exit(1)

def create_icon(size, filename):
    """Cria um ícone com o tamanho especificado"""

    # Criar imagem com gradiente
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)

    # Criar gradiente (simulado com cores interpoladas)
    for y in range(size):
        # Interpolação entre #667eea e #764ba2
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    scale = size / 128

    # Desenhar abas
    # Aba 1 (atrás)
    draw.rectangle(
        [15*scale, 35*scale, 65*scale, 95*scale],
        fill=(255, 255, 255, 180)
    )
    draw.rectangle(
        [15*scale, 25*scale, 65*scale, 35*scale],
        fill=(255, 255, 255, 150)
    )

    # Aba 2 (meio)
    draw.rectangle(
        [40*scale, 30*scale, 90*scale, 95*scale],
        fill=(255, 255, 255, 215)
    )
    draw.rectangle(
        [40*scale, 20*scale, 90*scale, 30*scale],
        fill=(255, 255, 255, 190)
    )

    # Aba 3 (frente)
    draw.rectangle(
        [65*scale, 25*scale, 115*scale, 95*scale],
        fill=(255, 255, 255, 255)
    )
    draw.rectangle(
        [65*scale, 15*scale, 115*scale, 25*scale],
        fill=(255, 255, 255, 230)
    )

    # Adicionar símbolo "+"
    try:
        font = ImageFont.truetype("arial.ttf", int(40 * scale))
    except:
        try:
            font = ImageFont.truetype("Arial.ttf", int(40 * scale))
        except:
            font = ImageFont.load_default()

    draw.text(
        (100*scale, 75*scale),
        "+",
        fill=(102, 126, 234),
        font=font,
        anchor="mm"
    )

    # Salvar
    img.save(filename, 'PNG')
    print(f"Criado: {filename}")

# Gerar os 3 tamanhos
print("Gerando icones da extensao...\n")
create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
print("\nTodos os icones foram criados com sucesso!")
print("Localizacao: icons/")
