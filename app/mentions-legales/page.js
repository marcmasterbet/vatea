import LegalPage, { lireTexteLegal } from '@/components/LegalPage';

export const metadata = { title: lireTexteLegal('mentions-legales').titre, alternates: { canonical: '/mentions-legales' }, robots: { index: false } };

export default function Page() {
  return <LegalPage slug="mentions-legales" />;
}
