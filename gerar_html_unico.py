#!/usr/bin/env python3
"""Reúne o projeto em um HTML independente. Requer somente Python 3."""
from __future__ import annotations

import argparse
import base64
import re
from pathlib import Path
from tools.sync_site import render, render_css


def build(root: Path, output: Path) -> None:
    required = ('index.html', 'styles.css', 'config.js', 'script.js')
    for name in required:
        if not (root / name).is_file():
            raise FileNotFoundError(f'Arquivo necessário não encontrado: {root / name}')
    html = render(root)
    css = render_css(root)
    config = (root / 'config.js').read_text(encoding='utf-8')
    js = (root / 'script.js').read_text(encoding='utf-8')
    html = re.sub(r'<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?">', lambda _: f'<style>\n{css}\n</style>', html)
    html = re.sub(r'<script src="config\.js(?:\?[^"]*)?" defer></script>', '', html)
    html = re.sub(r'<script src="script\.js(?:\?[^"]*)?" defer></script>', '', html)
    mime_types = {'.svg': 'image/svg+xml', '.webp': 'image/webp'}
    for asset in sorted((root / 'assets').iterdir()):
        mime = mime_types.get(asset.suffix.lower())
        if not mime or not asset.is_file():
            continue
        encoded = base64.b64encode(asset.read_bytes()).decode('ascii')
        html = html.replace(f'assets/{asset.name}', f'data:{mime};base64,{encoded}')
    # Protect the enclosing script element if editable text contains this token.
    config = config.replace('</script', '<\\/script')
    js = js.replace('</script', '<\\/script')
    html = html.replace('</body>', f'<script>\n{config}\n</script>\n<script>\n{js}\n</script>\n</body>')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding='utf-8')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--saida', type=Path, default=None, help='Caminho do HTML final (padrão: burdega.html).')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    output = args.saida or root / 'burdega.html'
    try:
        build(root, output)
    except (OSError, UnicodeError) as exc:
        parser.exit(1, f'Não foi possível gerar o HTML: {exc}\n')
    print(f'HTML gerado: {output.resolve()} ({output.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
