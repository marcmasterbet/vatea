'use client';

import { usePathname } from 'next/navigation';

// Pages juridiques : pas de formulaire de devis en bas de page.
const JURIDIQUE = ['/mentions-legales', '/politique-de-confidentialite', '/conditions-d-utilisation', '/conditions-generales', '/cookies'];

export default function SansPagesJuridiques({ children }) {
  const chemin = usePathname();
  return JURIDIQUE.includes(chemin) ? null : children;
}
