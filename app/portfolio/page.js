import Image from 'next/image';
import heroPortfolio from '@/public/media/hero-portfolio.jpg';
import CtaBox from '@/components/CtaBox';
import Placeholder from '@/components/Placeholder';

export const metadata = {
  title: 'Portfolio vidéo à Bruxelles – nos réalisations',
  description: 'Films corporate, vidéos publicitaires et contenus de formation : découvrez le savoir-faire audiovisuel de VATEA à travers nos productions.',
  alternates: { canonical: '/portfolio' },
};

const GALLERIES = [
  {
    id: 'galerie-corporate', a: 'Vidéos corporate :', b: 'votre entreprise sous son meilleur angle.',
    text: "Film institutionnel, interview ou communication interne : découvrez comment l'image peut mettre en valeur une entreprise, ses équipes et son expertise.",
    items: [
      { label: "Vidéo à intégrer sous réserve d'autorisation", caption: 'Référence : UCLouvain — Laboratoire CTMA' },
      { label: 'Vidéo corporate 2' }, { label: 'Vidéo corporate 3' },
    ],
  },
  {
    id: 'galerie-publicite', a: 'Vidéos publicitaires :', b: 'des idées qui prennent vie.',
    text: 'Films publicitaires, présentations de produits et campagnes promotionnelles : des productions pensées pour valoriser les marques et transmettre leurs messages.',
    items: [{ label: 'Vidéo publicitaire 1' }, { label: 'Vidéo publicitaire 2' }, { label: 'Vidéo publicitaire 3' }],
  },
  {
    id: 'galerie-formation', a: 'Vidéos de formation :', b: 'le savoir-faire en images.',
    text: 'Tutoriels, formations internes et contenus pédagogiques : découvrez comment la vidéo peut rendre les connaissances professionnelles plus accessibles.',
    items: [{ label: 'Vidéo de formation 1' }, { label: 'Vidéo de formation 2' }, { label: 'Vidéo de formation 3' }],
  },
];

export default function PortfolioPage() {
  return (
    <>
      <section className="hero-photo" aria-labelledby="titre-portfolio">
        <Image src={heroPortfolio} placeholder="blur" quality={70} alt="" fill priority sizes="100vw" className="bg" style={{ objectPosition: '70% 50%', '--mpos': '80% 45%' }} />
        <div className="fade-x" aria-hidden="true" />
        <div className="fade-y" aria-hidden="true" />
        <div className="container content">
          <div className="inner">
            <span className="rule rule-lg" aria-hidden="true" />
            <h1 id="titre-portfolio" className="h1" style={{ marginBottom: 22, textShadow: '0 2px 24px rgba(18, 18, 18,.5)' }}>Portfolio vidéo à Bruxelles : <span className="gold">découvrez nos réalisations.</span></h1>
            <p className="lead" style={{ maxWidth: 600, marginBottom: 14 }}>Films corporate, vidéos publicitaires et contenus de formation : découvrez le savoir-faire audiovisuel de VATEA à travers nos productions.</p>
            <p className="sub" style={{ maxWidth: 600, marginBottom: 30 }}>Basé à Bruxelles, j'accompagne les entreprises partout en Belgique et dans le nord de la France.</p>
            <a className="btn btn-gold" href="#galerie-corporate">Découvrir nos réalisations</a>
          </div>
        </div>
      </section>

      {GALLERIES.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`t-${g.id}`} style={{ padding: 'clamp(28px, 3.5vw, 48px) 0' }}>
          <div className="container">
            <div className="gallery-head">
              <h2 id={`t-${g.id}`} className="h2" style={{ flex: '1 1 420px' }}>{g.a} <span className="gold">{g.b}</span></h2>
              <p className="lead" style={{ flex: '1 1 460px', color: 'var(--texte-2)' }}>{g.text}</p>
            </div>
            <div className="grid-auto">
              {g.items.map((it) => (
                <div className="tile" key={it.label}>
                  <div className="tile-media"><Placeholder label={it.label} video small ratio="16 / 9" /></div>
                  {it.caption && <p className="gold" style={{ fontSize: 14.5, fontStyle: 'italic', fontWeight: 600 }}>{it.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="section" aria-labelledby="titre-production" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(201,168,106,0.10) 0%, rgba(18,18,18,0) 60%), var(--noir)' }}>
        <div className="container split">
          <div style={{ flex: '1 1 420px' }}><Placeholder label="Photo — coulisses d'un tournage" framed /></div>
          <div className="txt" style={{ flex: '1 1 480px' }}>
            <h2 id="titre-production" className="h2" style={{ marginBottom: 22 }}>Derrière chaque vidéo, <span className="gold">une production sur mesure.</span></h2>
            <p style={{ color: '#fff', fontWeight: 600 }}>Une réalisation ne commence pas avec une caméra. Elle commence par une idée, un objectif et un public à convaincre.</p>
            <p>J'étudie les besoins de chaque entreprise, prépare la production et réunis les spécialistes adaptés au projet.</p>
            <p>Scénario, tournage, éclairage, son et montage : chaque compétence intervient pour servir le message.</p>
          </div>
        </div>
      </section>

      <CtaBox button="Obtenir mon devis personnalisé">
        <p className="quote-gold" style={{ maxWidth: 900, marginBottom: 32 }}>Votre projet mérite lui aussi <span className="gold">une production à son image.</span></p>
      </CtaBox>
    </>
  );
}
