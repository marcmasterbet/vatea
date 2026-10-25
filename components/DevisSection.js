import Image from 'next/image';
import fondFormulaire from '@/public/media/fond-formulaire.jpg';
import { CONTACT } from '@/lib/site';
import DevisForm from './DevisForm';
import { IconMail, IconPhone } from './Icons';

export default function DevisSection() {
  return (
    <section id="contact" className="devis" aria-labelledby="titre-devis">
      <Image src={fondFormulaire} placeholder="blur" quality={70} alt="" fill sizes="100vw" className="bg" style={{ objectPosition: '75% 55%' }} />
      <div className="fade-x" aria-hidden="true" />
      <div className="fade-y" aria-hidden="true" />
      <div className="container content">
        <div className="devis-col">
          <span className="rule" aria-hidden="true" style={{ width: 48, marginBottom: 16 }} />
          <h2 id="titre-devis" style={{ marginBottom: 8, fontSize: 'clamp(26px, 2.5vw, 36px)', fontWeight: 800, lineHeight: 1.1 }}>
            Parlons de votre <span className="gold">projet vidéo</span>
          </h2>
          <p style={{ marginBottom: 20, maxWidth: 440, fontSize: 14, lineHeight: 1.6, color: '#e0e0e0' }}>
            Basé à Bruxelles, j'accompagne les entreprises partout en Belgique et dans le nord de la France.
          </p>
          <div className="glass">
            <DevisForm />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', marginTop: 14, fontSize: 13, color: '#d2d2d2' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--or)' }}><IconMail /><a href={`mailto:${CONTACT.email}`} style={{ color: '#d2d2d2' }}>{CONTACT.email}</a></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--or)' }}><IconPhone /><a href={`tel:${CONTACT.phoneHref}`} style={{ color: '#d2d2d2' }}>{CONTACT.phone}</a></span>
          </div>
        </div>
      </div>
    </section>
  );
}
