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
            VATEA
          </p>
          <nav aria-label="Liens légaux" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/politique-de-confidentialite">Politique de confidentialité</Link>
            <Link href="/cookies">Paramètres des cookies</Link>
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--texte-2)' }}>
            <span>{CONTACT.email}</span>
            <span>{CONTACT.phone}</span>
            <span>{CONTACT.address}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={CONTACT.instagram} className="social" aria-label="Instagram"><IconInstagram /></a>
            <a href={CONTACT.linkedin} className="social" aria-label="LinkedIn"><IconLinkedin /></a>
          </div>
        </div>
        <p style={{ marginTop: 36, fontSize: 12, color: '#8f8f8f' }}>© VATEA</p>
      </div>
    </footer>
  );
}
