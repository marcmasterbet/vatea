import fs from 'node:fs';
import path from 'node:path';

// Thème de chaque article, dans l'ordre du fichier content/blog.md
const CATEGORIES = ['Corporate', 'Corporate', 'Corporate', 'Corporate', 'Corporate', 'Publicité', 'Publicité', 'Publicité', 'Publicité', 'Publicité', 'Formation', 'Formation'];

function slugify(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/['’]/g, '-')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/g, '');
}

/** Découpe une ligne en segments { text, em } selon les *italiques* (les ** isolés sont ignorés). */
function segments(line) {
  const parts = line.replace(/\*\*/g, '').split('*');
  const odd = parts.length % 2 === 1;
  return parts
    .map((text, i) => ({ text, em: i % 2 === 1 && (odd || i < parts.length - 1) }))
    .filter((s) => s.text);
}

let cache;

export function getArticles() {
  if (cache) return cache;
  const raw = fs.readFileSync(path.join(process.cwd(), 'content', 'blog.md'), 'utf8').replace(/\r/g, '');
  const blocks = raw.split(/\n---\n/).filter((b) => b.includes('# ARTICLE'));
  cache = blocks.map((block, n) => {
    const art = { title: '', intro: [], sections: [], words: 0, first: '' };
    let cur = null;
    for (const rawLine of block.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('# ARTICLE')) continue;
      if (line.startsWith('## ')) { cur = { heading: line.slice(3), paragraphs: [] }; art.sections.push(cur); continue; }
      if (line.startsWith('# ')) { art.title = line.slice(2); continue; }
      art.words += line.split(/\s+/).length;
      if (!art.first) art.first = line.replace(/\*/g, '');
      (cur ? cur.paragraphs : art.intro).push(segments(line));
    }
    let excerpt = art.first;
    if (excerpt.length > 170) { excerpt = excerpt.slice(0, 170); excerpt = `${excerpt.slice(0, excerpt.lastIndexOf(' '))}…`; }
    return {
      slug: slugify(art.title.replace(/\s*\?$/, '')),
      title: art.title,
      category: CATEGORIES[n] || 'Corporate',
      readingTime: `${Math.max(1, Math.round(art.words / 200))} min de lecture`,
      excerpt,
      description: art.first.length > 158 ? `${art.first.slice(0, 155).replace(/\s+\S*$/, '')}…` : art.first,
      intro: art.intro,
      sections: art.sections,
    };
  });
  return cache;
}

export function getArticle(slug) {
  return getArticles().find((a) => a.slug === slug);
}
