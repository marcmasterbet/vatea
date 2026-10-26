import Image from 'next/image';
import Link from 'next/link';
import photoHugo from '@/public/media/a-propos/hugo-plateau.jpg';
import photoCamera from '@/public/media/a-propos/camera.jpg';
import photoLumiere from '@/public/media/a-propos/lumiere.jpg';
import photoPlateauCafe from '@/public/media/a-propos/plateau-cafe.jpg';
import Placeholder from '@/components/Placeholder';

export const metadata = {
  title: 'À propos – Hugo Elvira, production audiovisuelle à Bruxelles',
  description: 'Derrière VATEA, une conviction : chaque projet mérite une équipe adaptée, une écoute attentive et un accompagnement humain.',
  alternates: { canonical: '/a-propos' },
};

const VALUES = [
  { num: 'I', title: 'L\'écoute avant la technique.', text: 'Je prends le temps de comprendre votre activité, vos attentes et les personnes auxquelles vous souhaitez vous adresser.' },
  { num: 'II', title: 'Le conseil avant la production.', text: 'Je vous aide à choisir le format, le message et les moyens les plus adaptés, même lorsque votre idée de départ demande encore à être précisée.' },
  { num: 'III', title: 'La bonne équipe pour le bon projet.', text: 'Chaque production possède ses propres exigences. Je sélectionne les professionnels en fonction de celles-ci, pas selon une formule préétablie.' },
  { num: 'IV', title: 'La confiance à chaque étape.', text: 'Vous participez aux décisions essentielles et validez le scénario avant le tournage. Plusieurs possibilités de révision sont également prévues avant la livraison finale.' },
];

