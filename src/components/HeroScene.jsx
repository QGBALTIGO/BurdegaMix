// Adapted from mindset-code/burger-house-3d HeroScene: photo + layered hero.
import { Component, lazy, Suspense, useState } from 'react'
import { BrandImage } from './UI.jsx'
const BurgerScene = lazy(() => import('./GLBScene.jsx'))

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="scene-error"><BrandImage name="gourmet" alt="Gourmet Miix da Burdega" /><p>O 3D não está disponível neste navegador. O cardápio continua logo ali. 🍔</p></div> : this.props.children }
}

export default function HeroScene({ paused }) {
  const [mode, setMode] = useState('photo')
  const [exploded, setExploded] = useState(false)
  const [rotation, setRotation] = useState(0)
  return <div className="hero-visual">
    <div className="visual-outline" aria-hidden="true" />
    <div className="hero-photo-frame">
      {mode === 'photo' ? <BrandImage name="gourmet" alt="Gourmet Miix: hambúrguer artesanal da Burdega com queijo coalho e bacon" className="hero-bg" eager /> : <SceneBoundary><Suspense fallback={<div className="scene-loading" role="status"><span aria-hidden="true">🍔</span>Preparando a experiência 3D…</div>}><BurgerScene paused={paused} exploded={exploded} rotation={rotation} /></Suspense></SceneBoundary>}
      <div className="photo-shade" aria-hidden="true" />
      <span className="image-caption">{mode === 'photo' ? 'GOURMET MIIX · FOTO DO NOSSO CARDÁPIO' : 'BURGER ILUSTRATIVO · EXPERIÊNCIA 3D'}</span>
    </div>
    <div className="hero-stamp" aria-label="Artesanal desde 2013"><span>FEITO PRA</span><strong>DAR<br />FOME.</strong><span>DESDE 2013</span></div>
    <div className="visual-controls" role="group" aria-label="Visualização do hambúrguer">
      <button type="button" aria-pressed={mode === 'photo'} onClick={() => setMode('photo')}>Foto real</button>
      <button type="button" aria-pressed={mode === '3d'} onClick={() => setMode('3d')}><span aria-hidden="true">✧</span> Explorar em 3D</button>
    </div>
    {mode === '3d' && <div className="scene-controls" role="group" aria-label="Controles da ilustração 3D">
      <button type="button" onClick={() => setRotation(value => value - Math.PI / 4)} aria-label="Girar hambúrguer para a esquerda">↶</button>
      <button type="button" onClick={() => setExploded(value => !value)} aria-pressed={exploded}>{exploded ? 'Juntar camadas' : 'Separar camadas'}</button>
      <button type="button" onClick={() => setRotation(value => value + Math.PI / 4)} aria-label="Girar hambúrguer para a direita">↷</button>
    </div>}
    <span className="handwritten" aria-hidden="true">resistir pra quê? ↗</span>
  </div>
}
