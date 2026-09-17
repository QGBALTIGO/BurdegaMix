// Marquee adapted from the original Burger House section rhythm.
export default function Marquee() {
  return <div className="marquee" aria-hidden="true"><div className="marquee-track">{[0, 1, 2, 3].map(n => <span className="marquee-copy" key={n}>ARTESANAL DE VERDADE <i>✳</i> DEU FOME, DEU BURDEGA <i>✳</i> DESDE 2013 <i>✳</i></span>)}</div></div>
}
