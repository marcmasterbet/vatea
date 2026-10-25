'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useState } from 'react';

/**
 * Bannière + panneau « Vos paramètres de cookies » (mêmes catégories que le site Wix actuel).
 * - Choix mémorisé 6 mois (politique de confidentialité § 12), puis redemandé.
 * - Google Analytics 4 n'est chargé que si NEXT_PUBLIC_GA_ID est renseigné sur Vercel,
 *   avec Consent Mode v2 : tout est refusé par défaut, mis à jour selon le choix du visiteur.
 * - Le lien « Paramètres des cookies » du pied de page rouvre ce panneau (événement vatea:cookies).
 */
const CLE = 'vatea-consentement';
const DUREE_MS = 182 * 24 * 3600 * 1000; // ≈ 6 mois
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

const CATEGORIES = [
  { k: 'statistiques', label: 'Statistiques cookies', aide: 'Mesure d’audience (pages vues, sources des visites) pour améliorer le site.' },
  { k: 'marketing', label: 'Marketing cookies', aide: 'Mesure des campagnes et de leurs conversions (ex. Google Ads).' },
  { k: 'preferences', label: 'Préférences cookies', aide: 'Mémorisation de vos préférences d’affichage et de certains contenus intégrés.' },
];

function lire() {
  try {
    const c = JSON.parse(localStorage.getItem(CLE) || 'null');
    if (c && c.le && Date.now() - new Date(c.le).getTime() < DUREE_MS) return c;
  } catch { /* stockage indisponible */ }
  return null;
}

function appliquerGoogle(c) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const v = (b) => (b ? 'granted' : 'denied');
  window.gtag('consent', 'update', {
    analytics_storage: v(c.statistiques),
    ad_storage: v(c.marketing),
    ad_user_data: v(c.marketing),
    ad_personalization: v(c.marketing),
    personalization_storage: v(c.preferences),
    functionality_storage: 'granted',
    security_storage: 'granted',
  });
}

export function ouvrirParametresCookies() {
  window.dispatchEvent(new Event('vatea:cookies'));
}

