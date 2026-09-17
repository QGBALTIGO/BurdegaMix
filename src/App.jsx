// Adaptation of mindset-code/burger-house-3d (MIT, Mindset & Code, 2026).
// Retains its React/GSAP section structure; replaces template data and assets.
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { quickLinks, site } from './data/site.js'
import HeroScene from './components/HeroScene.jsx'
import Marquee from './components/Marquee.jsx'
import Projects from './components/Projects.jsx'
import About from './components/About.jsx'
import Contact from './components/Contact.jsx'
import { Arrow, Brand, ExternalLink, OrderButton } from './components/UI.jsx'
gsap.registerPlugin(ScrollTrigger)

function Navbar() {
  const [open, setOpen] = useState(false)
  const toggle = useRef(null)
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return <header className="header"><div className="container nav-inner"><Brand /><nav id="main-navigation" aria-label="Navegação principal" className={`nav-links ${open ? 'is-open' : ''}`}><a href="#sabores" onClick={() => setOpen(false)}>Os sabores</a><a href="#burdega" onClick={() => setOpen(false)}>A Burdega</a><a href="#encontre" onClick={() => setOpen(false)}>Onde estamos</a></nav><OrderButton className="nav-order">Pedir agora</OrderButton><button ref={toggle} className="nav-toggle" type="button" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? 'Fechar navegação' : 'Abrir navegação'} onClick={() => setOpen(value => !value)}><span /> <span /></button></div></header>
}

export default function App() {
  const root = useRef(null)
  const [paused, setPaused] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (paused) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('.hero-copy > *', { y: 26, opacity: 0, duration: 0.75, stagger: 0.09, ease: 'power3.out', clearProps: 'all' })
        gsap.from('.hero-visual', { y: 25, opacity: 0, duration: 1, delay: 0.18, ease: 'power3.out', clearProps: 'all' })
        gsap.utils.toArray('.reveal').forEach(element => {
          gsap.from(element, { y: 26, opacity: 0, duration: 0.7, ease: 'power2.out', clearProps: 'all', scrollTrigger: { trigger: element, start: 'top 94%', once: true } })
        })
      }, root)
      return () => context.revert()
    })
    return () => media.revert()
  }, [paused])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 4500)
    return () => clearTimeout(timer)
  }, [message])
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: site.legalDisplayName, text: 'Deu fome? Deu Burdega. 🍔', url: window.location.href.split('#')[0] })
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(window.location.href.split('#')[0]); setMessage('Link copiado. Chama a galera! 🍔') }
      else setMessage('Copie o endereço do navegador para compartilhar.')
    } catch (error) { if (error.name !== 'AbortError') setMessage('Não foi possível compartilhar. Copie o endereço do navegador.') }
  }
  return <div ref={root} className={`site ${paused ? 'motion-paused' : ''}`}>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a><Navbar />
    <main id="conteudo"><section id="inicio" className="hero container" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow"><span /> ARTESANAL · DESDE {site.since}</p><h1 id="hero-title">DEU FOME?<br /><em>DEU<br className="desktop-break" /> BURDEGA.</em></h1><p className="hero-description">Aquele burger que não sai da cabeça.<br />E um lugar certo pra matar a vontade.</p><div className="hero-actions"><OrderButton>Quero meu Burdega</OrderButton><a href="#sabores" className="text-link">Conhecer os sabores <Arrow diagonal /></a></div><p className="hero-location"><span aria-hidden="true">📍</span> {site.city}, {site.state} <span className="dot">·</span> Delivery e salão</p></div><HeroScene paused={paused} /></section>
    <nav className="quick-links container" aria-label="Guia rápido da Burdega">{quickLinks.map(link => <ExternalLink key={link.id} href={site.links[link.id]} className={`quick-card quick-${link.id}`} aria-label={link.label}><span className="quick-emoji" aria-hidden="true">{link.emoji}</span><span className="quick-copy"><strong>{link.title}</strong><small>{link.description}</small></span><Arrow diagonal /></ExternalLink>)}</nav>
    <Marquee /><Projects /><About /><Contact />
    <section className="last-call"><div className="container"><p>ATÉ A ÚLTIMA MORDIDA.</p><h2>BORA DE <span>BURDEGA?</span></h2><OrderButton>Hoje eu mereço</OrderButton></div></section></main>
    <footer className="footer container"><Brand footer /><p>© {new Date().getFullYear()} Burdega · Feito pra dar fome.</p><div className="footer-actions"><ExternalLink href={site.links.instagram}>Instagram ↗</ExternalLink><button type="button" onClick={share}>Compartilhar ↗</button><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Ativar animações' : 'Pausar animações'}</button></div></footer>
    <div className="mobile-order"><ExternalLink href={site.links.whatsapp} className="mobile-whats" aria-label="Falar no WhatsApp"><span aria-hidden="true">💬</span></ExternalLink><OrderButton>Pedir meu Burdega</OrderButton></div><div className="toast" role="status" aria-live="polite">{message}</div>
  </div>
}
