import Link from 'next/link';
import CtaBox from '@/components/CtaBox';
import Faq from '@/components/Faq';
import Placeholder from '@/components/Placeholder';
import VideoPresentation from '@/components/VideoPresentation';
import { CTA_DEVIS, VIDEO_PRESENTATION } from '@/lib/site';

const FAQ = [
  { q: '1. Comment savoir quel type de vidéo correspond à mon objectif ?', a: 'Tout dépend de votre message et de votre public. Vidéo corporate pour valoriser votre entreprise, publicitaire pour promouvoir votre offre ou formation pour transmettre un savoir : je vous aide à choisir le format adapté.' },
  { q: '2. Dois-je préparer un scénario avant de vous contacter ?', a: 'Absolument pas. Une idée, un besoin ou un objectif suffisent pour commencer. Je vous accompagne dans la conception du scénario, que vous validez avant le tournage.' },
  { q: '3. Comment se déroule un projet vidéo avec VATEA ?', a: 'Nous définissons ensemble vos objectifs. J\'organise ensuite la préparation, les intervenants, le matériel et le tournage. Puis viennent le montage, vos retours et la livraison finale.' },
  { q: '4. Combien de temps dois-je consacrer à mon projet ?', a: 'Vous n\'avez pas à gérer toute la production. Je coordonne les différentes étapes et sollicite votre intervention pour les décisions et validations essentielles. Vous gardez le contrôle sans porter toute l\'organisation.' },
  { q: '5. Qui réalise concrètement ma vidéo ?', a: 'Je constitue une équipe de professionnels selon les besoins de votre projet : image, son, éclairage, montage ou autres spécialités. Chaque intervenant apporte son expertise, sous ma coordination.' },
  { q: '6. Quels sont les délais de réalisation d\'une vidéo professionnelle ?', a: 'Ils dépendent du scénario, du nombre de journées de tournage et du travail de postproduction. Nous définissons un calendrier adapté à votre projet avant de lancer la production.' },
  { q: '7. Puis-je demander des modifications avant la livraison ?', a: 'Oui. Vous validez le scénario avant le tournage et bénéficiez de plusieurs révisions incluses avant la livraison définitive. L\'objectif : obtenir une vidéo fidèle au message que vous souhaitez transmettre.' },
  { q: '8. Ma vidéo sera-t-elle adaptée à mes supports de communication ?', a: 'Oui, les supports de diffusion sont pris en compte dès la préparation. Site internet, réseaux sociaux, communication interne ou publicité : nous définissons les formats nécessaires selon vos usages.' },
  { q: '9. Intervenez-vous uniquement à Bruxelles ?', a: 'Non. Basé à Bruxelles, j\'accompagne les entreprises partout en Belgique et dans le nord de la France. Je peux également étudier des projets ailleurs en France.' },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q.replace(/^\d+\.\s*/, ''), acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Logos clients (gris, fond transparent) — public/media/logos. Taille calculée pour un poids visuel égal.
const LOGOS = [
  ['uclouvain', 'UCLouvain', 716, 112],
  ['tsf', 'TSF', 603, 240],
  ['milano-cortina-2026', 'Milano Cortina 2026', 303, 240],
  ['iris-production-groupe', 'Iris Production Groupe', 289, 240],
  ['client-rv', 'Client (logo RV)', 273, 240],
  ['creative-district', 'Creative District', 720, 192],
  ['bookr', 'Bookr', 240, 240],
  ['black-town', 'Black Town', 308, 240],
  ['autoworld-brussels', 'Autoworld Brussels', 720, 232],
].map(([slug, nom, w, h]) => {
  const ratio = w / h, aire = 5200;
  let hh = Math.min(76, Math.sqrt(aire / ratio));
  let ww = hh * ratio;
  if (ww > 190) { ww = 190; hh = ww / ratio; }
  return { slug, nom, w: Math.round(ww), h: Math.round(hh) };
});

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* HERO : vidéo d'arrière-plan en boucle (objectif en gros plan, fournie le 26/10).
          Ordinateur : fichier d'origine 2048 px, sans réencodage (netteté maximale) · téléphone : version recadrée au centre, plus légère. */}
      <section className="hero-video" aria-labelledby="titre-hero">
        <video poster="/media/hero-accueil-poster.jpg" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
          <source src="/media/hero-accueil.mp4" type="video/mp4" media="(min-width: 768px)" />
          <source src="/media/hero-accueil.webm" type="video/webm" media="(min-width: 768px)" />
          <source src="/media/hero-accueil-mobile.webm" type="video/webm" />
          <source src="/media/hero-accueil-mobile.mp4" type="video/mp4" />
        </video>
        <div className="veil" aria-hidden="true" />
        <div className="container content">
          <span className="rule rule-lg" aria-hidden="true" />
          <h1 id="titre-hero" className="h1-xl" style={{ maxWidth: 980, marginBottom: 20 }}>Vos vidéos d’entreprise sur mesure à Bruxelles.</h1>
          <p className="lead" style={{ maxWidth: 700, marginBottom: 32 }}>Corporate, publicitaires ou de formation : VATEA donne vie à vos projets, partout en Belgique et dans le nord de la France.</p>
          <a className="btn btn-gold" href="#contact">{CTA_DEVIS}</a>
        </div>
      </section>

      {/* VIDÉO DE PRÉSENTATION (plusieurs minutes) — source à renseigner dans lib/site.js */}
      <section className="section section-video" aria-labelledby="titre-video">
        <div className="container">
          <div className="video-tete">
            <span className="rule" aria-hidden="true" />
            <h2 id="titre-video" className="h2">{VIDEO_PRESENTATION.titre}</h2>
            {VIDEO_PRESENTATION.sousTitre && <p className="lead" style={{ color: 'var(--texte-2)' }}>{VIDEO_PRESENTATION.sousTitre}</p>}
          </div>
          <div className="gold-frame video-cadre">
            <VideoPresentation />
          </div>
        </div>
      </section>

      {/* PROBLÈME */}
      <section className="section" aria-labelledby="titre-probleme">
        <div className="container split">
          <div style={{ flex: '1 1 440px' }}>
            <h2 id="titre-probleme" className="h2" style={{ marginBottom: 20 }}>Votre message est clair pour vous. <span className="gold">Mais pour votre public ?</span></h2>
            <p className="lead" style={{ color: 'var(--texte-2)', marginBottom: 28 }}>Scénario, tournage, équipe, budget : produire une vidéo d'entreprise mobilise plusieurs expertises. Sans une bonne coordination, votre message risque de perdre son impact.</p>
            <a className="btn btn-ghost" href="#contact">Faire étudier mon projet vidéo</a>
          </div>
          <div style={{ flex: '1 1 440px' }}><Placeholder label="Photo — préparation / tournage" framed /></div>
        </div>
      </section>

      {/* RÉSONANCE */}
      <section className="section band-prune" aria-labelledby="titre-resonance">
        <div className="container">
          <div className="framed-box">
            <h2 id="titre-resonance" className="quote-gold gold" style={{ marginBottom: 20 }}>Une belle vidéo ne suffit pas si le message ne passe pas.</h2>
            <p className="lead" style={{ maxWidth: 760, color: 'var(--texte-2)', marginBottom: 28 }}>Vous investissez du temps, des équipes et un budget. Mais si vos clients ou vos collaborateurs ne comprennent pas ce que vous voulez transmettre, votre investissement perd tout son impact.</p>
            <a className="btn btn-ghost" href="#contact">Donner de l’impact à mon message</a>
          </div>
        </div>
      </section>

      {/* ÉVIDENCE */}
      <section className="section" aria-labelledby="titre-evidence" style={{ overflow: 'hidden' }}>
        <div className="container">
          <div className="split" style={{ alignItems: 'flex-end', marginBottom: 'clamp(28px, 3.5vw, 45px)' }}>
            <h2 id="titre-evidence" className="h2" style={{ flex: '1 1 420px' }}>Une équipe de spécialistes. <span className="gold">Des références concrètes.</span></h2>
            <div style={{ flex: '1 1 440px' }}>
              <p className="lead" style={{ color: 'var(--texte-2)', marginBottom: 24 }}>J'ai réuni les professionnels adaptés à chaque production vidéo. Certains sont primés en festival. Parmi mes références : une vidéo corporate pour le laboratoire CTMA de l’UCLouvain.</p>
              <Link className="btn btn-ghost" href="/portfolio">Découvrir nos réalisations</Link>
            </div>
          </div>
          <div className="grid-auto">
            {['Vidéo — CTMA UCLouvain', 'Vidéo — réalisation 2', 'Vidéo — réalisation 3'].map((l) => (
              <div className="gold-frame" key={l}><Placeholder label={l} video small ratio="16 / 10" /></div>
            ))}
          </div>
        </div>
        <div className="logos" style={{ marginTop: 'clamp(36px, 4.5vw, 60px)' }}>
          <ul className="logo-track" aria-label="Ils nous ont fait confiance">
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <li className="logo-item" key={i} aria-hidden={i >= LOGOS.length ? 'true' : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/logos/${l.slug}.webp`} alt={i >= LOGOS.length ? '' : l.nom} width={l.w} height={l.h} style={{ '--w': `${l.w}px` }} decoding="async" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="section" aria-labelledby="titre-solution" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(201,168,106,0.10) 0%, rgba(18,18,18,0) 60%), var(--noir)' }}>
        <div className="container split" style={{ flexWrap: 'wrap-reverse' }}>
          <div style={{ flex: '1 1 440px' }}><Placeholder label="Photo — l'équipe en tournage" framed ratio="4 / 5" style={{ maxHeight: 560 }} /></div>
          <div style={{ flex: '1 1 440px' }}>
            <h2 id="titre-solution" className="h2" style={{ marginBottom: 20 }}>Votre projet vidéo, entre les mains <span className="gold">des bons experts.</span></h2>
            <p className="lead" style={{ color: 'var(--texte-2)', marginBottom: 28 }}>Je vous accompagne de la première idée au montage final. Scénario, équipe, tournage : je coordonne chaque étape pour créer une vidéo sur mesure, fidèle à votre message et à vos objectifs.</p>
            <a className="btn btn-gold" href="#contact">Concrétiser mon projet vidéo</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section" aria-labelledby="titre-faq">
        <div className="container faq">
          <div className="section-head">
            <span className="rule" aria-hidden="true" />
            <h2 id="titre-faq" className="h2-c">FAQ — Vos questions sur la production vidéo</h2>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>

      <CtaBox button="Parlons de votre projet vidéo" />
    </>
  );
}
