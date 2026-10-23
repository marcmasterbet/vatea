import { SITE_URL } from '@/lib/site';

// Tant que le site est une maquette sur une adresse Vercel, on bloque l'indexation.
// Passer INDEXATION à true le jour de la mise en ligne officielle sur www.vatea.be.
const INDEXATION = false;

export default function robots() {
  return INDEXATION
    ? { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE_URL}/sitemap.xml` }
    : { rules: { userAgent: '*', disallow: '/' } };
}
