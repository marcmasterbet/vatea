/** Gabarit des pages légales, en attente du texte validé juridiquement. */
export default function LegalPage({ title }) {
  return (
    <section style={{ padding: 'clamp(120px, 11vw, 160px) 0 clamp(56px, 7vw, 98px)', background: 'linear-gradient(180deg, var(--prune) 0%, var(--noir) 360px)' }}>
      <div className="container" style={{ maxWidth: 840 }}>
        <span className="rule rule-lg" aria-hidden="true" />
        <h1 className="h1" style={{ marginBottom: 24 }}>{title}</h1>
        <p className="lead" style={{ color: 'var(--texte-2)' }}>[Contenu à rédiger et à faire valider selon le droit belge avant la mise en ligne officielle.]</p>
      </div>
    </section>
  );
}
