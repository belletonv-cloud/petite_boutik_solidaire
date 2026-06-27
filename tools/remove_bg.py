"""
Usage :
    pip install rembg
    python tools/remove_bg.py images/ output/

Toutes les images dans images/ sont traitées et sauvegardées dans output/.
"""

import sys, os
from rembg import remove
from PIL import Image

src = sys.argv[1]
dst = sys.argv[2]
os.makedirs(dst, exist_ok=True)

for fname in os.listdir(src):
    if not fname.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        continue
    inp = Image.open(os.path.join(src, fname))
    out = remove(inp)
    name, ext = os.path.splitext(fname)
    out.save(os.path.join(dst, f'{name}_nobg.png'), 'PNG')
    print(f'  ✓ {fname} → {name}_nobg.png')
