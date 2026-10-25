import '@fontsource-variable/manrope';
import '@fontsource/cinzel/500.css';
import '@fontsource/cinzel/700.css';
import BackToTop from '@/components/BackToTop';
import CookieConsent from '@/components/CookieConsent';
import DevisSection from '@/components/DevisSection';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SansPagesJuridiques from '@/components/SansPagesJuridiques';
import { SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'VATEA – Vidéos d’entreprise sur mesure à Bruxelles', template: '%s | VATEA' },
  description: 'Corporate, publicitaires ou de formation : VATEA donne vie à vos projets vidéo, partout en Belgique et dans le nord de la France.',
  openGraph: { type: 'website', locale: 'fr_BE', siteName: 'VATEA' },
  icons: { icon: '/media/logo-va.png' },
};

export const viewport = { themeColor: '#121212' };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main>{children}</main>
        <SansPagesJuridiques><DevisSection /></SansPagesJuridiques>
        <Footer />
        <BackToTop />
        <CookieConsent />
      </body>
    </html>
  );
}
