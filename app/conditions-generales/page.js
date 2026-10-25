import LegalPage, { lireTexteLegal } from '@/components/LegalPage';

export const metadata = { title: lireTexteLegal('conditions-generales').titre, alternates: { canonical: '/conditions-generales' }, robots: { index: false } };

export default function Page() {
  return <LegalPage slug="conditions-generales" />;
}
