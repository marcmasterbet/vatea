import CtaBox from './CtaBox';
import Placeholder from './Placeholder';
import { CTA_DEVIS } from '@/lib/site';

/**
 * Gabarit commun aux trois pages de services (corporate, publicitaire, formation).
 * Les textes sont fournis tels quels par chaque page.
 */
export default function ServicePage({ id, h1a, h1b, intro, photoLabel, videoTitle, videoLabel, videoCaption, msgTitleA, msgTitleB, question, before, difference, after, closing, closingGold, ctaFinal }) {
  return (
    <>
      <section className="hero-split" aria-labelledby={`titre-${id}`}>
        <div className="container split">
          <div style={{ flex: '1 1 540px' }}>
            <span className="rule rule-lg" aria-hidden="true" />
            <h1 id={`titre-${id}`} className="h1" style={{ marginBottom: 22 }}>{h1a} <span className="gold">{h1b}</span></h1>
            <p className="lead" style={{ maxWidth: 660, marginBottom: 14 }}>{intro}</p>
            <p className="sub" style={{ maxWidth: 660, marginBottom: 30 }}>Basé à Bruxelles, j'accompagne les entreprises partout en Belgique et dans le nord de la France.</p>
            <a className="btn btn-gold" href="#contact">{CTA_DEVIS}</a>
          </div>
          <div style={{ flex: '1 1 360px', maxWidth: 500 }}><Placeholder label={photoLabel} framed ratio="4 / 5" /></div>
        </div>
      </section>

      <section className="section" aria-labelledby={`video-${id}`}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="section-head">
            <span className="rule" aria-hidden="true" />
            <h2 id={`video-${id}`} className="h2-c">{videoTitle}</h2>
          </div>
          <div className="gold-frame" style={{ padding: 12 }}><Placeholder label={videoLabel} video ratio="16 / 9" /></div>
          <p className="lead" style={{ margin: '22px auto 0', maxWidth: 760, textAlign: 'center', color: 'var(--texte-2)' }}>{videoCaption}</p>
        </div>
      </section>

      <section style={{ paddingBottom: 'clamp(50px, 6.3vw, 90px)' }} aria-labelledby={`message-${id}`}>
        <div className="container">
          <div className="split" style={{ alignItems: 'flex-start', borderTop: '1px solid rgba(201,168,106,0.35)', paddingTop: 'clamp(40px, 5vw, 67px)' }}>
            <div style={{ flex: '1 1 400px' }}>
              <h2 id={`message-${id}`} className="h2" style={{ marginBottom: question ? 26 : 0 }}>{msgTitleA} <span className="gold">{msgTitleB}</span></h2>
              {question && <p className="aside-q">{question}</p>}
            </div>
            <div className="txt" style={{ flex: '1 1 540px' }}>
              {before.map((p) => <p key={p}>{p}</p>)}
              <div className="gold-card diff-card"><p><em>Ma différence ?</em> {difference}</p></div>
              {after.map((p) => <p key={p}>{p}</p>)}
            </div>
          </div>
        </div>
      </section>

      <CtaBox button={ctaFinal}>
        <p className="quote-gold" style={{ maxWidth: 940, marginBottom: 32 }}>
          {closing} {closingGold && <span className="gold">{closingGold}</span>}
        </p>
      </CtaBox>
    </>
  );
}
