import copy
import json
import re
import tempfile
import unittest
import shutil
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from tools.sync_site import ROOT, normalize, render, check

class LocationTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT/'location.json').read_text())

    def test_generated_html_is_current(self):
        self.assertTrue(check(), 'Execute python tools/sync_site.py')

    def test_fixed_identifiers_and_copy_are_generated_from_same_source(self):
        d=normalize(self.data)
        self.assertEqual(parse_qs(urlparse(d['mapsUrl']).query)['query_place_id'], [self.data['google']['placeId']])
        self.assertIn('!4s'+self.data['google']['cid']+'!', d['embedUrl'])
        self.assertNotIn('maps?q=', d['embedUrl'])
        self.assertIn(self.data['address']['number'],d['address']['full'])

    def test_invalid_identifiers_are_rejected(self):
        for key,value in [('placeId',''),('placeId','fake/place'),('cid','not-an-id'),('cid',str(2**64))]:
            d=copy.deepcopy(self.data);d['google'][key]=value
            with self.subTest(key=key,value=value), self.assertRaises(ValueError):normalize(d)

    def test_changed_source_detects_stale_html(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            for name in ['index.html','location.json','recovery.js']:shutil.copy(ROOT/name,root/name)
            shutil.copytree(ROOT/'templates',root/'templates')
            shutil.copytree(ROOT/'styles',root/'styles')
            self.data['address']['number']='999'
            (root/'location.json').write_text(json.dumps(self.data))
            self.assertFalse(check(root))
            page=render(root)
            self.assertIn('999',page)
            self.assertNotIn('Alves, 105',page)
            (root/'index.html').write_text(page)
            self.assertTrue(check(root))

    def test_main_script_has_no_duplicate_address_or_map_loader(self):
        js=(ROOT/'script.js').read_text()
        self.assertNotIn("$$('[data-copy-address]')",js)
        self.assertNotIn('Rua Padre',js)
        self.assertNotIn('data-map-src',js)

    def test_recovery_is_inline_and_has_no_external_dependency(self):
        page=render()
        self.assertIn('<script id="site-recovery">',page)
        runtime=(ROOT/'recovery.js').read_text()
        self.assertNotIn('BURDEGA_CONFIG',runtime)
        self.assertIn('querySelector',runtime)
        self.assertIn('data-retry-map',page)
        self.assertIn('data-retry-burger',page)

if __name__=='__main__': unittest.main()
