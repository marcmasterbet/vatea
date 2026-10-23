import { NextResponse } from 'next/server';

const TYPES = { corporate: 'Vidéo corporate', publicite: 'Vidéo publicitaire', formation: 'Vidéo de formation', autre: 'Autre' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(v, max = 2000) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/**
 * Réception d'une demande de devis.
 * - validation côté serveur + champ piège anti-spam ;
 * - si CRM_URL et CRM_LEADS_KEY sont définis, création d'un prospect dans le CRM VATEA (crm.vatea.be) ;
 * - (ancienne option) DOLIBARR_URL et DOLIBARR_API_KEY pour Dolibarr ;
 * - sinon, la demande est journalisée (visible dans Vercel > Logs).
 * TODO : notification e-mail à Hugo et message de confirmation au prospect (service d'envoi à choisir).
 */
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }

  if (clean(body.site_web)) return NextResponse.json({ ok: true }); // robot : on ignore sans le signaler

  const d = {
    prenom: clean(body.prenom, 100),
    nom: clean(body.nom, 100),
    email: clean(body.email, 200),
    telephone: clean(body.telephone, 50),
    entreprise: clean(body.entreprise, 200),
    prestation: TYPES[clean(body.prestation, 20)] || '',
    besoin: clean(body.besoin, 4000),
    echeance: clean(body.echeance, 200),
    budget: clean(body.budget, 200),
    lien: clean(body.lien, 500),
    consentement: body.consentement === 'on' || body.consentement === true,
  };

  if (!d.prenom || !d.nom || !EMAIL_RE.test(d.email) || !d.prestation || !d.besoin) {
    return NextResponse.json({ error: 'Merci de compléter les champs obligatoires' }, { status: 422 });
  }
  if (!d.consentement) return NextResponse.json({ error: 'Le consentement est requis' }, { status: 422 });

  const recu = new Date().toISOString();
  const note = [
    `Demande de devis reçue via le site le ${recu}`,
    `Prestation : ${d.prestation}`,
    `Besoin : ${d.besoin}`,
    d.echeance && `Échéance : ${d.echeance}`,
    d.budget && `Budget indicatif : ${d.budget}`,
    d.lien && `Lien : ${d.lien}`,
    d.telephone && `Téléphone : ${d.telephone}`,
  ].filter(Boolean).join('\n');

  const { CRM_URL, CRM_LEADS_KEY, DOLIBARR_URL, DOLIBARR_API_KEY } = process.env;
  if (CRM_URL && CRM_LEADS_KEY) {
    // CRM VATEA (crm.vatea.be) : le prospect arrive dans la colonne « Nouveau »
    try {
      const res = await fetch(`${CRM_URL.replace(/\/$/, '')}/api/leads`, {
        method: 'POST',
        headers: { 'x-crm-key': CRM_LEADS_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`CRM HTTP ${res.status}`);
    } catch (err) {
      // Reprise manuelle possible : la demande complète reste dans les logs
      console.error('[devis] CRM indisponible', err.message, JSON.stringify(d));
    }
  } else if (DOLIBARR_URL && DOLIBARR_API_KEY) {
    try {
      const res = await fetch(`${DOLIBARR_URL.replace(/\/$/, '')}/api/index.php/thirdparties`, {
        method: 'POST',
        headers: { DOLAPIKEY: DOLIBARR_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: d.entreprise || `${d.prenom} ${d.nom}`,
          client: 2, // prospect
          code_client: '-1',
          email: d.email,
          phone: d.telephone,
          note_private: `Contact : ${d.prenom} ${d.nom}\n${note}`,
        }),
      });
      if (!res.ok) throw new Error(`CRM HTTP ${res.status}`);
    } catch (err) {
      // Reprise manuelle possible : la demande complète reste dans les logs
      console.error('[devis] CRM indisponible', err.message, JSON.stringify(d));
      return NextResponse.json({ ok: true });
    }
  } else {
    console.log('[devis]', JSON.stringify({ recu, ...d }));
  }

  return NextResponse.json({ ok: true });
}
