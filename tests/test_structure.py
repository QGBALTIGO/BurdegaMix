"""Small, dependency-free structure and build regression tests."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import tempfile
import unittest
from urllib.parse import urlparse
from tools.sync_site import ROOT, STYLE_SOURCES, render, render_css, check
from gerar_html_unico import build

class Elements(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.nodes=[]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag,dict(attrs)))

class StructureTests(unittest.TestCase):
    def setUp(self):
        self.page = render(); self.elements=Elements(self.page).nodes

    def test_styles_bundle_is_reproducible_and_versioned(self):
        css=render_css()
        self.assertEqual(css,(ROOT/'styles.css').read_text())
        self.assertIn(hashlib.sha256(css.encode()).hexdigest()[:12],self.page)
        self.assertNotIn('@import', css)
        self.assertEqual([a['href'].split('?')[0] for t,a in self.elements if t=='link' and a.get('rel')=='stylesheet'],['styles.css'])

    def test_style_module_order_is_explicit(self):
        css=render_css()
        positions=[css.index(f'/* Source: styles/{name} */') for name in STYLE_SOURCES]
        self.assertEqual(positions,sorted(positions))
        self.assertEqual(len(STYLE_SOURCES),len(set(STYLE_SOURCES)))

    def test_no_ad_hoc_styles_in_markup_or_javascript(self):
        self.assertFalse(any('style' in attrs for _,attrs in self.elements))
        # Only the generated critical recovery block is inlined deliberately.
        self.assertEqual([a.get('id') for t,a in self.elements if t=='style'],['recovery-styles'])
        for file in ('script.js','recovery.js'):
            js=(ROOT/file).read_text()
            self.assertNotRegex(js,r"createElement\(['\"]style['\"]\)")
            self.assertNotIn('.style.cssText',js)
            self.assertNotRegex(js,r'\.style\.(?:background|cursor|filter|display|willChange)\s*=')

    def test_images_are_local_and_files_have_correct_signatures(self):
        images=[a for t,a in self.elements if t=='img']
        self.assertEqual(len(images),2)
        for a in images:
            self.assertTrue(a['src'].startswith('assets/'))
            file=ROOT/a['src'];self.assertTrue(file.is_file())
            data=file.read_bytes()
            self.assertEqual(data[:4],b'RIFF');self.assertEqual(data[8:12],b'WEBP')
            self.assertIn('alt',a);self.assertGreater(int(a['width']),0);self.assertGreater(int(a['height']),0)
        hero=next(a for a in images if a['class']=='burger-art')
        self.assertEqual(hero['loading'],'eager');self.assertEqual(hero['fetchpriority'],'high')
        preload=next(a for t,a in self.elements if t=='link' and a.get('rel')=='preload')
        self.assertEqual(preload['href'],hero['src'])

    def test_local_references_and_anchor_targets_exist(self):
        ids={a['id'] for _,a in self.elements if 'id' in a}
        for t,a in self.elements:
            for key in ('src','href'):
                val=a.get(key,'')
                if val.startswith('#'):
                    self.assertIn(val[1:],ids)
                elif val and not urlparse(val).scheme:
                    self.assertTrue((ROOT/val.split('?')[0]).is_file(),val)

    def test_link_fallbacks_are_https_and_safely_opened(self):
        links=[a for t,a in self.elements if 'data-link' in a]
        self.assertEqual({a['data-link'] for a in links},{'menu','whatsapp','hoursWhatsapp','tiktok','instagram','maps'})
        for a in links:
            self.assertEqual(urlparse(a['href']).scheme,'https')
            self.assertIn('noopener',a['rel']);self.assertIn('noreferrer',a['rel'])

    def test_unique_ids_and_recovery_controls(self):
        ids=[a['id'] for _,a in self.elements if 'id' in a]
        self.assertEqual(len(ids),len(set(ids)))
        for attribute in ('data-copy-address','data-retry-map','data-retry-burger'):
            self.assertEqual(sum(attribute in a for _,a in self.elements),1)

    def test_source_style_change_detects_stale_bundle(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)
            for name in ('index.html','location.json','recovery.js','styles.css'):shutil.copy(ROOT/name,p/name)
            for name in ('styles','templates'):shutil.copytree(ROOT/name,p/name)
            with (p/'styles/icons.css').open('a') as f:f.write('\n/* mutation check */\n')
            self.assertFalse(check(p))
            (p/'styles.css').write_text(render_css(p));(p/'index.html').write_text(render(p))
            self.assertTrue(check(p))

    def test_standalone_export_inlines_current_styles_scripts_and_images(self):
        with tempfile.TemporaryDirectory() as td:
            file=Path(td)/'site.html';build(ROOT,file);text=file.read_text()
        self.assertNotRegex(text,r'<script\b[^>]*\bsrc=')
        self.assertNotRegex(text,r'<link\b[^>]*rel="stylesheet"')
        self.assertIn('data:image/webp;base64,',text)
        self.assertIn('id="site-recovery"',text)
        self.assertIn('/* Source: styles/ticker.css */',text)
        self.assertIn('query_place_id=',text)

if __name__=='__main__':unittest.main()
