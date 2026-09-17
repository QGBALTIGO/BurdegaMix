import { site } from '../data/site.js'
import { Arrow, ExternalLink, OrderButton } from './UI.jsx'

export default function Contact() {
  return <section id="encontre" className="section container" aria-labelledby="contact-title"><div className="contact-heading reveal"><p className="eyebrow"><span /> DELIVERY OU SALÃO?</p><h2 id="contact-title">O IMPORTANTE É<br /><em>MATAR ESSA VONTADE.</em></h2></div><div className="contact-grid">
    <div className="location-card reveal"><div className="location-top"><span className="location-icon" aria-hidden="true">📍</span><span>VÁRZEA ALEGRE · CE</span></div><h3>VEM PRA<br />BURDEGA.</h3><address>{site.address}<br />{site.neighborhood} · {site.city}, {site.state}</address><ExternalLink href={site.links.maps} className="button button-outline">Traçar minha rota <Arrow diagonal /></ExternalLink></div>
    <div className="delivery-card reveal"><span className="delivery-label">O SEU SOFÁ TAMBÉM É UMA BOA.</span><h3>A FOME BATEU?<br /><em>CHAMA A BURDEGA.</em></h3><p>Escolha no cardápio on-line ou fale com a gente pelo WhatsApp.</p><div className="delivery-actions"><OrderButton>Fazer meu pedido</OrderButton><ExternalLink href={site.links.whatsapp} className="button button-outline"><span aria-hidden="true">💬</span> WhatsApp</ExternalLink></div><details className="hours"><summary>Horários e atendimento <span aria-hidden="true">+</span></summary><p>{site.hoursMessage} <ExternalLink href={site.links.menu}>Consultar cardápio ↗</ExternalLink></p></details></div>
  </div></section>
}
