import LegalPage, { lireTexteLegal } from '@/components/LegalPage';

export const metadata = { title: lireTexteLegal('politique-de-confidentialite').titre, alternates: { canonical: '/politique-de-confidentialite' }, robots: { index: false } };

export default function Page() {
  return <LegalPage slug="politique-de-confidentialite" />;
}
