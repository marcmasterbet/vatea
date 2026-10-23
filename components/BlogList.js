'use client';

import Link from 'next/link';
import { useState } from 'react';
import Placeholder from './Placeholder';

const FILTERS = ['Tous', 'Corporate', 'Publicité', 'Formation'];

export default function BlogList({ articles }) {
  const [filter, setFilter] = useState('Tous');
  const shown = articles.filter((a) => filter === 'Tous' || a.category === filter);
  return (
    <>
      <div role="group" aria-label="Filtrer par thème" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 'clamp(28px, 3vw, 42px)' }}>
        {FILTERS.map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'clamp(18px, 2.2vw, 30px)' }}>
        {shown.map((a) => (
          <Link key={a.slug} href={`/blog/${a.slug}`} className="card">
            <Placeholder label="Image de l'article" ratio="16 / 9" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 22px 24px', flex: '1 1 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="tag">{a.category}</span>
                <span style={{ fontSize: 13, color: 'var(--texte-3)' }}>{a.readingTime}</span>
              </div>
              <h2 className="card-title">{a.title}</h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#bdbdbd' }}>{a.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
