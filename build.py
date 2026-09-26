"""Builds index.html, the stand-alone Onkostenboekje, from src/app.html.

src/app.html is the page as it is published on claude.ai (without its own <html>/<head>).
The stand-alone version adds a document head, the local storage shim (src/lokaal.js),
the web app manifest and the service worker, so it runs from a file or any website.

    python build.py
"""
import struct
import zlib
from pathlib import Path

HIER = Path(__file__).parent

# App icon: the 12x12 coin from the app's own pixel icons, on the LCD green.
MUNT = ['...######...', '..#......#..', '.#..####..#.', '#..#.......#', '#.#####....#', '#..#.......#',
        '#.#####....#', '#..#.......#', '.#..####..#.', '..#......#..', '...######...', '............']
LCD, INKT = (0xC4, 0xCE, 0xB3), (0x1B, 0x22, 0x16)


def icoon(grootte):
    cel = grootte * 3 // 4 // 12
    rand = (grootte - cel * 12) // 2
    rijen = []
    for y in range(grootte):
        rij = bytearray([0])
        for x in range(grootte):
            gx, gy = (x - rand) // cel, (y - rand - cel // 2) // cel
            aan = x >= rand and y >= rand + cel // 2 and gx < 12 and gy < 12 and MUNT[gy][gx] == '#'
            rij += bytes(INKT if aan else LCD)
        rijen.append(bytes(rij))
    blok = lambda soort, data: struct.pack('>I', len(data)) + soort + data + struct.pack('>I', zlib.crc32(soort + data))
    ihdr = struct.pack('>IIBBBBB', grootte, grootte, 8, 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + blok(b'IHDR', ihdr) + blok(b'IDAT', zlib.compress(b''.join(rijen), 9)) + blok(b'IEND', b'')


for g in (192, 512):
    (HIER / f'icon-{g}.png').write_bytes(icoon(g))
app = (HIER / 'src' / 'app.html').read_text(encoding='utf-8')
shim = (HIER / 'src' / 'lokaal.js').read_text(encoding='utf-8')

split = app.index('<div class="stage">')
kop, lijf = app[:split], app[split:]

pagina = f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1B2216">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Onkosten">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}</style>
<script>
{shim.strip()}
</script>
{kop.strip()}
</head>
<body>
{lijf.strip()}
</body>
</html>
"""
(HIER / 'index.html').write_text(pagina, encoding='utf-8')
print(f'index.html geschreven ({len(pagina.encode()):,} bytes)')
