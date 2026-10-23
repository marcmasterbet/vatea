/** Encadré doré de fin de page : une ou deux phrases + bouton vers le formulaire. */
export default function CtaBox({ children, button }) {
  return (
    <section aria-label="Conclusion" style={{ paddingBottom: 'clamp(56px, 7vw, 98px)' }}>
      <div className="container">
        <div className="cta-box">
          {children}
          <a className="btn btn-gold btn-lg" href="#contact">{button}</a>
        </div>
      </div>
    </section>
  );
}
