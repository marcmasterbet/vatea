'use client';

import { useState } from 'react';
import { CTA_DEVIS } from '@/lib/site';

const TYPES = [
  { value: 'corporate', label: 'Corporate' },
  { value: 'publicite', label: 'Publicité' },
  { value: 'formation', label: 'Formation' },
  { value: 'autre', label: 'Autre' },
];

export default function DevisForm() {
  const [type, setType] = useState('');
  const [typeError, setTypeError] = useState(false);
  const [more, setMore] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (!type) { setTypeError(true); return; }
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    data.prestation = type;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/devis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Envoi impossible');
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '36px 8px', textAlign: 'center' }}>
        <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--or)', color: 'var(--noir)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <p style={{ fontSize: 21, fontWeight: 800 }}>Merci, votre demande a bien été envoyée.</p>
        <p style={{ maxWidth: 420, fontSize: 15, lineHeight: 1.6, color: 'var(--texte-2)' }}>[Message de confirmation à valider avec le copywriter]</p>
        <button className="btn btn-ghost" type="button" onClick={() => { setStatus('idle'); setType(''); setMore(false); }}>Envoyer une autre demande</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate={false}>
      <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
        <legend style={{ padding: 0, marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--or)' }}>Quel type de vidéo ? *</legend>
        <div role="radiogroup" aria-label="Type de prestation" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TYPES.map((t) => (
            <button key={t.value} type="button" role="radio" className="pill" aria-checked={type === t.value} onClick={() => { setType(t.value); setTypeError(false); }}>
              {t.label}
            </button>
          ))}
        </div>
        {typeError && <p role="alert" style={{ marginTop: 10, fontSize: 13, color: '#f0b4a0' }}>Choisissez un type de vidéo.</p>}
      </fieldset>

      <div className="form-grid">
        <label className="f-label">Prénom *<input className="field" type="text" name="prenom" autoComplete="given-name" required /></label>
        <label className="f-label">Nom *<input className="field" type="text" name="nom" autoComplete="family-name" required /></label>
        <label className="f-label">E-mail *<input className="field" type="email" name="email" autoComplete="email" required /></label>
        <label className="f-label">Téléphone<input className="field" type="tel" name="telephone" autoComplete="tel" /></label>
        <label className="f-label span-all">Entreprise<input className="field" type="text" name="entreprise" autoComplete="organization" /></label>
        <label className="f-label span-all">Votre besoin *<textarea className="field" name="besoin" rows={2} required /></label>
      </div>

      <div>
        <button className="more" type="button" aria-expanded={more} onClick={() => setMore((v) => !v)}>
          <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--or)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${more ? 45 : 0}deg)`, transition: 'transform .25s ease' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </span>
          Préciser mon projet (facultatif)
        </button>
        {more && (
          <div className="form-grid" style={{ marginTop: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <label className="f-label">Échéance souhaitée<input className="field" type="text" name="echeance" /></label>
            <label className="f-label">Budget indicatif<input className="field" type="text" name="budget" /></label>
            <label className="f-label">Lien utile<input className="field" type="url" name="lien" placeholder="https://" /></label>
          </div>
        )}
      </div>

      {/* Champ piège anti-spam : invisible pour les humains */}
      <div className="hp" aria-hidden="true">
        <label>Ne pas remplir<input type="text" name="site_web" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, lineHeight: 1.45, color: '#d2d2d2', cursor: 'pointer' }}>
        <input type="checkbox" name="consentement" required style={{ width: 18, height: 18, margin: '2px 0 0', flex: '0 0 auto', accentColor: 'var(--or)' }} />
        <span>[Texte de consentement RGPD à valider] — j'accepte que mes données soient utilisées pour traiter ma demande. <a href="/politique-de-confidentialite">Politique de confidentialité</a></span>
      </label>

      {status === 'error' && <p role="alert" style={{ fontSize: 13, color: '#f0b4a0' }}>{error}. Réessayez ou écrivez-nous directement.</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <span style={{ fontSize: 12, color: '#a5a5a5' }}>* Champs obligatoires</span>
        <button className="btn btn-gold" type="submit" disabled={status === 'sending'} style={{ minHeight: 44, padding: '0 22px', fontSize: 14 }}>
          {status === 'sending' ? 'Envoi…' : CTA_DEVIS}
        </button>
      </div>
    </form>
  );
}
