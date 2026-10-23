import Link from 'next/link';

export default function NotFound() {
  return (
    <section style={{ padding: 'clamp(140px, 13vw, 190px) 0 clamp(60px, 8vw, 110px)', textAlign: 'center' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <h1 className="h1">Page introuvable</h1>
        <p className="lead">Cette page n'existe pas ou a été déplacée.</p>
        <Link className="btn btn-gold" href="/">Retour à l'accueil</Link>
      </div>
    </section>
  );
}