export default function CookieConsent() {
  const [choix, setChoix] = useState(null); // consentement enregistré
  const [banniere, setBanniere] = useState(false);
  const [panneau, setPanneau] = useState(false);
  const [edition, setEdition] = useState(false);
  const [details, setDetails] = useState(false);
  const [brouillon, setBrouillon] = useState({ statistiques: false, marketing: false, preferences: false });

  useEffect(() => {
    const c = lire();
    if (c) { setChoix(c); appliquerGoogle(c); } else setBanniere(true);
    const ouvrir = () => { const x = lire(); setChoix(x); setBrouillon(x || { statistiques: false, marketing: false, preferences: false }); setEdition(!x); setPanneau(true); };
    window.addEventListener('vatea:cookies', ouvrir);
    return () => window.removeEventListener('vatea:cookies', ouvrir);
  }, []);

  const enregistrer = useCallback((c) => {
    const x = { statistiques: !!c.statistiques, marketing: !!c.marketing, preferences: !!c.preferences, le: new Date().toISOString() };
    try { localStorage.setItem(CLE, JSON.stringify(x)); } catch { /* stockage indisponible */ }
    setChoix(x); setBanniere(false); setPanneau(false); setEdition(false);
    appliquerGoogle(x);
  }, []);

  const tout = (b) => enregistrer({ statistiques: b, marketing: b, preferences: b });
  const dateFr = choix ? new Date(choix.le).toLocaleString('fr-BE', { dateStyle: 'long', timeStyle: 'short' }) : '';

  return (
    <>
      {GA_ID && (
        <>
          <Script id="consent-defaut" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', personalization_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 });
            try { var c = JSON.parse(localStorage.getItem('${CLE}') || 'null'); if (c && Date.now() - new Date(c.le).getTime() < ${DUREE_MS}) { var v = function (b) { return b ? 'granted' : 'denied'; }; gtag('consent', 'update', { analytics_storage: v(c.statistiques), ad_storage: v(c.marketing), ad_user_data: v(c.marketing), ad_personalization: v(c.marketing), personalization_storage: v(c.preferences) }); } } catch (e) {}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}</Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      )}

      {banniere && !panneau && (
        <div className="cookies-banniere" role="dialog" aria-label="Cookies" aria-live="polite">
          <p>
            Nous utilisons des cookies pour mesurer l’audience du site et améliorer votre expérience. Vous pouvez accepter, refuser ou choisir par catégorie.{' '}
            <Link href="/politique-de-confidentialite#11-cookies">En savoir plus</Link>
          </p>
          <div className="cookies-actions">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => { setBrouillon({ statistiques: false, marketing: false, preferences: false }); setEdition(true); setPanneau(true); }}>Personnaliser</button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => tout(false)}>Tout refuser</button>
            <button type="button" className="btn btn-gold btn-small" onClick={() => tout(true)}>Tout accepter</button>
          </div>
        </div>
      )}

      {panneau && (
        <div className="cookies-voile" onClick={(e) => { if (e.target === e.currentTarget) setPanneau(false); }}>
          <div className="cookies-panneau" role="dialog" aria-modal="true" aria-labelledby="cookies-titre">
            <div className="cookies-tete">
              <h2 id="cookies-titre">Vos paramètres de cookies</h2>
              <button type="button" className="cookies-fermer" aria-label="Fermer" onClick={() => setPanneau(false)}>×</button>
            </div>
            <div className="cookies-corps">
              {!edition && choix ? (
                <>
                  <p className="cookies-etat">État actuel :</p>
                  <ul className="cookies-liste">
                    {CATEGORIES.map((c) => (
                      <li key={c.k} className={choix[c.k] ? 'oui' : 'non'}><span aria-hidden="true">{choix[c.k] ? '✓' : '✕'}</span>{c.label}<span className="sr">{choix[c.k] ? ' : acceptés' : ' : refusés'}</span></li>
                    ))}
                  </ul>
                  <button type="button" className="cookies-details" aria-expanded={details} onClick={() => setDetails(!details)}>{details ? 'Masquer les détails' : 'Afficher les détails'} <span aria-hidden="true">{details ? '⌃' : '⌄'}</span></button>
                  {details && <div className="cookies-date"><b>Date du dernier consentement :</b><span>{dateFr}</span></div>}
                  <div className="cookies-boutons">
                    <button type="button" className="btn btn-ghost" onClick={() => tout(false)}>Retirer le consentement</button>
                    <button type="button" className="btn btn-gold" onClick={() => { setBrouillon(choix); setEdition(true); }}>Modifier le consentement</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="cookies-intro">Les cookies essentiels au fonctionnement du site sont toujours actifs. Choisissez les autres catégories :</p>
                  <ul className="cookies-choix">
                    <li><div><b>Cookies essentiels</b><span>Fonctionnement technique et sécurité du site.</span></div><span className="cookies-toujours">Toujours actifs</span></li>
                    {CATEGORIES.map((c) => (
                      <li key={c.k}>
                        <div><b>{c.label}</b><span>{c.aide}</span></div>
                        <label className="interrupteur">
                          <input type="checkbox" checked={!!brouillon[c.k]} onChange={(e) => setBrouillon({ ...brouillon, [c.k]: e.target.checked })} />
                          <span aria-hidden="true" /><span className="sr">{c.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="cookies-boutons">
                    <button type="button" className="btn btn-ghost" onClick={() => tout(false)}>Tout refuser</button>
                    <button type="button" className="btn btn-gold" onClick={() => enregistrer(brouillon)}>Enregistrer mes choix</button>
                  </div>
                  <p className="cookies-lien"><Link href="/politique-de-confidentialite#11-cookies" onClick={() => setPanneau(false)}>Politique de confidentialité et cookies</Link></p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
