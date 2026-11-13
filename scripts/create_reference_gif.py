"""Monta um GIF com as imagens de referência, sem recortar os originais.

Rodar na raiz do projeto: python scripts/create_reference_gif.py
Requer Pillow (pip install Pillow).
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'referencias' / 'imagens'
OUTPUT = ROOT / 'assets' / 'media' / 'referencias.gif'
SIZE = (800, 560)
SLIDES = [
    ('fumaca-transformacao.jpg', 'Gear 4 em Dressrosa', 'Cena do anime: transformação do Luffy.'),
    ('skydome-birdcage.png', 'A gaiola em volta da ilha', 'Cena do anime: referência para o cenário e a gaiola.'),
    ('pose1-neutro.jpg', 'Pose 1 · Neutra', 'Figure de referência para os braços e a postura.'),
    ('pose2-ataque-basico.jpg', 'Pose 2 · Ataque básico', 'Figure de referência para o gesto e a posição das mãos.'),
    ('pose3-king-kong-gun.jpg', 'Pose 3 · King Kong Gun', 'Figure de referência para o punho gigante.'),
]


def font(size):
    for path in ['C:/Windows/Fonts/segoeui.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def make_frame(filename, title, caption, index):
    frame = Image.new('RGB', SIZE, '#15212b')
    draw = ImageDraw.Draw(frame)
    draw.text((24, 15), 'PARAÍSO DO LUFFY · REFERÊNCIAS', font=font(15), fill='#eed299')
    draw.text((24, 40), title, font=font(25), fill='#ffffff')
    with Image.open(SOURCE / filename) as image:
        image = ImageOps.contain(ImageOps.exif_transpose(image).convert('RGB'), (752, 400), Image.Resampling.LANCZOS)
        frame.paste(image, ((SIZE[0] - image.width) // 2, 92 + (400 - image.height) // 2))
    draw.text((24, 512), caption, font=font(15), fill='#e0e6eb')
    draw.text((730, 512), f'{index}/{len(SLIDES)}', font=font(15), fill='#eed299')
    return frame.quantize(colors=192, method=Image.Quantize.MEDIANCUT)


def main():
    frames = [make_frame(*slide, index) for index, slide in enumerate(SLIDES, 1)]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(OUTPUT, save_all=True, append_images=frames[1:], duration=2200, loop=0, disposal=2, optimize=True)
    with Image.open(OUTPUT) as gif:
        assert gif.n_frames == len(SLIDES)
        print(f'{OUTPUT.relative_to(ROOT)}: {gif.n_frames} quadros, {gif.size}, {OUTPUT.stat().st_size / 1024:.0f} KiB')


if __name__ == '__main__':
    main()
