import Image from 'next/image';
import Link from 'next/link';
import { CONTACT } from '@/lib/site';
import { IconInstagram, IconLinkedin } from './Icons';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <p style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-cinzel), serif', fontWeight: 700, fontSize: 24, letterSpacing: '.1em' }}>
            <Image src="/media/logo-va.png" alt="" width={44} height={47} />
            <Image src="/media/vatea-nom.svg" alt="VATEA" width={93} height={22} className="brand-nom" unoptimized />
          </p>
          <nav aria-label="Liens légaux" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/politique-de-confidentialite">Politique de confidentialité et cookies</Link>
            <Link href="/conditions-d-utilisation">Conditions d’utilisation</Link>
            <Link href="/conditions-generales">Conditions générales</Link>
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--texte-2)' }}>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phone}</a>
            <span>{CONTACT.address}</span>
            <span>TVA {CONTACT.tva}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={CONTACT.instagram} className="social" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><IconInstagram /></a>
            <a href={CONTACT.linkedin} className="social" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><IconLinkedin /></a>
          </div>
        </div>
        <p style={{ marginTop: 36, fontSize: 12, color: '#8f8f8f' }}>© VATEA</p>
      </div>
    </footer>
  );
}
