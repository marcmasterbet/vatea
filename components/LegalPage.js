import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';

/**
 * Pages juridiques : le texte vit dans content/legal/<slug>.md (textes fournis par Hugo).
 * Pour modifier une page, il suffit d'éditer le fichier .md correspondant.
 * Syntaxe gérée : # titre, ## / ### sous-titres, paragraphes, listes « - », **gras**, _italique_, [lien](/url).
 * Des lignes qui se suivent sans ligne vide (ex. une adresse) restent sur des lignes séparées.
 */
export function lireTexteLegal(slug) {
  const md = fs.readFileSync(path.join(process.cwd(), 'content', 'legal', `${slug}.md`), 'utf8');
  const titre = (md.match(/^# (.+)$/m) || [])[1] || '';
  return { titre, md };
}

function slugifier(t) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function enLigne(texte, cle) {
  const morceaux = [];
  const re = /\*\*(.+?)\*\*|_(.+?)_|\[(.+?)\]\((.+?)\)/g;
  let dernier = 0, m, i = 0;
  while ((m = re.exec(texte))) {
    if (m.index > dernier) morceaux.push(texte.slice(dernier, m.index));
    const k = `${cle}-${i++}`;
    if (m[1]) morceaux.push(<strong key={k}>{m[1]}</strong>);
    else if (m[2]) morceaux.push(<em key={k}>{m[2]}</em>);
    else if (m[4].startsWith('/')) morceaux.push(<Link key={k} href={m[4]}>{m[3]}</Link>);
    else morceaux.push(<a key={k} href={m[4]} target="_blank" rel="noopener noreferrer">{m[3]}</a>);
    dernier = re.lastIndex;
  }
  if (dernier < texte.length) morceaux.push(texte.slice(dernier));
  return morceaux;
}

function rendre(md) {
  const blocs = md.replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocs.map((b, n) => {
    if (b.startsWith('# ')) return null; // le titre est rendu à part
    if (b.startsWith('### ')) return <h3 key={n} className="legal-h3">{enLigne(b.slice(4), n)}</h3>;
    if (b.startsWith('## ')) { const t = b.slice(3); return <h2 key={n} id={slugifier(t)} className="legal-h2">{enLigne(t, n)}</h2>; }
    const lignes = b.split('\n');
    if (lignes.every((l) => l.startsWith('- '))) {
      return <ul key={n} className="legal-liste">{lignes.map((l, j) => <li key={j}>{enLigne(l.slice(2), `${n}-${j}`)}</li>)}</ul>;
    }
    if (lignes.length === 1 && /^_.+_$/.test(b)) return <p key={n} className="legal-maj">{b.slice(1, -1)}</p>;
    return <p key={n}>{lignes.map((l, j) => <span key={j}>{j > 0 && <br />}{enLigne(l, `${n}-${j}`)}</span>)}</p>;
  });
}

export default function LegalPage({ slug }) {
  const { titre, md } = lireTexteLegal(slug);
  return (
    <section style={{ padding: 'clamp(120px, 11vw, 160px) 0 clamp(56px, 7vw, 98px)', background: 'linear-gradient(180deg, var(--prune) 0%, var(--noir) 360px)' }}>
      <div className="container" style={{ maxWidth: 840 }}>
        <span className="rule rule-lg" aria-hidden="true" />
        <h1 className="h1" style={{ marginBottom: 24 }}>{titre}</h1>
        <div className="legal">{rendre(md)}</div>
      </div>
    </section>
  );
}
