#!/usr/bin/env python3
"""Sincroniza localização e recuperação no HTML. Use --check para detectar divergências.
Dados do estabelecimento são editados SOMENTE em location.json; o HTML gerado
continua completo para navegadores sem JS e para falhas de scripts externos.
"""
from __future__ import annotations
import argparse
import html
import json
import re
from pathlib import Path
from string import Template
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]

def normalize(data: dict) -> dict:
    def text(value, name):
        if not isinstance(value, str) or not value.strip() or any(ord(c) < 32 for c in value):
            raise ValueError(f'Campo de localização inválido: {name}')
        return value.strip()
    name = text(data.get('name'), 'name')
    a = data.get('address', {})
    a = {k: text(a.get(k), f'address.{k}') for k in ('street', 'number', 'neighborhood', 'city', 'state', 'stateName')}
    if not re.fullmatch(r'[A-Z]{2}', a['state']):
        raise ValueError('Estado deve usar a sigla de duas letras.')
    g = data.get('google', {})
    pid = text(g.get('placeId'), 'google.placeId')
    cid = text(g.get('cid'), 'google.cid')
    if not re.fullmatch(r'[A-Za-z0-9_-]{20,}', pid):
        raise ValueError('Place ID inválido; copie o identificador verificado do Google.')
    if not re.fullmatch(r'[1-9][0-9]{0,19}', cid) or int(cid) >= 2**64:
        raise ValueError('CID inválido; copie o identificador do mesmo cadastro.')
    short = f"{a['street']}, {a['number']} • {a['neighborhood']}"
    full = f"{a['street']}, {a['number']}, {a['neighborhood']}, {a['city']} - {a['state']}"
    # The official Maps URL uses the Place ID, not a name/address-only search.
    maps_url = 'https://www.google.com/maps/search/?' + urlencode({'api': 1, 'query': f'{name}, {full}', 'query_place_id': pid})
    # This CID-pinned embed URL was returned by Google for the verified listing.
    # Do NOT put `place_id:...` into the old free-text embed query: that resolved
    # incorrectly during verification. No API key or paid API is added here.
    embed_url = f'https://www.google.com/maps/embed?origin=mfe&pb=!1m4!3m2!1m1!4s{cid}!6i17!3m1!1spt-BR!5m1!1spt-BR'
    return {'name': name, 'placeId': pid, 'cid': cid,
            'address': {'short': short, 'full': full, 'cityLabel': f"{a['city']}, {a['stateName']}"},
            'mapsUrl': maps_url, 'embedUrl': embed_url,
            'mapTitle': f'Mapa da Burdega: {full}'}

def block(source: str, key: str, value: str) -> str:
    pattern = rf'<!-- {re.escape(key)}:start -->[\s\S]*?<!-- {re.escape(key)}:end -->'
    if len(re.findall(pattern, source)) != 1:
        raise ValueError(f'Bloco gerado ausente ou duplicado: {key}')
    return re.sub(pattern, lambda _: f'<!-- {key}:start -->\n{value.rstrip()}\n<!-- {key}:end -->', source)

def render(root: Path = ROOT) -> str:
    data = normalize(json.loads((root / 'location.json').read_text(encoding='utf-8')))
    page = (root / 'index.html').read_text(encoding='utf-8')
    card = Template((root / 'templates/location-card.html').read_text(encoding='utf-8'))
    values = {'shortAddress': data['address']['short'], 'fullAddress': data['address']['full'],
              'cityLabel': data['address']['cityLabel'], 'mapTitle': data['mapTitle'],
              'mapsUrl': data['mapsUrl'], 'embedUrl': data['embedUrl']}
    card = card.substitute({k: html.escape(v, quote=True) for k, v in values.items()})
    page = block(page, 'location:card', card)
    # Escape HTML-sensitive chars without corrupting quotes/accents in JSON.
    encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e')
    page = block(page, 'location:data', f'<script id="location-data" type="application/json">{encoded}</script>')
    css = (root / 'styles/recovery.css').read_text(encoding='utf-8').rstrip()
    js = (root / 'recovery.js').read_text(encoding='utf-8').rstrip()
    if '</style' in css.lower() or '</script' in js.lower():
        raise ValueError('Fonte contém delimitador HTML de fechamento não permitido.')
    page = block(page, 'recovery:style', f'<style id="recovery-styles">\n{css}\n</style>')
    page = block(page, 'recovery:script', f'<script id="site-recovery">\n{js}\n</script>')
    return page

def check(root: Path = ROOT) -> bool:
    return (root / 'index.html').read_text(encoding='utf-8') == render(root)

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        result = render()
        if args.check:
            if not check():
                parser.exit(1, 'HTML desatualizado. Execute: python tools/sync_site.py\n')
            print('Localização, URLs, alternativa sem JS e recuperação sincronizadas.')
        else:
            (ROOT / 'index.html').write_text(result, encoding='utf-8')
            print('index.html sincronizado com location.json e fontes de recuperação.')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.exit(1, f'Falha de validação: {exc}\n')

if __name__ == '__main__':
    main()
