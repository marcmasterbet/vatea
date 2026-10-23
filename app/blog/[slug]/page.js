import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconChevron } from '@/components/Icons';
import Placeholder from '@/components/Placeholder';
import { getArticle, getArticles } from '@/lib/blog';
import { CTA_DEVIS, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { type: 'article', title: a.title, description: a.description },
  };
}

function Paragraph({ segs, className }) {
  return (
    <p className={className}>
      {segs.map((s, i) => (s.em ? <em key={i}>{s.text}</em> : <span key={i}>{s.text}</span>))}
    </p>
  );
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const all = getArticles();
  let related = all.filter((x) => x.category === a.category && x.slug !== a.slug).slice(0, 3);
  if (related.length < 3) related = related.concat(all.filter((x) => x.category !== a.category).slice(0, 3 - related.length));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.description,
    author: { '@type': 'Person', name: 'Hugo Elvira' },
    publisher: { '@type': 'Organization', name: 'VATEA' },
    mainEntityOfPage: `${SITE_URL}/blog/${a.slug}`,
    inLanguage: 'fr-BE',
  };
  const last = a.sections.length - 1;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article aria-labelledby="titre-article" style={{ padding: 'clamp(110px, 10vw, 150px) 0 clamp(36px, 4vw, 56px)', background: 'linear-gradient(180deg, var(--prune) 0%, var(--noir) 420px)' }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            <IconChevron size={16} dir="left" /> Tous les articles
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '20px 0 16px' }}>
            <span className="tag">{a.category}</span>
            <span style={{ fontSize: 14, color: 'var(--texte-3)' }}>{a.readingTime}</span>
          </div>
          <h1 id="titre-article" className="h1" style={{ marginBottom: 30 }}>{a.title}</h1>
        </div>
        <div className="container" style={{ maxWidth: 1080, marginBottom: 40 }}>
          <Placeholder label="Image principale de l'article" framed ratio="21 / 9" />
        </div>
        <div className="container prose" style={{ maxWidth: 840 }}>
          <div className="intro">{a.intro.map((p, i) => <Paragraph key={i} segs={p} />)}</div>
          {a.sections.map((s, i) => (
            <div key={s.heading} className={i === last ? 'last' : undefined}>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, j) => <Paragraph key={j} segs={p} />)}
            </div>
          ))}
        </div>
      </article>

      <section aria-label="Demande de devis" style={{ paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          <div className="cta-box"><a className="btn btn-gold btn-lg" href="#contact">{CTA_DEVIS}</a></div>
        </div>
      </section>

      <section aria-labelledby="titre-similaires" style={{ paddingBottom: 'clamp(56px, 7vw, 98px)' }}>
        <div className="container">
          <h2 id="titre-similaires" style={{ marginBottom: 26, fontSize: 'clamp(21px, 2vw, 27px)', fontWeight: 800 }}>Articles similaires</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'clamp(18px, 2.2vw, 30px)' }}>
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 22px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span className="tag">{r.category}</span>
                    <span style={{ fontSize: 13, color: 'var(--texte-3)' }}>{r.readingTime}</span>
                  </div>
                  <h3 className="card-title" style={{ fontSize: 18 }}>{r.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
