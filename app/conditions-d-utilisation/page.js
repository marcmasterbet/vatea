import LegalPage, { lireTexteLegal } from '@/components/LegalPage';

export const metadata = { title: lireTexteLegal('conditions-d-utilisation').titre, alternates: { canonical: '/conditions-d-utilisation' }, robots: { index: false } };

export default function Page() {
  return <LegalPage slug="conditions-d-utilisation" />;
}
