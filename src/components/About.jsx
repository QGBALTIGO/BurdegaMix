import { site } from '../data/site.js'
import { Arrow, ExternalLink } from './UI.jsx'

export default function About() {
  return <section id="burdega" className="about container reveal" aria-labelledby="about-title"><div className="about-year" aria-hidden="true"><span>DESDE</span><strong>2013</strong><span>O SABOR TEM HISTÓRIA.</span></div><div className="about-content"><p className="eyebrow">MUITO MAIS QUE UM BURGER</p><h2 id="about-title">O SEU MOMENTO<br />PEDE <em>BURDEGA.</em></h2><p>Tem o pedido no conforto de casa. Tem a mesa com os amigos. E tem aquele primeiro pedaço que faz o resto do dia ficar pra depois.</p><p>Desde 2013, a Burdega faz parte desses momentos em Várzea Alegre. Escolha o seu sabor. O próximo encontro é por aqui.</p><ExternalLink href={site.links.instagram} className="text-link">Conheça mais no Instagram <Arrow diagonal /></ExternalLink></div></section>
}
