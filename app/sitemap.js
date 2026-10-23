import { getArticles } from '@/lib/blog';
import { NAV, SITE_URL } from '@/lib/site';

export default function sitemap() {
  const pages = NAV.map((n) => ({ url: `${SITE_URL}${n.href === '/' ? '' : n.href}`, changeFrequency: 'monthly', priority: n.href === '/' ? 1 : 0.8 }));
  const posts = getArticles().map((a) => ({ url: `${SITE_URL}/blog/${a.slug}`, changeFrequency: 'yearly', priority: 0.6 }));
  return [...pages, ...posts];
}
