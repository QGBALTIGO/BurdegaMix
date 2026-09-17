import { highlights, site } from '../data/site.js'
import { Arrow, BrandImage, ExternalLink } from './UI.jsx'

export default function Projects() {
  return <section id="sabores" className="section container" aria-labelledby="menu-title">
    <div className="section-heading reveal"><div><p className="eyebrow"><span /> UM GOSTINHO DO QUE TE ESPERA</p><h2 id="menu-title">ESCOLHA SUA<br /><em>PRÓXIMA MORDIDA.</em></h2></div><ExternalLink href={site.links.menu} className="text-link">Ver cardápio completo <Arrow diagonal /></ExternalLink></div>
    <div className="products-grid">{highlights.map(product => <article className="project-card reveal" key={product.id}>
      <ExternalLink href={site.links.menu} className="product-photo" aria-label={`Ver ${product.name} no cardápio oficial`}><BrandImage name={product.image} alt={`${product.name} — foto do cardápio da Burdega`} /><span className="product-number">{product.number}</span><span className="product-arrow"><Arrow diagonal /></span></ExternalLink>
      <div className="product-info"><span className="product-tag">{product.tag}</span><h3>{product.name}</h3><p>{product.description}</p><ExternalLink className="text-link" href={site.links.menu}>Esse deu vontade <Arrow /></ExternalLink></div>
    </article>)}</div>
    <p className="menu-note">Burgers, acompanhamentos, combos e aquele docinho. Preços e disponibilidade sempre atualizados no cardápio oficial.</p>
  </section>
}
