import { useState } from 'react'
import { media, site } from '../data/site.js'

export function Arrow({ diagonal = false }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function ExternalLink({ href, children, className = '', ...props }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>{children}</a>
}

export function BrandImage({ name, alt, className = '', eager = false }) {
  const image = media[name]
  const [attempt, setAttempt] = useState(0)
  const sources = [`${import.meta.env.BASE_URL}media/${image.file}`, image.remote, `${import.meta.env.BASE_URL}fallback.svg`]
  return <img src={sources[attempt]} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" width={800} height={800} data-image-state={attempt === 2 ? 'fallback' : 'photo'} onError={() => setAttempt(value => Math.min(value + 1, 2))} />
}

export function Brand({ footer = false }) {
  return <a href="#inicio" className={`brand ${footer ? 'brand-footer' : ''}`} aria-label="Burdega — voltar ao início"><BrandImage name="logo" alt="" eager /><span><strong>BURDEGA<span className="brand-dot">.</span></strong><small>HAMBURGUERIA ARTESANAL</small></span></a>
}

export function OrderButton({ className = '', children = 'Bora pedir', ...props }) {
  return <ExternalLink href={site.links.menu} className={`button button-primary ${className}`} {...props}><span aria-hidden="true">🍔</span>{children}<Arrow /></ExternalLink>
}