export default function AProposPage() {
  return (
    <>
      <section className="hero-split" aria-labelledby="titre-apropos">
        <div className="container split">
          <div style={{ flex: '1 1 520px' }}>
            <span className="rule rule-lg" aria-hidden="true" />
            <h1 id="titre-apropos" className="h1" style={{ marginBottom: 22 }}>VATEA, une production audiovisuelle <span className="gold">à votre image.</span></h1>
            <p className="lead" style={{ maxWidth: 640, marginBottom: 22 }}>Derrière chaque vidéo, il y a un message à transmettre. Derrière VATEA, il y a une conviction : chaque projet mérite une équipe adaptée, une écoute attentive et un accompagnement humain.</p>
            <p className="gold" style={{ fontFamily: 'var(--font-cinzel), serif', fontWeight: 500, fontSize: 'clamp(18px, 1.6vw, 23px)', lineHeight: 1.4 }}>Je suis Hugo Elvira. Bienvenue dans mon univers.</p>
          </div>
          <div className="gold-frame" style={{ flex: '1 1 340px', maxWidth: 460 }}><Placeholder label="Portrait — Hugo Elvira" ratio="4 / 5" /></div>
        </div>
      </section>

      <section className="section" aria-labelledby="titre-qui">
        <div className="container split" style={{ flexWrap: 'wrap-reverse' }}>
          <div style={{ flex: '1 1 440px' }}>
            <figure className="photo-metier">
              <Image src={photoHugo} placeholder="blur" quality={82} sizes="(max-width: 768px) 92vw, 640px" alt="Hugo Elvira sur un plateau de tournage de nuit, sous une rampe d’éclairage" />
            </figure>
          </div>
          <div className="txt" style={{ flex: '1 1 480px' }}>
            <h2 id="titre-qui" className="h2" style={{ marginBottom: 22 }}>Qui suis-je ?</h2>
            <p>Depuis quatre ans, je travaille dans l'audiovisuel, notamment comme vidéaste et éclairagiste sur des plateaux de tournage de fiction et de publicité.</p>
            <p>Ces expériences m'ont appris une chose essentielle : une production réussie ne repose jamais sur une seule compétence. Elle repose sur des professionnels qui savent travailler ensemble, au service d'une même vision.</p>
            <p>C'est cette approche que je développe aujourd'hui avec VATEA, à Bruxelles.</p>
          </div>
        </div>
      </section>

      <section className="section band-prune" aria-labelledby="titre-pourquoi">
        <div className="container">
          <div className="framed-box" style={{ maxWidth: 1000 }}>
            <h2 id="titre-pourquoi" className="h2" style={{ marginBottom: 22 }}>Pourquoi VATEA ?</h2>
            <div className="txt" style={{ maxWidth: 760 }}>
              <p>Parce qu'une entreprise ne devrait pas avoir besoin de maîtriser les métiers du cinéma pour faire produire une vidéo professionnelle.</p>
              <p>Vous connaissez votre activité, vos clients et vos objectifs. Mon métier consiste à comprendre ce que vous souhaitez transmettre, puis à réunir les ressources nécessaires pour lui donner vie.</p>
            </div>
            <span className="rule" aria-hidden="true" style={{ margin: '28px auto' }} />
            <p style={{ marginBottom: 12, fontSize: 'clamp(17px, 1.5vw, 20px)', fontWeight: 700 }}>Pas d'équipe surdimensionnée. Pas de solution imposée.</p>
            <p className="quote-gold gold">Une production pensée autour de votre besoin.</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="titre-specialistes">
        <div className="container split">
          <div className="txt" style={{ flex: '1 1 480px' }}>
            <h2 id="titre-specialistes" className="h2" style={{ marginBottom: 22 }}>Des professionnels du cinéma réunis <span className="gold">autour de votre projet</span></h2>
            <p>Je m'appuie sur une équipe de spécialistes de l'audiovisuel : chef opérateur, ingénieur du son, monteur et motion designer. Selon les profils, ils comptent entre <strong>5 et 10 ans d'expérience</strong> dans le cinéma, le documentaire et la publicité.</p>
            <p>Parmi leurs références, <strong>Luca Salvi, chef opérateur, a participé à INC.</strong> (sélection EnergaCAMERIMAGE 2023) et à <strong>Jupiter</strong> (prix ARRI Rental 2021). <strong>Martin Gérard, monteur et motion designer, a participé à Smoke in the Wind</strong>, récompensé au Berlin Short Film Festival 2026.</p>
            <p><strong>Avec VATEA, vous bénéficiez de cette expertise cinématographique pour vos productions vidéo, avec un interlocuteur unique pour coordonner votre projet de A à Z.</strong></p>
          </div>
          {/* 4 photos qui forment un carré : 2 verticales (4:5) + 2 horizontales (4:3), en damier.
              Ajouter `src` quand la photo est fournie. */}
          <div className="damier" style={{ flex: '1 1 440px' }}>
            {[
              { label: 'caméra', forme: 'v', zone: 'a', src: photoCamera, alt: 'Cadreur portant une caméra cinéma sur un tournage en extérieur' },
              { label: 'lumière', forme: 'h', zone: 'b', src: photoLumiere, alt: 'Installation des projecteurs sur une structure en extérieur au coucher du soleil' },
              { label: 'tournage', forme: 'h', zone: 'c', src: photoPlateauCafe, alt: 'Tournage d’une scène dans un café avec une caméra cinéma' },
              { label: 'monteur', forme: 'v', zone: 'd' },
            ].map((m) => (
              <div key={m.label} style={{ gridArea: m.zone }}>
                {m.src ? (
                  <figure className="photo-metier photo-damier">
                    <Image src={m.src} placeholder="blur" quality={82} sizes="(max-width: 768px) 46vw, 320px" alt={m.alt} />
                  </figure>
                ) : <Placeholder label={`Photo ${m.forme === 'v' ? 'verticale' : 'horizontale'} — ${m.label}`} framed ratio="auto" style={{ height: '100%' }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="titre-principes" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,106,0.10) 0%, rgba(18,18,18,0) 60%), var(--noir)' }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="section-head">
            <span className="rule" aria-hidden="true" />
            <h2 id="titre-principes" className="h2-c">Ce qui guide ma façon de travailler</h2>
          </div>
          <div className="grid-auto">
            {VALUES.map((v) => (
              <div key={v.num} className="gold-card" style={{ padding: 'clamp(22px, 2.4vw, 32px)' }}>
                <p style={{ marginBottom: 6, fontFamily: 'var(--font-cinzel), serif', fontWeight: 700, fontSize: 16, color: '#2a2116' }}>{v.num}</p>
                <h3 style={{ marginBottom: 12, fontSize: 'clamp(19px, 1.7vw, 23px)', fontStyle: 'italic', fontWeight: 800, lineHeight: 1.25 }}>{v.title}</h3>
                <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#1e1a14' }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="titre-pratique">
        <div className="container split">
          <div className="gold-frame" style={{ flex: '1 1 480px' }}><Placeholder label="Vidéo — CTMA UCLouvain" video ratio="16 / 9" /></div>
          <div className="txt" style={{ flex: '1 1 440px' }}>
            <h2 id="titre-pratique" className="h2" style={{ marginBottom: 22 }}>Des compétences <span className="gold">mises en pratique</span></h2>
            <p>Mon parcours m'a notamment permis de travailler avec l'UCLouvain, l'une des grandes universités belges, à l'occasion d'une vidéo corporate pour son laboratoire CTMA.</p>
            <p>Cette expérience illustre le type de production que je souhaite développer avec VATEA : des projets où la qualité de l'image accompagne un message précis.</p>
            <p>Retrouvez également une sélection de réalisations dans notre portfolio.</p>
            <div style={{ marginTop: 24 }}><Link className="btn btn-ghost" href="/portfolio">Découvrir les réalisations</Link></div>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 'clamp(50px, 6.3vw, 90px)' }} aria-labelledby="titre-livraison">
        <div className="container">
          <div className="split" style={{ alignItems: 'flex-start', borderTop: '1px solid rgba(201,168,106,0.35)', paddingTop: 'clamp(34px, 4.2vw, 56px)' }}>
            <div style={{ flex: '1 1 380px' }}>
              <h2 id="titre-livraison" className="h2" style={{ marginBottom: 16 }}>De votre première idée à la livraison</h2>
              <p className="gold" style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', fontWeight: 600, lineHeight: 1.5 }}>Mon rôle ne s'arrête pas à organiser un tournage.</p>
            </div>
            <div className="txt" style={{ flex: '1 1 520px' }}>
              <p>Je vous accompagne dans la définition du projet, la préparation du scénario, le choix des intervenants, la recherche des lieux et du matériel, puis la coordination de la production et de la postproduction.</p>
              <p>Que votre objectif soit de valoriser votre entreprise, de promouvoir un produit ou de transmettre un savoir-faire, vous savez à qui vous adresser.</p>
              <p style={{ color: '#fff', fontWeight: 700 }}>Et surtout, vous n'avez pas à coordonner vous-même tous les métiers nécessaires à votre vidéo.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="titre-bruxelles" style={{ paddingBottom: 'clamp(56px, 7vw, 98px)' }}>
        <div className="container">
          <div className="cta-box">
            <h2 id="titre-bruxelles" className="h2" style={{ maxWidth: 900, marginBottom: 22 }}>Basé à Bruxelles, à vos côtés au-delà des frontières</h2>
            <div className="txt" style={{ maxWidth: 760 }}>
              <p>Avec VATEA, j'accompagne les entreprises à Bruxelles, partout en Belgique et dans le nord de la France.</p>
              <p>Mon ambition est simple : construire une relation professionnelle fondée sur l'écoute, le sérieux et la qualité du conseil.</p>
            </div>
            <p className="quote-gold gold" style={{ margin: '22px 0 32px', maxWidth: 760, fontSize: 'clamp(19px, 1.8vw, 25px)' }}>Parce qu'avant de produire votre vidéo, je veux comprendre ce qu'elle doit accomplir.</p>
            <a className="btn btn-gold btn-lg" href="#contact">Parlons de votre projet vidéo</a>
          </div>
        </div>
      </section>
    </>
  );
}
