"""Browser regressions. All third-party traffic is intercepted, never ordered/sent.
Run: python -m unittest discover -s tests/browser -v
BURDEGA_BROWSER=webkit selects WebKit; CHROMIUM_EXECUTABLE is a local override.
"""
from __future__ import annotations

import functools
import json
import os
import re
from pathlib import Path
import tempfile
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
BROWSER = os.environ.get('BURDEGA_BROWSER', 'chromium')
COPY_MESSAGE = 'Endereço copiado. Vem pra Burdega!'
MAP_FIXTURE = '<!doctype html><html lang="pt-BR"><title>Mapa de teste</title><body>Conteúdo simulado somente para testes.</body></html>'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.pw = sync_playwright().start()
        options = {}
        if BROWSER == 'chromium' and os.environ.get('CHROMIUM_EXECUTABLE'):
            options['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
        cls.browser = getattr(cls.pw, BROWSER).launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 390, 'height': 844}, color_scheme='dark')
        self.external_requests = []
        self.map_requests = []
        self.context.route('**/*', self.route_request)
        # Exercise the asynchronous copy contract and exact payload without OS prompts.
        self.context.add_init_script("""Object.defineProperty(navigator, 'clipboard', {configurable:true,
          value:{writeText:async text=>{window.__copied=text;}}});""")
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))

    def route_request(self, route):
        url = route.request.url
        if url.startswith(self.base + '/'):
            return route.continue_()
        self.external_requests.append(url)
        if url.startswith('https://www.google.com/maps/embed?'):
            self.map_requests.append(url)
            return route.fulfill(status=200, content_type='text/html', body=MAP_FIXTURE)
        # Navigation destinations get a harmless stub; no real WhatsApp/social requests.
        route.fulfill(status=200, content_type='text/html', body='<title>Destino de teste</title>')

    def tearDown(self):
        outcome = getattr(self, '_outcome', None)
        result = getattr(outcome, 'result', None)
        failed = result and any(test is self for test, _ in result.failures + result.errors)
        if failed:
            output = Path(os.environ.get('TEST_ARTIFACTS', str(ROOT / 'test-results')))
            output.mkdir(parents=True, exist_ok=True)
            try:
                self.page.screenshot(path=str(output / f'{BROWSER}-{self._testMethodName}.png'), full_page=True)
                (output / f'{BROWSER}-{self._testMethodName}.txt').write_text('\n'.join(self.errors), encoding='utf-8')
            except Exception:
                pass
        self.context.close()

    def open(self):
        self.page.goto(self.base + '/index.html', wait_until='domcontentloaded')
        return self.page

    def image_ready(self):
        self.page.wait_for_function("document.querySelector('.burger-art').dataset.mediaState==='ready'")

    def scroll_map(self):
        self.page.locator('.location-card').scroll_into_view_if_needed()
        self.page.wait_for_function("document.querySelector('.location-card-frame').src.includes('/maps/embed?')")

    def test_responsive_layout_themes_local_images_and_no_errors(self):
        p = self.open()
        self.image_ready()
        for theme in ('dark', 'light'):
            p.emulate_media(color_scheme=theme)
            for width in (320, 390, 760, 768, 1100, 1440):
                with self.subTest(theme=theme, width=width):
                    p.set_viewport_size({'width': width, 'height': 844})
                    p.evaluate('window.scrollTo(0,0)')
                    self.assertTrue(p.evaluate('document.documentElement.scrollWidth <= innerWidth'))
                    for selector in ('.header', '.poster', '.links-panel', '.location-card'):
                        box = p.locator(selector).bounding_box()
                        self.assertGreater(box['width'], 0)
                        self.assertGreaterEqual(box['x'], -1)
                        self.assertLessEqual(box['x'] + box['width'], width + 1)
                    self.assertEqual(p.locator('img').count(), 2)
                    self.assertTrue(p.evaluate("[...document.images].every(i=>i.complete && i.naturalWidth>0)"))
                    self.assertEqual(p.locator('.burger-art').evaluate('i=>getComputedStyle(i).opacity'), '1')
                    self.assertTrue(p.locator('.burger-art').get_attribute('src').startswith('assets/'))
        self.assertEqual(self.errors, [])
        self.assertFalse(any('ibb.co' in url or 'linktr.ee' in url for url in self.external_requests))

    def test_configured_links_and_click_destinations(self):
        p = self.open()
        links = p.locator('[data-link]').evaluate_all("nodes=>nodes.map(n=>({key:n.dataset.link,url:n.href,rel:n.rel,target:n.target}))")
        configured = p.evaluate('window.BURDEGA_CONFIG.links')
        self.assertTrue(links)
        for link in links:
            with self.subTest(link=link):
                self.assertEqual(link['url'], configured[link['key']])
                self.assertEqual(urlparse(link['url']).scheme, 'https')
                self.assertEqual(link['target'], '_blank')
                self.assertIn('noopener', link['rel'])
                self.assertIn('noreferrer', link['rel'])
        for key in ('menu', 'whatsapp', 'tiktok', 'instagram', 'maps'):
            with self.subTest(clicked=key), p.expect_popup() as popup:
                p.locator(f'[data-link="{key}"]').first.click()
            destination = popup.value
            destination.wait_for_load_state('domcontentloaded')
            self.assertEqual(destination.url, configured[key])
            destination.close()

    def test_address_copy_payload_and_existing_confirmation(self):
        p = self.open()
        expected = p.locator('[data-copy-address]').get_attribute('data-copy-value')
        p.locator('[data-copy-address]').click()
        expect(p.locator('#toast')).to_have_text(COPY_MESSAGE)
        expect(p.locator('#toast')).to_be_visible()
        self.assertEqual(p.evaluate('window.__copied'), expected)
        self.assertEqual(expected, p.evaluate('window.BURDEGA_CONFIG.address.full'))
        self.assertEqual(p.locator('[data-copy-address]').count(), 1)

    def test_denied_clipboard_uses_selection_fallback(self):
        self.context.add_init_script("""Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied')}}});
          document.execCommand=command=>{window.__selection=document.activeElement.value; return command==='copy'};""")
        p = self.open()
        p.locator('[data-copy-address]').click()
        expect(p.locator('#toast')).to_have_text(COPY_MESSAGE)
        self.assertEqual(p.evaluate('window.__selection'), p.locator('[data-copy-address]').get_attribute('data-copy-value'))
        self.assertEqual(p.locator('.clipboard-helper').count(), 0)
        expect(p.locator('[data-copy-address]')).to_be_focused()

    def test_copy_failure_does_not_announce_success(self):
        self.context.add_init_script("""Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied')}}});document.execCommand=()=>false;""")
        p = self.open()
        p.locator('[data-copy-address]').click()
        expect(p.locator('#toast')).to_have_text('Não foi possível copiar. O endereço está logo ao lado.')

    def test_map_is_pinned_lazy_loaded_and_reloadable(self):
        p = self.open()
        expect(p.locator('.location-card-frame')).to_have_attribute('src', 'about:blank')
        self.assertEqual(self.map_requests, [])
        data = json.loads(p.locator('#location-data').text_content())
        self.scroll_map()
        expect(p.locator('.location-map')).to_have_attribute('data-map-state', 'settled')
        self.assertIn('!4s' + data['cid'] + '!', p.locator('.location-card-frame').get_attribute('src'))
        self.assertEqual(parse_qs(urlparse(p.locator('.location-card-open').get_attribute('href')).query)['query_place_id'], [data['placeId']])
        p.locator('[data-retry-map]').click()
        p.wait_for_function("document.querySelector('.location-map').dataset.mapState==='settled'")
        self.assertGreaterEqual(len(self.map_requests), 2)
        self.assertEqual(set(self.map_requests), {data['embedUrl']})

    def test_essential_recovery_survives_missing_external_scripts(self):
        self.page.route('**/script.js*', lambda route: route.abort())
        self.page.route('**/config.js*', lambda route: route.abort())
        p = self.open()
        self.image_ready()
        p.locator('[data-copy-address]').click()
        expect(p.locator('#toast')).to_have_text(COPY_MESSAGE)
        self.scroll_map()
        expect(p.locator('.location-map')).to_have_attribute('data-map-state', 'settled')
        self.assertEqual(self.errors, [])

    def test_no_javascript_keeps_links_images_and_native_map(self):
        context = self.browser.new_context(java_script_enabled=False)
        context.route('**/*', self.route_request)
        try:
            p = context.new_page()
            p.goto(self.base + '/index.html')
            expect(p.locator('.burger-art')).to_be_visible()
            self.assertTrue(p.locator('.burger-art').evaluate('i=>i.complete && i.naturalWidth>0'))
            expect(p.locator('.location-card-frame[data-map-src]')).to_be_hidden()
            expect(p.locator('noscript .location-card-frame')).to_be_visible()
            for key in ('menu', 'whatsapp', 'tiktok', 'instagram', 'maps'):
                self.assertTrue(p.locator(f'[data-link="{key}"]').first.get_attribute('href').startswith('https:'))
        finally:
            context.close()

    def test_burger_automatic_retry_recovers(self):
        requests = []
        def image_route(route):
            requests.append(route.request.url)
            if len(requests) == 1:
                route.fulfill(status=404, body='missing')
            else:
                route.continue_()
        self.page.route('**/assets/burger-640.webp*', image_route)
        self.open()
        self.image_ready()
        self.assertEqual(len(requests), 2)
        self.assertIn('retry=', requests[1])
        expect(self.page.locator('[data-burger-status]')).to_be_hidden()

    def test_corrupt_burger_stops_retrying_and_manual_retry_recovers(self):
        requests = []
        failing = [True]
        def image_route(route):
            requests.append(route.request.url)
            if failing[0]:
                route.fulfill(status=200, content_type='image/webp', body='not a webp')
            else:
                route.continue_()
        self.page.route('**/assets/burger-640.webp*', image_route)
        p = self.open()
        expect(p.locator('.burger-art')).to_have_attribute('data-media-state', 'error')
        self.assertEqual(len(requests), 2)
        expect(p.locator('.burger-art')).to_be_hidden()
        expect(p.locator('[data-retry-burger]')).to_be_visible()
        failing[0] = False
        p.locator('[data-retry-burger]').click()
        self.image_ready()
        expect(p.locator('[data-retry-burger]')).to_be_hidden()

    def test_ticker_scrolls_pauses_and_resumes_with_keyboard(self):
        p = self.open()
        ribbon = p.locator('.ticker')
        ribbon.scroll_into_view_if_needed()
        p.wait_for_function("document.querySelector('.ticker-track')?.getAnimations({subtree:true}).some(a=>a.playState==='running')")
        time = p.evaluate("document.querySelector('.ticker-track').getAnimations({subtree:true})[0].currentTime")
        p.wait_for_function("t=>document.querySelector('.ticker-track').getAnimations({subtree:true})[0].currentTime>t+80", arg=time)
        ribbon.focus()
        p.keyboard.press('Enter')
        expect(ribbon).to_have_attribute('aria-label', re.compile('^Retomar'))
        p.wait_for_function("document.querySelector('.ticker-track').getAnimations({subtree:true}).every(a=>a.playState==='paused'&&!a.pending)")
        frozen = p.evaluate("document.querySelector('.ticker-track').getAnimations({subtree:true})[0].currentTime")
        # Sample two rendered frames, not a fixed sleep.
        after = p.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(document.querySelector('.ticker-track').getAnimations({subtree:true})[0].currentTime))))")
        self.assertEqual(frozen, after)
        p.keyboard.press('Enter')
        p.wait_for_function("document.querySelector('.ticker-track').getAnimations({subtree:true}).every(a=>a.playState==='running')")
        groups = p.locator('.ticker-track > .ticker-content')
        self.assertGreaterEqual(groups.count(), 2)
        original = groups.first.text_content()
        for i in range(1, groups.count()):
            self.assertEqual(groups.nth(i).text_content(), original)
            expect(groups.nth(i)).to_have_attribute('aria-hidden', 'true')

    def test_ticker_touch_pause_and_loop_boundary_have_no_gap(self):
        p = self.open()
        ribbon = p.locator('.ticker')
        ribbon.scroll_into_view_if_needed()
        p.wait_for_function("document.querySelector('.ticker-track')?.children.length>1")
        ribbon.dispatch_event('click')
        expect(ribbon).to_have_attribute('aria-label', re.compile('^Retomar'))
        # Seek near both sides of the seam and test horizontal coverage in local coords.
        for progress in (0, .5, .9999):
            report = p.evaluate("""progress=>{
              const ribbon=document.querySelector('.ticker'),track=document.querySelector('.ticker-track');
              const animations=track.getAnimations({subtree:true});
              animations.forEach(a=>{a.pause();a.currentTime=a.effect.getTiming().duration*progress});
              const groups=[...track.children],width=parseFloat(getComputedStyle(groups[0]).width);
              return {count:groups.length,width,viewport:ribbon.clientWidth};
            }""", progress)
            self.assertGreaterEqual(report['count'] * report['width'] - report['width'] * progress, report['viewport'] - 1)
        ribbon.dispatch_event('click')
        expect(ribbon).to_have_attribute('aria-label', re.compile('^Pausar'))

    def test_reduced_motion_switches_ticker_to_manual_and_disables_burger(self):
        p = self.open()
        self.image_ready()
        p.emulate_media(reduced_motion='reduce')
        expect(p.locator('.ticker')).to_have_attribute('role', 'region')
        expect(p.locator('.burger-art')).to_have_attribute('aria-disabled', 'true')
        self.assertEqual(p.locator('.ticker-track > .ticker-content').count(), 1)
        p.locator('.ticker').scroll_into_view_if_needed()
        self.assertEqual(p.locator('.ticker').evaluate('n=>getComputedStyle(n).overflowX'), 'auto')
        self.assertGreater(p.locator('.ticker').evaluate('n=>{n.scrollLeft=50; return n.scrollLeft}'), 0)
        p.emulate_media(reduced_motion='no-preference')
        expect(p.locator('.ticker')).to_have_attribute('role', 'button')
        expect(p.locator('.burger-art')).to_have_attribute('aria-disabled', 'false')

    def test_burger_pulse_and_dialogs_still_work(self):
        p = self.open()
        self.image_ready()
        image = p.locator('.burger-art')
        rest = image.evaluate('i=>getComputedStyle(i).transform')
        image.focus()
        p.keyboard.press('Enter')
        p.wait_for_function("document.querySelector('.burger-art').classList.contains('burger-is-animating')")
        p.wait_for_function("!document.querySelector('.burger-art').classList.contains('burger-is-animating')")
        self.assertEqual(image.evaluate('i=>getComputedStyle(i).transform'), rest)
        p.locator('[data-open-hours]').click()
        expect(p.locator('#hours-dialog')).to_be_visible()
        p.keyboard.press('Escape')
        expect(p.locator('#hours-dialog')).to_be_hidden()
        expect(p.locator('[data-open-hours]')).to_be_focused()
        p.locator('[data-share]').click()
        expect(p.locator('#share-dialog')).to_be_visible()
        p.locator('#share-dialog [data-close-dialog]').click()
        expect(p.locator('#share-dialog')).to_be_hidden()


if __name__ == '__main__':
    unittest.main()
