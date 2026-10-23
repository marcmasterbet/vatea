'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CONTACT, CTA_DEVIS, NAV } from '@/lib/site';
import { IconChevron } from './Icons';

function isCurrent(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="VATEA – accueil">
            <Image src="/media/logo-va.png" alt="" width={34} height={36} priority />
            VATEA
          </Link>
          <nav className="nav" aria-label="Navigation principale">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link" aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
            <a href="#contact" className="btn btn-gold btn-small">{CTA_DEVIS}</a>
          </nav>
        </div>
      </header>

      <button
        className="burger"
        type="button"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
        )}
      </button>

      {open && (
        <nav id="menu-mobile" className="mobile-menu" aria-label="Menu mobile">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="mobile-link" aria-current={isCurrent(pathname, item.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {item.label}
              <span style={{ color: 'var(--or)' }}><IconChevron size={18} dir="right" /></span>
            </Link>
          ))}
          <a href="#contact" className="btn btn-gold" style={{ marginTop: 32, width: '100%' }} onClick={() => setOpen(false)}>{CTA_DEVIS}</a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 28, fontSize: 14, color: '#bdbdbd' }}>
            <span>{CONTACT.email}</span>
            <span>{CONTACT.phone}</span>
          </div>
        </nav>
      )}
    </>
  );
}
