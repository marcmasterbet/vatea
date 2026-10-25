/* VATEA — démonstration du CRM (données fictives, enregistrées dans ce navigateur uniquement).
   Version 3 (25/10/2026), décisions de la réunion :
   - Hugo passe par une coopérative qui lui verse l'argent dès la signature du devis et gère factures et relances ;
   - commission = 16 % du HT signé (JEGO / Jeff) et 9 % du HT signé (EI BRETZNER MARC / Marc), acquise à la signature ;
   - pas d'acompte : le client paie l'intégralité ; Hugo est crédité sur son compte coopérateur (aucun justificatif) ;
   - la coopérative paie JEGO et EI BRETZNER MARC sur facture, une facture par devis :
     chaque bénéficiaire déclare sa facture (montant calculé, n°, date) puis confirme lui-même qu'il a été payé (ligne figée ensuite) ;
   - Jeff a le même accès qu'Hugo ; Marc consulte ; l'administrateur gère les comptes ;
   - pas de retour en arrière dans le pipeline (réactivation d'un perdu, correction tracée par l'admin) ;
   - paiements clients = simple suivi pour Hugo ; documents téléchargeables dans chaque fiche. */
(function () {
  'use strict';

  var CLE = 'vatea-demo-crm-v3';
  var TAUX_J = 0.16, TAUX_M = 0.09;
  var TAILLE_MAX = 10 * 1024 * 1024;

  var ETAPES = [
    { id: 'nouveau', label: 'Nouveau', c: '#e2c68f' },
    { id: 'contacte', label: 'Contacté', c: '#7cc4d8' },
    { id: 'rdv', label: 'RDV / brief', c: '#b79cf0' },
    { id: 'devis_envoye', label: 'Devis envoyé', c: '#e8a15a' },
    { id: 'devis_signe', label: 'Devis signé', c: '#a3d977' },
    { id: 'facture', label: 'Facturé', c: '#6aa8f0' },
    { id: 'paye', label: 'Payé', c: '#3ecf8e' },
    { id: 'perdu', label: 'Perdu', c: '#7a7a7a' }
  ];
  var ETAPE = {};
  ETAPES.forEach(function (e, i) { e.rang = i; ETAPE[e.id] = e; });

  var SOURCES = ['Formulaire du site', 'Apport JEGO', 'Apport EI BRETZNER MARC', 'Recommandation', 'Réseau / LinkedIn / Instagram', 'Salon / événement', 'Prospection de Hugo', 'Campagne e-mail', 'Autre'];
  var TYPES_VIDEO = ['Vidéo corporate', 'Vidéo publicitaire', 'Vidéo de formation', 'Autre'];
  var TYPES_PREUVE = ['Devis signé (PDF)', 'Bon de commande', 'Contrat', 'Accord par e-mail', 'Signature électronique'];
  var TYPES_DOC = ['Devis', 'Facture', 'Preuve de signature', 'Bon de commande / contrat', 'Autre'];
  var ROLES = { admin: 'Administrateur', gerant: 'Gérant', commercial: 'Commercial', controle: 'Consultation' };

  /* ───────────── Outils ───────────── */
  function z(n) { return String(n).padStart(2, '0'); }
  function auj(decalage) { var t = new Date(); t.setDate(t.getDate() + (decalage || 0)); return t.getFullYear() + '-' + z(t.getMonth() + 1) + '-' + z(t.getDate()); }
  function maintenant() { var t = new Date(); return auj() + ' ' + z(t.getHours()) + ':' + z(t.getMinutes()); }
  function r2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
  var F0 = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var F2 = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });
  function eur0(v) { return v == null || v === '' ? '—' : F0.format(v); }
  function eur(v) { return v == null || v === '' ? '—' : F2.format(v); }
  function dfr(s) { if (!s) return '—'; var p = s.slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function dheure(s) { return s ? dfr(s) + s.slice(10) : '—'; }
  function dcourt(s) { return s ? new Date(s + 'T00:00:00').toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' }) : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function initiales(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (m) { return m[0].toUpperCase(); }).join('') || '?'; }
  function plus12mois(d) { var p = d.split('-').map(Number); return (p[0] + 1) + '-' + z(p[1]) + '-' + z(p[2]); }
  function moisLabel(m) { var p = m.split('-'); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' }); }
  function taille(o) { return o < 1024 ? o + ' o' : o < 1048576 ? Math.round(o / 1024) + ' Ko' : (o / 1048576).toFixed(1).replace('.', ',') + ' Mo'; }
  var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  function motDePasse() {
    var a = new Uint32Array(12); crypto.getRandomValues(a);
    var s = Array.prototype.map.call(a, function (n) { return ALPHABET[n % ALPHABET.length]; }).join('');
    return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12);
  }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ───────────── Fichiers (IndexedDB : les documents restent téléchargeables) ───────────── */
  var fichiers = (function () {
    var promesse = null;
    function base() {
      if (!promesse) promesse = new Promise(function (ok, ko) {
        try {
          var r = indexedDB.open('vatea-demo-crm-fichiers', 1);
          r.onupgradeneeded = function () { r.result.createObjectStore('f'); };
          r.onsuccess = function () { ok(r.result); };
          r.onerror = function () { ko(r.error); };
        } catch (e) { ko(e); }
      });
      return promesse;
    }
    function op(mode, fn) { return base().then(function (db) { return new Promise(function (ok, ko) { var t = db.transaction('f', mode); var r = fn(t.objectStore('f')); t.oncomplete = function () { ok(r && r.result); }; t.onerror = function () { ko(t.error); }; }); }); }
    return {
      mettre: function (k, blob) { return op('readwrite', function (s) { return s.put(blob, k); }); },
      lire: function (k) { return op('readonly', function (s) { return s.get(k); }); },
      supprimer: function (k) { return op('readwrite', function (s) { return s.delete(k); }); },
      vider: function () { return op('readwrite', function (s) { return s.clear(); }); }
    };
  })();
  /** Petit PDF lisible pour les documents d'exemple des données de départ. */
  function pdfExemple(titre, lignes) {
    var txt = [titre].concat(lignes || []).map(function (l, i) {
      var s = String(l).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '?').replace(/([()\\])/g, '\\$1');
      return 'BT /F1 ' + (i ? 12 : 18) + ' Tf 60 ' + (760 - i * 26) + ' Td (' + s + ') Tj ET';
    }).join('\n');
    var objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      '<< /Length ' + txt.length + ' >>\nstream\n' + txt + '\nendstream', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    var out = '%PDF-1.4\n', pos = [];
    objs.forEach(function (o, i) { pos.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    var x = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + pos.map(function (p) { return String(p).padStart(10, '0') + ' 00000 n \n'; }).join('') +
      'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
    return new Blob([out], { type: 'application/pdf' });
  }

  /* ───────────── Données fictives de départ ───────────── */
  function etatInitial() {
    var P = function (o) {
      return Object.assign({ contact: '', email: '', telephone: '', siteWeb: '', typeVideo: '', montantEstime: null, sourceVerrouillee: false,
        responsable: 'hugo', relance: '', notes: '', raisonPerte: '', devis: null, avenants: [], annulation: null, paiementClient: null,
        etapeAvantPerte: null, campagneLe: null, creeLe: '2026-10-01' }, o);
    };
    var D = function (id, pid, nom, type, le, auteur, lignes) { return { id: id, pid: pid, nom: nom, type: type, taille: 2400, mime: 'application/pdf', le: le, auteur: auteur, exemple: lignes }; };
    return {
      v: 3,
      session: null,
      miseEnLigne: '2026-03-01',
      comptes: [
        { id: 'admin', nom: 'Administrateur', societe: 'EI BRETZNER MARC', role: 'admin', actif: true, provisoire: false, derniere: '' },
        { id: 'hugo', nom: 'Hugo Elvira', societe: 'VATEA', role: 'gerant', actif: true, provisoire: false, derniere: '' },
        { id: 'jeff', nom: 'Jeff Framarin', societe: 'SASU JEGO', role: 'gerant', actif: true, provisoire: false, derniere: '' },
        { id: 'marc', nom: 'Marc Bretzner', societe: 'EI BRETZNER MARC', role: 'controle', actif: true, provisoire: false, derniere: '' }
      ],
      prospects: [
        P({ id: 1, entreprise: 'Clinique Sud (fictif)', contact: 'Dr Sarah Lemaire', email: 'contact@clinique-sud.example', telephone: '+32 2 555 01 10', typeVideo: 'Vidéo de formation', source: 'Formulaire du site', etape: 'nouveau', relance: auj(1), creeLe: '2026-10-21', notes: 'Demande reçue via vatea.be : modules de formation pour le personnel soignant.' }),
        P({ id: 2, entreprise: 'Brasserie du Canal (fictif)', contact: 'Claire Dumont', email: 'claire@brasserie-canal.example', telephone: '+32 470 55 02 20', typeVideo: 'Vidéo publicitaire', montantEstime: 3200, source: 'Formulaire du site', etape: 'nouveau', relance: auj(0), creeLe: '2026-10-19', notes: 'Spot pour les réseaux sociaux avant l’ouverture de la terrasse.' }),
        P({ id: 3, entreprise: 'Atelier Verhaegen (fictif)', contact: 'Tom Verhaegen', email: 'tom@verhaegen.example', telephone: '+32 476 55 03 30', typeVideo: 'Vidéo corporate', montantEstime: 6800, source: 'Apport JEGO', etape: 'contacte', relance: auj(-2), creeLe: '2026-10-08' }),
        P({ id: 4, entreprise: 'Lumen Architectes (fictif)', contact: 'Julien Masson', email: 'j.masson@lumen.example', telephone: '+32 2 555 04 40', typeVideo: 'Vidéo corporate', montantEstime: 5400, source: 'Recommandation', etape: 'rdv', relance: auj(3), creeLe: '2026-10-02' }),
        P({ id: 5, entreprise: 'Groupe Mosane (fictif)', contact: 'Pierre Collard', email: 'p.collard@mosane.example', telephone: '+32 4 555 05 50', typeVideo: 'Vidéo de formation', source: 'Apport EI BRETZNER MARC', sourceVerrouillee: true, etape: 'devis_envoye', relance: auj(4), creeLe: '2026-09-25',
          devis: { ref: 'DEV-2026-014', dateEnvoi: '2026-10-15', montantHt: 14800 } }),
        P({ id: 11, entreprise: 'Domaine des Hautes Fagnes (fictif)', contact: 'Élise Gérard', email: 'elise@hautes-fagnes.example', telephone: '+32 80 55 11 10', typeVideo: 'Vidéo publicitaire', source: 'Salon / événement', sourceVerrouillee: true, etape: 'devis_envoye', relance: auj(-1), creeLe: '2026-09-30',
          devis: { ref: 'DEV-2026-016', dateEnvoi: '2026-10-18', montantHt: 7300 } }),
        P({ id: 6, entreprise: 'Nordtech Solutions (fictif)', contact: 'Kevin Peeters', email: 'k.peeters@nordtech.example', telephone: '+32 3 555 06 60', typeVideo: 'Vidéo corporate', source: 'Réseau / LinkedIn / Instagram', sourceVerrouillee: true, etape: 'devis_signe', creeLe: '2026-09-10',
          devis: { ref: 'DEV-2026-011', dateEnvoi: '2026-09-22', montantHt: 2500, dateSignature: '2026-10-01', typePreuve: 'Contrat', docPreuve: null }, notes: 'Contrat signé, fichier de preuve pas encore joint.' }),
        P({ id: 7, entreprise: 'Campus Formation (fictif)', contact: 'Nora Benali', email: 'nora@campus-formation.example', telephone: '+32 81 55 07 70', typeVideo: 'Vidéo de formation', source: 'Formulaire du site', sourceVerrouillee: true, etape: 'facture', creeLe: '2026-08-28',
          devis: { ref: 'DEV-2026-009', dateEnvoi: '2026-09-04', montantHt: 4500, dateSignature: '2026-09-15', typePreuve: 'Bon de commande', docPreuve: 'd2' } }),
        P({ id: 8, entreprise: 'Laboratoire Exemple (fictif)', contact: 'Prof. Anne Gilson', email: 'a.gilson@labo.example', telephone: '+32 10 55 08 80', typeVideo: 'Vidéo corporate', source: 'Recommandation', sourceVerrouillee: true, etape: 'paye', creeLe: '2026-03-20',
          devis: { ref: 'DEV-2026-003', dateEnvoi: '2026-03-30', montantHt: 6000, dateSignature: '2026-04-10', typePreuve: 'Devis signé (PDF)', docPreuve: 'd1' },
          avenants: [{ id: 'av1', ref: 'AVN-2026-003-1', date: '2026-06-05', montantHt: 1800, typePreuve: 'Accord par e-mail', docPreuve: 'd3', objet: 'Déclinaison réseaux sociaux' }],
          paiementClient: { date: '2026-06-15', par: 'Hugo Elvira' }, notes: 'Film institutionnel 3 min + avenant pour la déclinaison réseaux sociaux.' }),
        P({ id: 9, entreprise: 'Boulangerie Lefèvre (fictif)', contact: 'Anne Lefèvre', email: 'anne@lefevre.example', telephone: '+32 2 555 09 90', typeVideo: 'Vidéo publicitaire', source: 'Prospection de Hugo', sourceVerrouillee: true, etape: 'paye', creeLe: '2026-01-15',
          devis: { ref: 'DEV-2026-001', dateEnvoi: '2026-01-28', montantHt: 3000, dateSignature: '2026-02-10', typePreuve: 'Devis signé (PDF)', docPreuve: 'd4' },
          paiementClient: { date: '2026-03-05', par: 'Hugo Elvira' }, notes: 'Signé avant la mise en ligne : pas de commission (§ 10).' }),
        P({ id: 10, entreprise: 'Studio Kiné Namur (fictif)', contact: 'Lucas Martin', email: 'lucas@kine-namur.example', typeVideo: 'Vidéo de formation', source: 'Formulaire du site', etape: 'perdu', etapeAvantPerte: 'contacte', raisonPerte: 'Budget reporté à 2027', creeLe: '2026-09-02' })
      ],
      documents: [
        D('d1', 8, 'devis-DEV-2026-003-signe.pdf', 'Preuve de signature', '2026-04-10 16:20', 'Hugo Elvira', ['Devis DEV-2026-003 signe', 'Laboratoire Exemple (fictif)', 'Montant : 6 000,00 EUR HT', 'Document fictif - demonstration VATEA']),
        D('d2', 7, 'bon-de-commande-campus.pdf', 'Preuve de signature', '2026-09-15 11:05', 'Hugo Elvira', ['Bon de commande - DEV-2026-009', 'Campus Formation (fictif)', 'Montant : 4 500,00 EUR HT', 'Document fictif - demonstration VATEA']),
        D('d3', 8, 'accord-avenant-reseaux-sociaux.pdf', 'Preuve de signature', '2026-06-05 09:40', 'Hugo Elvira', ['Avenant AVN-2026-003-1', 'Declinaison reseaux sociaux : 1 800,00 EUR HT', 'Document fictif - demonstration VATEA']),
        D('d4', 9, 'devis-DEV-2026-001-signe.pdf', 'Preuve de signature', '2026-02-10 14:00', 'Hugo Elvira', ['Devis DEV-2026-001 signe', 'Boulangerie Lefevre (fictif)', 'Document fictif - demonstration VATEA']),
        D('d5', 7, 'facture-cooperative-FC-2026-118.pdf', 'Facture', '2026-09-20 10:00', 'Hugo Elvira', ['Facture de la cooperative FC-2026-118', 'Campus Formation (fictif)', 'Document fictif - demonstration VATEA'])
      ],
      comPayee: {
        'devis-8': { j: { date: '2026-05-10', par: 'Jeff Framarin' }, m: { date: '2026-05-20', par: 'Marc Bretzner' } }
      },
      comFacture: {
        'devis-8': { j: { num: 'JEGO-2026-004', date: '2026-04-30', par: 'Jeff Framarin' }, m: { num: 'MB-2026-011', date: '2026-05-02', par: 'Marc Bretzner' } }
      },
      journal: [
        { le: '2026-10-21 09:14', auteur: 'Site web', action: 'Demande de devis reçue', pid: 1, details: 'Vidéo de formation' },
        { le: '2026-10-19 16:02', auteur: 'Site web', action: 'Demande de devis reçue', pid: 2, details: 'Vidéo publicitaire' },
        { le: '2026-10-01 15:05', auteur: 'Hugo Elvira', action: 'Devis signé', pid: 6, details: 'DEV-2026-011 — 2 500,00 € HT — preuve : contrat (fichier à joindre)' },
        { le: '2026-09-20 10:02', auteur: 'Hugo Elvira', action: 'Facture envoyée par la coopérative', pid: 7, details: '' },
        { le: '2026-09-15 11:05', auteur: 'Hugo Elvira', action: 'Devis signé', pid: 7, details: 'DEV-2026-009 — 4 500,00 € HT — preuve : bon de commande' },
        { le: '2026-06-15 08:30', auteur: 'Hugo Elvira', action: 'Le client a payé', pid: 8, details: 'Paiement reçu le 15/06/2026' },
        { le: '2026-05-20 18:10', auteur: 'Marc Bretzner', action: 'Commission reçue (Marc 9 % du HT)', pid: 8, details: 'DEV-2026-003 — 540,00 €' },
        { le: '2026-05-10 12:00', auteur: 'Jeff Framarin', action: 'Commission reçue (JEGO 16 % du HT)', pid: 8, details: 'DEV-2026-003 — 960,00 €' }
      ],
      seq: { p: 12 }
    };
  }

  /* ───────────── État ───────────── */
  var S;
  function charger() {
    try {
      var t = localStorage.getItem(CLE);
      if (t) {
        var o = JSON.parse(t);
        if (o && o.v === 3) {
          o.comFacture = o.comFacture || {};
          // Rattrapage : une preuve ajoutée depuis l'onglet Documents n'était pas reliée au devis
          var utilises = {};
          o.prospects.forEach(function (p) { if (p.devis && p.devis.docPreuve) utilises[p.devis.docPreuve] = 1; (p.avenants || []).forEach(function (a) { if (a.docPreuve) utilises[a.docPreuve] = 1; }); });
          o.prospects.forEach(function (p) {
            var libres = o.documents.filter(function (d) { return d.pid === p.id && !utilises[d.id] && /preuve|contrat/i.test(d.type); });
            var cibles = [];
            if (p.devis && p.devis.dateSignature && !p.devis.docPreuve) cibles.push(p.devis);
            (p.avenants || []).forEach(function (a) { if (!a.docPreuve) cibles.push(a); });
            cibles.forEach(function (c) { var d = libres.shift(); if (d) { c.docPreuve = d.id; utilises[d.id] = 1; } });
          });
          return o;
        }
      }
    } catch (e) { /* stockage indisponible */ }
    return etatInitial();
  }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(S)); } catch (e) { /* démo sans sauvegarde */ } }
  S = charger();
  try { localStorage.removeItem('vatea-demo-crm-v2'); } catch (e) { /* ancienne version de la démo */ }

  var ui = { vue: 'pipeline', mode: 'kanban', q: '', source: '', perduOuvert: false, mois: '', fiche: null, resteSeulement: false, etapeListe: '', page: 1 };
  var LIMITE_COLONNE = 25, PAR_PAGE = 100;
  try { ui.mode = localStorage.getItem(CLE + '-mode') || 'kanban'; } catch (e) { /* */ }

  function moi() { return S.comptes.find(function (c) { return c.id === S.session; }); }
  function ecriture() { var m = moi(); return m && (m.role === 'gerant' || m.role === 'commercial' || m.role === 'admin'); }
  function estAdmin() { var m = moi(); return m && m.role === 'admin'; }
  function fin() { return plus12mois(S.miseEnLigne); }
  function finIncluse() { var t = new Date(fin() + 'T00:00:00'); t.setDate(t.getDate() - 1); return t.getFullYear() + '-' + z(t.getMonth() + 1) + '-' + z(t.getDate()); }
  function prospect(id) { return S.prospects.find(function (p) { return p.id === Number(id); }); }
  function doc(id) { return S.documents.find(function (d) { return d.id === id; }); }
  function journaliser(action, pid, details, auteur) {
    var m = moi();
    S.journal.unshift({ le: maintenant(), auteur: auteur || (m ? m.nom : 'Système'), action: action, pid: pid || null, details: details || '' });
  }
  function eligibilite(p) {
    var d = p && p.devis && p.devis.dateSignature;
    if (!d) return { ok: false, raison: 'Devis non signé' };
    if (d < S.miseEnLigne) return { ok: false, raison: 'Signé avant la mise en ligne' };
    if (d >= fin()) return { ok: false, raison: 'Signé après la période' };
    return { ok: true, raison: 'Éligible' };
  }
  function htSigne(p) { if (!p.devis || !p.devis.dateSignature) return 0; return r2(p.devis.montantHt + (p.avenants || []).reduce(function (t, a) { return t + a.montantHt; }, 0)); }

  /* ───────────── Commissions : une ligne par devis signé, avenant ou annulation ───────────── */
  function lignesCommission() {
    var L = [];
    S.prospects.forEach(function (p) {
      if (!p.devis || !p.devis.dateSignature) return;
      var el = eligibilite(p);
      L.push({ id: 'devis-' + p.id, p: p, type: 'Devis', ref: p.devis.ref, date: p.devis.dateSignature, ht: p.devis.montantHt, preuve: p.devis.docPreuve, el: el });
      (p.avenants || []).forEach(function (a) { L.push({ id: 'avenant-' + a.id, p: p, type: 'Avenant', ref: a.ref, date: a.date, ht: a.montantHt, preuve: a.docPreuve, el: el, objet: a.objet }); });
      if (p.annulation) L.push({ id: 'annulation-' + p.id, p: p, type: 'Annulation', ref: p.devis.ref, date: p.annulation.date, ht: -p.annulation.montantHt, preuve: 'sans-objet', el: el, objet: p.annulation.raison });
    });
    L.forEach(function (l) {
      l.j = l.el.ok ? r2(l.ht * TAUX_J) : 0;
      l.m = l.el.ok ? r2(l.ht * TAUX_M) : 0;
      var st = S.comPayee[l.id] || {};
      l.payeJ = st.j || null; l.payeM = st.m || null;
      var fa = S.comFacture[l.id] || {};
      l.factJ = fa.j || null; l.factM = fa.m || null;
      l.preuveOk = l.preuve === 'sans-objet' || !!(l.preuve && doc(l.preuve));
    });
    return L.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  function totaux(L, cle) {
    var t = { paye: 0, aPayer: 0, sansPreuve: 0, facture: 0, aFacturer: 0 };
    L.forEach(function (l) {
      if (!l.el.ok) return;
      var montant = l[cle], paye = cle === 'j' ? l.payeJ : l.payeM, fact = cle === 'j' ? l.factJ : l.factM;
      if (paye) t.paye = r2(t.paye + montant);
      else {
        t.aPayer = r2(t.aPayer + montant);
        if (fact) t.facture = r2(t.facture + montant); else if (l.preuveOk) t.aFacturer = r2(t.aFacturer + montant); else t.sansPreuve = r2(t.sansPreuve + montant);
      }
    });
    t.total = r2(t.paye + t.aPayer);
    return t;
  }
  function devisEnvoyesHt() { return r2(S.prospects.filter(function (p) { return p.etape === 'devis_envoye' && p.devis && !p.devis.dateSignature; }).reduce(function (t, p) { return t + p.devis.montantHt; }, 0)); }
  function alertesPreuve() {
    return lignesCommission().filter(function (l) { return l.el.ok && !l.preuveOk; }).map(function (l) {
      return { titre: 'Preuve de signature manquante', texte: l.p.entreprise + ' — ' + l.type.toLowerCase() + ' ' + l.ref + ' signé le ' + dfr(l.date) + ' (' + eur0(l.ht) + ' HT). La commission ne pourra être confirmée payée qu’une fois la preuve jointe par Hugo ou Jeff.', pid: l.p.id };
    });
  }

  /* ───────────── Toast ───────────── */
  var toastTimer;
  function toast(t, err) {
    var el = document.getElementById('toast');
    el.innerHTML = '<div class="toast' + (err ? ' err' : '') + '" role="status">' + esc(t) + '</div>';
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.innerHTML = ''; }, 4500);
  }

  /* ───────────── Fenêtres de saisie ───────────── */
  var o_apres = null;
  function champHtml(c) {
    var id = 'm-' + c.k, req = c.req ? ' required' : '', v = c.val == null ? '' : c.val;
    if (c.type === 'checks') return '<fieldset class="cases"><legend class="lbl">' + esc(c.label) + '</legend>' + c.options.map(function (o) {
      return '<label class="case"><input type="checkbox" name="' + c.k + '" value="' + esc(o.v) + '"' + (o.checked ? ' checked' : '') + ' /><span>' + o.label + '</span></label>';
    }).join('') + '</fieldset>';
    var lbl = '<label class="lbl" for="' + id + '">' + esc(c.label) + (c.req ? ' *' : '') + '</label>', input;
    if (c.type === 'select') input = '<select class="champ" id="' + id + '" name="' + c.k + '"' + req + '><option value="">Choisir…</option>' + c.options.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    else if (c.type === 'textarea') input = '<textarea class="champ" id="' + id + '" name="' + c.k + '"' + req + '>' + esc(v) + '</textarea>';
    else if (c.type === 'file') input = '<input class="champ fichier-champ" type="file" id="' + id + '" name="' + c.k + '" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"' + req + ' />';
    else input = '<input class="champ" id="' + id + '" name="' + c.k + '" type="' + (c.type || 'text') + '" value="' + esc(v) + '"' + (c.max ? ' max="' + c.max + '"' : '') + (c.min ? ' min="' + c.min + '"' : '') + (c.mode ? ' inputmode="' + c.mode + '"' : '') + req + ' />';
    return '<div>' + lbl + input + (c.aide ? '<p class="aide">' + c.aide + '</p>' : '') + '</div>';
  }
  function ouvrirModale(o) {
    var champs = o.champs || [], html = '', i = 0;
    while (i < champs.length) {
      if (champs[i].demi && champs[i + 1] && champs[i + 1].demi) { html += '<div class="grille2">' + champHtml(champs[i]) + champHtml(champs[i + 1]) + '</div>'; i += 2; }
      else { html += champHtml(champs[i]); i += 1; }
    }
    document.getElementById('modale').insertAdjacentHTML('beforeend',
      '<div class="modale-voile" data-modale><form class="modale" role="dialog" aria-modal="true" aria-label="' + esc(o.titre) + '" novalidate>' +
      '<h3>' + esc(o.titre) + '</h3>' + (o.texte ? '<p>' + o.texte + '</p>' : '') + html +
      '<p class="erreur" hidden></p><div class="actions"><button type="button" class="btn" data-act="modale-annuler">' + (o.bouton ? 'Annuler' : 'Fermer') + '</button>' +
      (o.bouton ? '<button class="btn btn-or">' + esc(o.bouton) + '</button>' : '') + '</div></form></div>');
    var f = document.querySelector('[data-modale]:last-child form');
    var premier = f.querySelector('input:not([type=file]):not([type=checkbox]), select, textarea');
    if (premier) premier.focus();
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = {}, fichiersChoisis = {}, manque = null;
      champs.forEach(function (c) {
        if (c.type === 'checks') { v[c.k] = Array.prototype.filter.call(f.querySelectorAll('input[name="' + c.k + '"]'), function (x) { return x.checked; }).map(function (x) { return x.value; }); return; }
        var el = f.elements[c.k];
        if (c.type === 'file') { fichiersChoisis[c.k] = el.files && el.files[0] ? el.files[0] : null; v[c.k] = fichiersChoisis[c.k] ? fichiersChoisis[c.k].name : ''; }
        else v[c.k] = el.value.trim();
        if (c.req && !v[c.k] && !manque) manque = c.label;
      });
      var p = f.querySelector('.erreur');
      var trop = Object.keys(fichiersChoisis).find(function (k) { return fichiersChoisis[k] && fichiersChoisis[k].size > TAILLE_MAX; });
      var err = manque ? 'Champ obligatoire : ' + manque + '.' : trop ? 'Fichier trop lourd (10 Mo maximum).' : o.onOk(v, fichiersChoisis);
      if (err) { p.textContent = err; p.hidden = false; return; }
      fermerModale(f.closest('[data-modale]'));
    });
  }
  function fermerModale(el) {
    var cible = el || document.querySelector('[data-modale]:last-child');
    if (cible) cible.remove();
    if (o_apres) { var cb = o_apres; o_apres = null; cb(); }
  }
  function confirmer(titre, texte, bouton, ok) { ouvrirModale({ titre: titre, texte: texte, bouton: bouton, champs: [], onOk: function () { ok(); return null; } }); }
  function montant(v) { var n = Number(String(v).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? r2(n) : NaN; }

  /** Enregistre un fichier choisi sur l'ordinateur et l'ajoute aux documents de la fiche. */
  function ajouterDocument(pid, file, type) {
    var m = moi(), d = { id: uid('d'), pid: pid, nom: file.name, type: type || 'Autre', taille: file.size, mime: file.type || 'application/octet-stream', le: maintenant(), auteur: m ? m.nom : '' };
    S.documents.push(d);
    fichiers.mettre(d.id, file).catch(function () { toast('Le navigateur n’a pas pu conserver ce fichier (stockage indisponible).', true); });
    journaliser('Document ajouté', pid, d.type + ' — ' + d.nom + ' (' + taille(d.taille) + ')');
    return d.id;
  }
  function preuveUtilisee(id) {
    return S.prospects.some(function (p) { return (p.devis && p.devis.docPreuve === id) || (p.avenants || []).some(function (a) { return a.docPreuve === id; }); });
  }
  /** Ce qui attend encore une preuve de signature dans ce dossier (devis d'abord, puis avenants). */
  function ciblesSansPreuve(p) {
    var c = [];
    if (p.devis && p.devis.dateSignature && !(p.devis.docPreuve && doc(p.devis.docPreuve))) c.push({ obj: p.devis, libelle: 'devis ' + p.devis.ref });
    (p.avenants || []).forEach(function (a) { if (!(a.docPreuve && doc(a.docPreuve))) c.push({ obj: a, libelle: 'avenant ' + a.ref }); });
    return c;
  }
  function peutJoindrePreuve() { return !!ecriture(); } // Hugo, Jeff (même interface) et l'admin ; pas le compte consultation
  function libelleCible(p, cle) {
    if (cle === 'devis') return 'devis ' + p.devis.ref;
    var a = (p.avenants || []).find(function (x) { return x.id === cle; }); return a ? 'avenant ' + a.ref : '';
  }
  /** À quoi sert ce document comme preuve (ex. « devis DEV-2026-011 »), ou '' s'il n'est rattaché à rien. */
  function usagePreuve(id) {
    var r = [];
    S.prospects.forEach(function (p) {
      if (p.devis && p.devis.docPreuve === id) r.push('devis ' + p.devis.ref);
      (p.avenants || []).forEach(function (a) { if (a.docPreuve === id) r.push('avenant ' + a.ref); });
    });
    return r.join(', ');
  }
  /**
   * Fenêtre unique pour joindre une preuve de signature : soit un document déjà présent dans la fiche,
   * soit un nouveau fichier de l'ordinateur. Utilisée depuis la fiche, l'onglet Documents et l'onglet Commissions.
   */
  function modaleJoindrePreuve(p, cle, docPropose) {
    var cibles = ciblesSansPreuve(p).map(function (c) { return { cle: c.obj === p.devis ? 'devis' : c.obj.id, libelle: c.libelle }; });
    if (cle && !cibles.some(function (c) { return c.cle === cle; })) cibles.unshift({ cle: cle, libelle: libelleCible(p, cle) });
    if (!cibles.length) return toast('Toutes les signatures de ce dossier ont déjà leur preuve.');
    var choisie = cibles.find(function (c) { return c.cle === cle; }) || cibles[0];
    var docs = S.documents.filter(function (x) { return x.pid === p.id; });
    var optCible = cibles.map(function (c) { return 'Signature du ' + c.libelle; });
    var NOUVEAU = 'Un nouveau fichier de mon ordinateur';
    var optDocs = docs.map(function (x, i) { return (i + 1) + '. ' + x.nom + ' (' + x.type + ')'; });
    var docDefaut = docPropose ? optDocs[docs.findIndex(function (x) { return x.id === docPropose; })] : (optDocs.length ? '' : NOUVEAU);
    var champs = [];
    if (cibles.length > 1) champs.push({ k: 'cible', label: 'Preuve de quelle signature ?', type: 'select', options: optCible, req: true, val: 'Signature du ' + choisie.libelle });
    champs.push({ k: 'source', label: 'Document', type: 'select', options: optDocs.concat([NOUVEAU]), req: true, val: docDefaut, aide: optDocs.length ? 'Choisissez le fichier déjà ajouté dans la fiche, ou un nouveau fichier.' : '' });
    champs.push({ k: 'fichier', label: 'Nouveau fichier (si « nouveau fichier » est choisi)', type: 'file' });
    ouvrirModale({ titre: 'Joindre la preuve de signature', texte: (cibles.length > 1 ? '' : 'Pour le <b>' + esc(choisie.libelle) + '</b>. ') + 'Devis accepté, bon de commande, contrat ou e-mail d’accord.', bouton: 'Valider la preuve', champs: champs,
      onOk: function (v, f) {
        var c = cibles.length > 1 ? cibles[optCible.indexOf(v.cible)] : choisie;
        if (!c) return 'Choisissez la signature concernée.';
        var id;
        if (v.source === NOUVEAU) {
          if (!f.fichier) return 'Choisissez le fichier sur votre ordinateur.';
          id = ajouterDocument(p.id, f.fichier, 'Preuve de signature');
        } else {
          var d = docs[optDocs.indexOf(v.source)]; if (!d) return 'Choisissez un document.';
          id = d.id; if (d.type !== 'Preuve de signature' && d.type !== 'Bon de commande / contrat') d.type = 'Preuve de signature';
        }
        if (c.cle === 'devis') p.devis.docPreuve = id; else p.avenants.forEach(function (a) { if (a.id === c.cle) a.docPreuve = id; });
        journaliser('Preuve de signature rattachée', p.id, c.libelle + ' — ' + doc(id).nom);
        sauver(); o_apres = function () { rendre(); toast('Preuve validée pour le ' + c.libelle + ' : la commission peut être confirmée.'); }; return null;
      } });
  }
  function rattacherPreuve(p, docId) {
    var c = ciblesSansPreuve(p)[0];
    if (!c) return null;
    c.obj.docPreuve = docId;
    journaliser('Preuve de signature rattachée', p.id, c.libelle + ' — ' + doc(docId).nom);
    return c.libelle;
  }
  function telechargerDocument(id) {
    var d = doc(id); if (!d) return;
    var servir = function (blob) {
      if (!blob) return toast('Fichier introuvable dans ce navigateur.', true);
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = d.nom; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
    };
    if (d.exemple) return servir(pdfExemple(d.exemple[0], d.exemple.slice(1)));
    fichiers.lire(id).then(servir).catch(function () { toast('Fichier indisponible dans ce navigateur.', true); });
  }

  /* ───────────── Processus commercial ───────────── */
  function verrouSource(p) { if (!p.sourceVerrouillee && p.etape !== 'perdu' && ETAPE[p.etape].rang >= ETAPE.devis_envoye.rang) p.sourceVerrouillee = true; }

  function demanderDevis(p, suite) {
    ouvrirModale({
      titre: p.entreprise + ' — devis envoyé',
      texte: 'Renseignez la référence, la date et le montant HT du devis envoyé. La source sera verrouillée (elle détermine les commissions).',
      bouton: 'Enregistrer',
      champs: [
        { k: 'ref', label: 'Référence du devis', req: true, demi: true, val: 'DEV-2026-0' + (20 + S.seq.p) },
        { k: 'dateEnvoi', label: 'Date d’envoi', type: 'date', req: true, demi: true, val: auj(), max: auj() },
        { k: 'montantHt', label: 'Montant HT (€)', req: true, mode: 'decimal', val: p.montantEstime || '' },
        { k: 'fichier', label: 'Copie du devis (facultatif)', type: 'file' }
      ],
      onOk: function (v, f) {
        var m = montant(v.montantHt);
        if (!(m > 0)) return 'Montant HT invalide.';
        p.devis = { ref: v.ref, dateEnvoi: v.dateEnvoi, montantHt: m };
        journaliser('Devis envoyé', p.id, v.ref + ' — ' + eur(m) + ' HT');
        if (f.fichier) ajouterDocument(p.id, f.fichier, 'Devis');
        sauver(); o_apres = suite; return null;
      }
    });
  }
  function demanderSignature(p, suite) {
    ouvrirModale({
      titre: p.entreprise + ' — devis signé',
      texte: 'Dès la signature, la commission est acquise : JEGO (16 % du HT) et Marc (9 % du HT) envoient chacun leur facture à la coopérative, qui les paie directement. Période éligible : du ' + dfr(S.miseEnLigne) + ' au ' + dfr(finIncluse()) + '.',
      bouton: 'Valider la signature',
      champs: [
        { k: 'dateSignature', label: 'Date de signature', type: 'date', req: true, demi: true, val: auj(), max: auj() },
        { k: 'typePreuve', label: 'Type de preuve', type: 'select', options: TYPES_PREUVE, req: true, demi: true },
        { k: 'fichier', label: 'Preuve de signature', type: 'file', aide: 'Sans fichier, une alerte s’affiche et la commission ne peut pas encore être confirmée payée.' }
      ],
      onOk: function (v, f) {
        if (p.devis.dateEnvoi && v.dateSignature < p.devis.dateEnvoi) return 'La signature ne peut pas précéder l’envoi du devis.';
        p.devis.dateSignature = v.dateSignature; p.devis.typePreuve = v.typePreuve;
        p.devis.docPreuve = f.fichier ? ajouterDocument(p.id, f.fichier, 'Preuve de signature') : null;
        var el = eligibilite(p);
        journaliser('Devis signé', p.id, p.devis.ref + ' — ' + eur(p.devis.montantHt) + ' HT — preuve : ' + v.typePreuve + (f.fichier ? '' : ' (fichier à joindre)') + ' — ' + (el.ok ? 'commission acquise : JEGO ' + eur(r2(p.devis.montantHt * TAUX_J)) + ', Marc ' + eur(r2(p.devis.montantHt * TAUX_M)) : el.raison));
        sauver(); o_apres = suite; return null;
      }
    });
  }
  function demanderPaiementClient(p, suite) {
    ouvrirModale({
      titre: p.entreprise + ' — le client a payé',
      texte: 'Simple suivi pour Hugo : la coopérative gère la facture et les relances. Sans effet sur les commissions (déjà acquises à la signature).',
      bouton: 'Confirmer le paiement',
      champs: [{ k: 'date', label: 'Date du paiement', type: 'date', req: true, val: auj(), max: auj() }],
      onOk: function (v) {
        p.paiementClient = { date: v.date, par: moi().nom };
        journaliser('Le client a payé', p.id, 'Paiement reçu le ' + dfr(v.date));
        sauver(); o_apres = suite; return null;
      }
    });
  }

  /** Fait avancer un prospect. Jamais de retour en arrière (sauf réactivation d'un perdu, ou correction de l'admin). */
  function avancer(p, etape) {
    if (!ecriture()) return toast('Votre accès est en consultation : vous ne pouvez pas modifier les prospects.', true);
    if (p.etape === etape) { rendre(); return; }
    var refaire = function () { avancer(p, etape); };
    if (etape === 'perdu') {
      return ouvrirModale({ titre: p.entreprise + ' → Perdu', bouton: 'Valider', champs: [{ k: 'raison', label: 'Raison de la perte', type: 'textarea', req: true }],
        onOk: function (v) {
          var av = ETAPE[p.etape].label; p.etapeAvantPerte = p.etape; p.etape = 'perdu'; p.raisonPerte = v.raison;
          journaliser('Étape changée', p.id, av + ' → Perdu : ' + v.raison); sauver(); o_apres = rendre; return null;
        } });
    }
    if (p.etape === 'perdu') {
      var retour = p.etapeAvantPerte || 'nouveau';
      if (etape !== retour && !estAdmin()) return toast('Un prospect perdu ne peut être réactivé qu’à son étape d’avant : « ' + ETAPE[retour].label + ' ».', true);
      if (etape === retour) {
        p.etape = retour; p.raisonPerte = ''; journaliser('Prospect réactivé', p.id, 'Perdu → ' + ETAPE[retour].label); sauver(); rendre();
        return toast(p.entreprise + ' réactivé en « ' + ETAPE[retour].label + ' ».');
      }
    }
    var arriere = p.etape !== 'perdu' && ETAPE[etape].rang < ETAPE[p.etape].rang;
    if (arriere || (p.etape === 'perdu' && etape !== (p.etapeAvantPerte || 'nouveau'))) {
      if (!estAdmin()) return toast('Retour en arrière impossible : « ' + ETAPE[p.etape].label + ' » ne peut pas redevenir « ' + ETAPE[etape].label + ' ».', true);
      return ouvrirModale({ titre: 'Correction d’étape (administrateur)', texte: 'Retour de « ' + ETAPE[p.etape].label + ' » à « ' + ETAPE[etape].label + ' ». Réservé à la correction d’une erreur : la raison est inscrite dans l’historique. Les informations déjà saisies (devis, signature) sont conservées.',
        bouton: 'Corriger', champs: [{ k: 'raison', label: 'Raison de la correction', type: 'textarea', req: true }],
        onOk: function (v) { var av = ETAPE[p.etape].label; p.etape = etape; journaliser('Correction d’étape par l’administrateur', p.id, av + ' → ' + ETAPE[etape].label + ' : ' + v.raison); sauver(); o_apres = rendre; return null; } });
    }
    var rang = ETAPE[etape].rang;
    if (rang >= ETAPE.devis_envoye.rang && !(p.devis && p.devis.ref)) return demanderDevis(p, refaire);
    if (rang >= ETAPE.devis_signe.rang && !(p.devis.dateSignature && p.devis.typePreuve)) return demanderSignature(p, refaire);
    if (etape === 'paye' && !p.paiementClient) return demanderPaiementClient(p, refaire);
    var avant = ETAPE[p.etape].label;
    p.etape = etape;
    verrouSource(p);
    journaliser(etape === 'facture' ? 'Facture envoyée par la coopérative' : 'Étape changée', p.id, avant + ' → ' + ETAPE[etape].label);
    sauver(); rendre();
    toast(p.entreprise + ' → ' + ETAPE[etape].label);
  }

  /* ───────────── Rendu : en-tête ───────────── */
  function entete() {
    var m = moi(), nbAl = alertesPreuve().length;
    var liens = [['pipeline', 'Prospects'], ['paiements', 'Paiements clients'], ['commissions', 'Commissions'], ['historique', 'Historique']];
    if (m.role === 'admin') liens.push(['admin', 'Admin']);
    return '<div class="bandeau-demo">Démonstration — données fictives enregistrées dans ce navigateur uniquement <button type="button" data-act="changer-compte">Changer de compte</button><button type="button" data-act="reinitialiser">Réinitialiser</button></div>' +
      '<header class="entete"><a href="#" class="marque" data-act="vue" data-vue="pipeline"><img src="/media/logo-va.png" alt="" /><span><img class="nom" src="/media/vatea-nom.svg" alt="VATEA" width="76" height="18" /><i>CRM commercial</i></span></a>' +
      '<nav class="nav" aria-label="Navigation">' + liens.map(function (l) {
        return '<a href="#" data-act="vue" data-vue="' + l[0] + '" class="' + (ui.vue === l[0] ? 'actif' : '') + '">' + l[1] + (l[0] === 'commissions' && nbAl ? '<span class="badge" title="Preuves de signature manquantes">' + nbAl + '</span>' : '') + '</a>';
      }).join('') + '</nav>' +
      '<div class="qui"><span class="avatar">' + initiales(m.nom) + '</span><div class="qui-nom"><b>' + esc(m.nom) + '</b><span>' + ROLES[m.role] + ' · ' + esc(m.societe) + '</span></div>' +
      '<button class="btn btn-petit" type="button" data-act="changer-compte">Déconnexion</button></div></header>';
  }

  /* ───────────── Rendu : pipeline ───────────── */
  function filtres() {
    var q = ui.q.trim().toLowerCase();
    return S.prospects.filter(function (p) {
      return (!ui.source || p.source === ui.source) &&
        (!q || [p.entreprise, p.contact, p.email, p.telephone, p.notes].some(function (v) { return v && v.toLowerCase().indexOf(q) >= 0; }));
    });
  }
  function montantP(p) { return p.devis ? (p.devis.dateSignature ? htSigne(p) : p.devis.montantHt) : p.montantEstime; }
  function carte(p) {
    var a = auj(), retard = p.relance && p.relance < a && ['paye', 'perdu'].indexOf(p.etape) < 0, w = ecriture(), m = montantP(p);
    var sansPreuve = p.devis && p.devis.dateSignature && eligibilite(p).ok && !(p.devis.docPreuve && doc(p.devis.docPreuve));
    return '<button type="button" class="carte" data-act="fiche" data-id="' + p.id + '"' + (w ? ' draggable="true"' : '') + '>' +
      '<h3>' + esc(p.entreprise) + '</h3>' + (p.contact ? '<p class="contact">' + esc(p.contact) + '</p>' : '') +
      '<div class="ligne">' + (p.typeVideo ? '<span class="puce">' + esc(p.typeVideo.replace('Vidéo ', '')) + '</span>' : '') +
      '<span class="puce or" title="' + (p.sourceVerrouillee ? 'Source verrouillée' : 'Source') + '">' + (p.sourceVerrouillee ? '🔒 ' : '') + esc(p.source) + '</span>' +
      (p.campagneLe ? '<span class="puce" title="Contacté par la campagne automatique le ' + esc(dheure(p.campagneLe)) + '">📧 Campagne</span>' : '') + '</div>' +
      '<div class="ligne">' + (p.relance && ['paye', 'perdu', 'facture', 'devis_signe'].indexOf(p.etape) < 0 ? '<span class="puce' + (retard ? ' alerte' : '') + '" title="Prochaine relance">⏰ ' + dcourt(p.relance) + '</span>' : '') +
      (p.etape === 'facture' ? '<span class="puce" title="Facturé par la coopérative">En attente du paiement client</span>' : '') +
      (sansPreuve ? '<span class="puce alerte" title="Preuve de signature à joindre">Preuve manquante</span>' : '') +
      (p.annulation ? '<span class="puce alerte">Contrat annulé</span>' : '') +
      '<span class="montant">' + (m != null ? eur0(m) : '') + '</span></div></button>';
  }
  function vuePipeline() {
    var L = filtres(), a = auj(), w = ecriture(), mois = a.slice(0, 7);
    var somme = function (arr) { return arr.reduce(function (t, p) { return t + (montantP(p) || 0); }, 0); };
    var k = {
      actifs: L.filter(function (p) { return ETAPE[p.etape].rang < ETAPE.devis_signe.rang; }).length,
      devis: somme(L.filter(function (p) { return p.etape === 'devis_envoye'; })),
      signe: r2(L.filter(function (p) { return p.etape !== 'perdu' && p.devis && p.devis.dateSignature && p.devis.dateSignature.slice(0, 7) === mois; }).reduce(function (t, p) { return t + htSigne(p); }, 0)),
      rdv: L.filter(function (p) { return p.etape === 'rdv'; }).length,
      clients: L.filter(function (p) { return ['devis_signe', 'facture', 'paye'].indexOf(p.etape) >= 0; }).length,
      retard: L.filter(function (p) { return p.relance && p.relance < a && ['paye', 'perdu', 'facture', 'devis_signe'].indexOf(p.etape) < 0; }).length
    };
    var h = '<div class="tete-page"><div><h1>Pipeline</h1><p>' + (w ? 'Tous les prospects' : 'Consultation') + ' · ' + L.length + ' prospect' + (L.length > 1 ? 's' : '') + '</p></div>' +
      '<div class="kpis"><div class="kpi"><span>Actifs</span><b>' + k.actifs + '</b></div><div class="kpi"><span>Devis en cours HT</span><b>' + eur0(k.devis) + '</b></div>' +
      '<div class="kpi"><span>Signé ce mois HT</span><b class="or">' + eur0(k.signe) + '</b></div><div class="kpi"><span>RDV</span><b>' + k.rdv + '</b></div>' +
      '<div class="kpi"><span>Clients</span><b class="or">' + k.clients + '</b></div><div class="kpi"><span>Relances en retard</span><b class="' + (k.retard ? 'alerte' : '') + '">' + k.retard + '</b></div></div></div>';
    h += '<div class="barre"><div class="bascule" role="group" aria-label="Affichage"><button type="button" data-act="mode" data-mode="kanban" class="' + (ui.mode === 'kanban' ? 'on' : '') + '">Kanban</button><button type="button" data-act="mode" data-mode="liste" class="' + (ui.mode === 'liste' ? 'on' : '') + '">Liste</button></div>' +
      '<input class="champ recherche" type="search" placeholder="Rechercher…" value="' + esc(ui.q) + '" data-input="q" aria-label="Rechercher" />' +
      '<select class="champ" data-input="source" aria-label="Source"><option value="">Toutes les sources</option>' + SOURCES.map(function (s) { return '<option' + (ui.source === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
      (ui.mode === 'liste' ? '<select class="champ" data-input="etapeListe" aria-label="Étape"><option value="">Toutes les étapes</option>' + ETAPES.map(function (e) { return '<option value="' + e.id + '"' + (ui.etapeListe === e.id ? ' selected' : '') + '>' + e.label + '</option>'; }).join('') + '</select>' : '') +
      '<div class="droite">' + (w ? '<button type="button" class="btn" data-act="import" title="Créer des fiches à partir d’un fichier Excel ou CSV">⬆ Importer des contacts</button><button type="button" class="btn" data-act="campagne" title="Simule l’outil de campagne e-mail qui prévient le CRM à chaque envoi">📧 Simuler la campagne</button>' : '') +
      '<button type="button" class="btn" data-act="export-prospects">Exporter</button>' + (w ? '<button type="button" class="btn btn-or" data-act="nouveau">+ Nouveau prospect</button>' : '') + '</div></div>';
    if (ui.mode === 'kanban') {
      h += '<div class="kanban' + (ui.perduOuvert ? ' avec-perdu-ouvert' : ' avec-perdu-replie') + '">';
      ETAPES.filter(function (e) { return e.id !== 'perdu'; }).forEach(function (e) {
        var it = L.filter(function (p) { return p.etape === e.id; }), tot = somme(it);
        h += '<section class="colonne" style="--c:' + e.c + '" data-etape="' + e.id + '" aria-label="' + e.label + '"><div class="col-tete"><span class="point"></span><h2>' + e.label + '</h2><span class="nb">' + it.length + '</span>' +
          (e.id === 'nouveau' && w ? '<button type="button" class="btn btn-icone" style="margin-left:auto" data-act="nouveau" aria-label="Ajouter un prospect">+</button>' : '') +
          (tot > 0 ? '<span class="somme">' + eur0(tot) + ' HT</span>' : '') + '</div><div class="col-corps">' +
          (it.length ? it.slice(0, LIMITE_COLONNE).map(carte).join('') : '<p class="vide">—</p>') +
          (it.length > LIMITE_COLONNE ? '<button type="button" class="voir-plus" data-act="voir-liste" data-etape="' + e.id + '">Voir les ' + (it.length - LIMITE_COLONNE).toLocaleString('fr-BE') + ' autres en liste</button>' : '') + '</div></section>';
      });
      var perdus = L.filter(function (p) { return p.etape === 'perdu'; });
      h += ui.perduOuvert
        ? '<section class="colonne" style="--c:#7a7a7a" data-etape="perdu" aria-label="Perdu"><div class="col-tete"><span class="point"></span><h2>Perdu</h2><span class="nb">' + perdus.length + '</span><button type="button" class="btn btn-icone" style="margin-left:auto" data-act="perdu-toggle" aria-label="Replier">‹</button></div><div class="col-corps">' + (perdus.length ? perdus.map(carte).join('') : '<p class="vide">—</p>') + '</div></section>'
        : '<section class="colonne repliee" style="--c:#7a7a7a" data-etape="perdu" data-act="perdu-toggle" role="button" tabindex="0" aria-label="Afficher les prospects perdus"><span class="point"></span><h2>Perdu</h2><span class="nb">' + perdus.length + '</span></section>';
      h += '</div>';
      if (w) h += '<p class="aide" style="margin-top:10px">Glissez une carte vers la droite pour la faire avancer : le CRM demande ce qui manque (devis, preuve de signature, date de paiement). Le retour en arrière est impossible.</p>';
    } else {
      var LL = ui.etapeListe ? L.filter(function (p) { return p.etape === ui.etapeListe; }) : L;
      var pages = Math.max(1, Math.ceil(LL.length / PAR_PAGE)); if (ui.page > pages) ui.page = pages;
      var debut = (ui.page - 1) * PAR_PAGE, pageL = LL.slice(debut, debut + PAR_PAGE);
      var pagination = LL.length > PAR_PAGE ? '<div class="pagination"><button type="button" class="btn btn-petit" data-act="page" data-p="' + (ui.page - 1) + '"' + (ui.page <= 1 ? ' disabled' : '') + '>‹ Précédent</button><span>' + (debut + 1).toLocaleString('fr-BE') + '–' + (debut + pageL.length).toLocaleString('fr-BE') + ' sur ' + LL.length.toLocaleString('fr-BE') + '</span><button type="button" class="btn btn-petit" data-act="page" data-p="' + (ui.page + 1) + '"' + (ui.page >= pages ? ' disabled' : '') + '>Suivant ›</button></div>' : '';
      h += pagination + '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Entreprise</th><th>Étape</th><th>Source</th><th>Téléphone</th><th>E-mail</th><th class="num">Montant HT</th><th>Relance</th></tr></thead><tbody>' +
        pageL.map(function (p) {
          var retard = p.relance && p.relance < a && ['paye', 'perdu'].indexOf(p.etape) < 0;
          return '<tr class="cliquable" data-act="fiche" data-id="' + p.id + '"><td><b>' + esc(p.entreprise) + '</b>' + (p.contact ? '<div class="aide" style="margin-top:2px">' + esc(p.contact) + '</div>' : '') + '</td>' +
            '<td><span class="etape-badge" style="--c:' + ETAPE[p.etape].c + '">' + ETAPE[p.etape].label + '</span></td><td>' + (p.sourceVerrouillee ? '🔒 ' : '') + esc(p.source) + '</td>' +
            '<td>' + (p.telephone ? esc(p.telephone) : '—') + '</td><td>' + (p.email ? esc(p.email) : '—') + '</td><td class="num">' + eur0(montantP(p)) + '</td><td>' + (p.relance ? '<span class="puce' + (retard ? ' alerte' : '') + '">' + dcourt(p.relance) + '</span>' : '—') + '</td></tr>';
        }).join('') + (LL.length ? '' : '<tr><td colspan="7" class="vide">Aucun prospect</td></tr>') + '</tbody></table></div>' + pagination;
    }
    return h;
  }

  /* ───────────── Rendu : paiements clients (suivi pour Hugo) ───────────── */
  function vuePaiements() {
    var w = ecriture();
    var L = S.prospects.filter(function (p) { return p.devis && p.devis.dateSignature && !p.annulation; }).sort(function (a, b) { return a.devis.dateSignature < b.devis.dateSignature ? 1 : -1; });
    var attente = L.filter(function (p) { return !p.paiementClient; });
    var h = '<div class="tete-page"><div><h1>Paiements clients</h1><p>Suivi pour Hugo : la coopérative facture et relance les clients. Sans effet sur les commissions, acquises à la signature.</p></div>' +
      '<div class="kpis"><div class="kpi"><span>En attente de paiement</span><b class="' + (attente.length ? 'alerte' : '') + '">' + attente.length + '</b></div><div class="kpi"><span>Montant HT en attente</span><b>' + eur0(attente.reduce(function (t, p) { return t + htSigne(p); }, 0)) + '</b></div>' +
      '<div class="kpi"><span>Payés</span><b class="or">' + (L.length - attente.length) + '</b></div></div></div>';
    h += '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Client</th><th>Devis</th><th>Signé le</th><th class="num">HT signé</th><th>Statut</th><th></th></tr></thead><tbody>' +
      L.map(function (p) {
        var st = p.paiementClient ? '<span class="pastille p-ok">Payé le ' + dfr(p.paiementClient.date) + '</span>' : p.etape === 'facture' ? '<span class="pastille p-warn">Facturé par la coopérative</span>' : '<span class="pastille p-info">Signé, pas encore facturé</span>';
        var act = '';
        if (w && !p.paiementClient) act = (p.etape === 'devis_signe' ? '<button type="button" class="btn btn-petit" data-act="p-facture" data-id="' + p.id + '">Facture envoyée</button> ' : '') + '<button type="button" class="btn btn-petit" data-act="p-paye" data-id="' + p.id + '">Le client a payé</button>';
        return '<tr><td><a href="#" data-act="fiche" data-id="' + p.id + '" data-onglet="devis">' + esc(p.entreprise) + '</a></td><td>' + esc(p.devis.ref) + ((p.avenants || []).length ? ' <span class="aide">+ ' + p.avenants.length + ' avenant(s)</span>' : '') + '</td><td>' + dfr(p.devis.dateSignature) + '</td>' +
          '<td class="num">' + eur(htSigne(p)) + '</td><td>' + st + '</td><td><div class="actions-ligne" style="justify-content:flex-start">' + act + '</div></td></tr>';
      }).join('') + (L.length ? '' : '<tr><td colspan="6" class="vide">Aucun devis signé</td></tr>') + '</tbody></table></div>';
    return h;
  }

  /* ───────────── Rendu : commissions (16 % / 9 % du HT signé) ───────────── */
  function cellulePaiement(l, cle) {
    var paye = cle === 'j' ? l.payeJ : l.payeM, fact = cle === 'j' ? l.factJ : l.factM, beneficiaire = cle === 'j' ? 'jeff' : 'marc', m = moi(), negatif = l.ht < 0;
    if (!l.el.ok) return '<span class="pastille p-neutre">Non éligible</span>';
    if (paye) return '<span class="pastille p-ok" title="Figée' + (fact ? ' — facture ' + esc(fact.num) : '') + '">🔒 ' + (negatif ? 'Déduite' : 'Payée') + ' le ' + dfr(paye.date) + '</span>';
    var factHtml = fact ? '<span class="pastille p-info" title="Facture envoyée à la coopérative">Facture ' + esc(fact.num) + ' · ' + dfr(fact.date) + '</span>' : '';
    if (m.id === beneficiaire) {
      if (!l.preuveOk) return '<span class="pastille p-warn" title="Hugo ou Jeff doit joindre la preuve de signature">Preuve manquante</span>';
      if (!fact) return '<button type="button" class="btn btn-petit" data-act="com-facture" data-l="' + l.id + '">' + (negatif ? 'Déduire sur ma facture' : 'Facture envoyée') + '</button>';
      return '<div class="cellule-com">' + factHtml + '<button type="button" class="btn btn-petit btn-or" data-act="com-payee" data-l="' + l.id + '" data-b="' + cle + '">' + (negatif ? 'Confirmer la déduction' : 'J’ai été payé') + '</button></div>';
    }
    if (fact) return '<div class="cellule-com">' + factHtml + '<span class="pastille p-warn">' + (negatif ? 'À déduire' : 'En attente de paiement') + '</span></div>';
    return '<span class="pastille ' + (l.preuveOk ? 'p-warn' : 'p-bad') + '">' + (negatif ? 'À déduire' : 'À facturer') + (l.preuveOk ? '' : ' · preuve manquante') + '</span>';
  }
  /** Le bénéficiaire déclare la facture envoyée à la coopérative : une facture par devis (ou avenant / annulation). */
  function modaleFacture(ligneId) {
    var m = moi(), b = m.id === 'jeff' ? 'j' : m.id === 'marc' ? 'm' : null;
    if (!b) return toast('Seul le bénéficiaire déclare sa facture.', true);
    var l = lignesCommission().find(function (x) { return x.id === ligneId; });
    if (!l || !l.el.ok) return;
    if (!l.preuveOk) return toast('Preuve de signature manquante : Hugo ou Jeff doit la joindre.', true);
    if (b === 'j' ? l.factJ : l.factM) return toast('Facture déjà enregistrée pour ce devis.');
    var taux = b === 'j' ? '16' : '9', neg = l.ht < 0;
    ouvrirModale({ titre: neg ? 'Avoir / déduction à facturer' : 'Facture envoyée à la coopérative',
      texte: l.p.entreprise + ' — ' + l.type.toLowerCase() + ' ' + esc(l.ref) + '</p><div class="montant-facture"><span>' + (neg ? 'Montant à déduire' : 'Montant à facturer') + '</span><b>' + eur(l[b]) + '</b><small>' + taux + ' % de ' + eur(l.ht) + ' HT signé</small></div><p class="aide">Reportez ce montant sur votre facture, puis indiquez son numéro.',
      bouton: 'Enregistrer la facture',
      champs: [
        { k: 'num', label: 'N° de facture', req: true, demi: true, val: '' },
        { k: 'date', label: 'Date de la facture', type: 'date', req: true, demi: true, val: auj(), max: auj() }
      ],
      onOk: function (v) {
        S.comFacture[l.id] = S.comFacture[l.id] || {}; S.comFacture[l.id][b] = { num: v.num, date: v.date, par: m.nom };
        journaliser('Facture de commission envoyée à la coopérative (' + (b === 'j' ? 'JEGO' : 'EI BRETZNER MARC') + ')', l.p.id, v.num + ' du ' + dfr(v.date) + ' — ' + l.ref + ' — ' + eur(l[b]));
        sauver(); o_apres = function () { rendre(); toast('Facture ' + v.num + ' enregistrée (' + eur(l[b]) + '). Confirmez la réception dès que la coopérative a payé.'); }; return null;
      } });
  }
  function vueCommissions() {
    var m = moi(), toutes = lignesCommission();
    var moisDispo = Array.from(new Set(toutes.map(function (l) { return l.date.slice(0, 7); }))).sort().reverse();
    var L = toutes.filter(function (l) { return (!ui.mois || l.date.slice(0, 7) === ui.mois) && (!ui.resteSeulement || (l.el.ok && (!l.payeJ || !l.payeM))); });
    var tJ = totaux(toutes, 'j'), tM = totaux(toutes, 'm'), envoye = devisEnvoyesHt(), al = alertesPreuve();
    var h = '<div class="tete-page"><div><h1>Commissions</h1><p>' + (m.id === 'jeff' ? 'Votre commission JEGO : 16 % du montant HT signé' : m.id === 'marc' ? 'Votre commission EI BRETZNER MARC : 9 % du montant HT signé' : 'JEGO : 16 % du HT signé · EI BRETZNER MARC : 9 % du HT signé') + ' — acquise dès la signature du devis.</p></div></div>';
    h += '<div class="periode"><span>Période éligible : <b>du ' + dfr(S.miseEnLigne) + ' au ' + dfr(finIncluse()) + '</b> (contrats signés dans les 12 mois suivant la mise en ligne constatée par écrit — date fictive pour la démo).</span>' +
      '<span>Dès la signature, la commission est acquise. <b>JEGO (16 % du HT) et EI BRETZNER MARC (9 % du HT) envoient chacun une facture par devis signé à la coopérative</b>, qui les paie directement et séparément, sans attendre le paiement du client. Sur chaque ligne : « Facture envoyée » (le montant est calculé), puis « J’ai été payé ».</span></div>';
    if (al.length) h += '<div class="alertes">' + al.map(function (a) { return '<button type="button" class="alerte-ligne" style="--sev:#e5674d" data-act="fiche" data-id="' + a.pid + '" data-onglet="devis"><div><b>' + esc(a.titre) + '</b><span>' + esc(a.texte) + '</span></div></button>'; }).join('') + '</div>';
    var tuile = function (lbl, val, aide, cl) { return '<div class="tuile' + (cl ? ' ' + cl : '') + '"><span>' + lbl + '</span><b>' + eur(val) + '</b><small>' + aide + '</small></div>'; };
    var tuiles = function (t, taux, nom) {
      return '<div class="tuiles tuiles-4">' + tuile('Déjà payé', t.paye, 'Reçu de la coopérative, confirmé par ' + nom, 'ok') +
        tuile('À payer', t.aPayer, [t.facture ? eur(t.facture) + ' facturé, en attente de la coopérative' : '', t.aFacturer ? eur(t.aFacturer) + ' à facturer' : '', t.sansPreuve ? eur(t.sansPreuve) + ' en attente de preuve de signature' : ''].filter(Boolean).join(' · ') || 'Rien en attente', 'warn') +
        tuile('Total acquis', t.total, Math.round(taux * 100) + ' % du HT signé', 'total') +
        tuile('Devis envoyés', r2(envoye * taux), 'Indicatif : si les ' + eur0(envoye) + ' HT envoyés sont signés', 'neutre') + '</div>';
    };
    if (m.id === 'jeff') h += '<h2 class="sous-titre">Ma commission — 16 % du HT signé</h2>' + tuiles(tJ, TAUX_J, 'vous');
    else if (m.id === 'marc') h += '<h2 class="sous-titre">Ma commission — 9 % du HT signé</h2>' + tuiles(tM, TAUX_M, 'vous');
    else {
      var ligne = function (n, t) { return '<tr><td><b>' + n + '</b></td><td class="num">' + eur(t.paye) + '</td><td class="num"><b>' + eur(t.aPayer) + '</b>' + (t.facture || t.sansPreuve ? '<div class="aide" style="margin-top:2px">' + [t.facture ? 'dont ' + eur(t.facture) + ' facturé' : '', t.sansPreuve ? eur(t.sansPreuve) + ' sans preuve' : ''].filter(Boolean).join(' · ') + '</div>' : '') + '</td><td class="num">' + eur(t.total) + '</td></tr>'; };
      h += '<h2 class="sous-titre">Ce que la coopérative paie à chacun, sur facture</h2><div class="tableau-wrap"><table class="tableau"><thead><tr><th>Bénéficiaire (payé par la coopérative sur sa facture)</th><th class="num">Déjà payé</th><th class="num">Reste à payer</th><th class="num">Total acquis</th></tr></thead><tbody>' +
        ligne('JEGO (Jeff) — 16 % du HT', tJ) + ligne('EI BRETZNER MARC — 9 % du HT', tM) + '</tbody></table></div>' +
        '<p class="aide" style="margin-top:8px">Devis envoyés non signés : ' + eur0(envoye) + ' HT (indicatif : JEGO ' + eur(r2(envoye * TAUX_J)) + ', Marc ' + eur(r2(envoye * TAUX_M)) + ').</p>';
    }
    h += '<h2 class="sous-titre">Détail par devis signé</h2><div class="barre"><select class="champ" data-input="mois" aria-label="Mois de signature"><option value="">Tous les mois</option>' + moisDispo.map(function (x) { return '<option value="' + x + '"' + (ui.mois === x ? ' selected' : '') + '>' + moisLabel(x) + '</option>'; }).join('') + '</select>' +
      '<label class="bascule-case"><input type="checkbox" data-input="resteSeulement"' + (ui.resteSeulement ? ' checked' : '') + ' /> Seulement ce qui reste à payer</label>' +
      '<div class="droite">' + '<button type="button" class="btn btn-or" data-act="export-commissions">Exporter' + (ui.mois ? ' le mois' : '') + '</button></div></div>';
    var cj = m.id === 'jeff' ? ' col-j' : '', cm = m.id === 'marc' ? ' col-j' : '';
    var el = L.filter(function (l) { return l.el.ok; });
    h += '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Signé le</th><th>Client / devis</th><th class="num">HT signé</th><th class="num' + cj + '">JEGO 16 % du HT</th><th class="num' + cm + '">Marc 9 % du HT</th><th>Preuve</th><th class="' + cj.trim() + '">JEGO</th><th class="' + cm.trim() + '">Marc</th></tr></thead><tbody>' +
      L.map(function (l) {
        var preuve = l.preuve === 'sans-objet' ? '—' : l.preuveOk ? '<button type="button" class="lien" data-act="doc-dl" data-d="' + l.preuve + '">📎 Ouvrir</button>' : (peutJoindrePreuve() ? '<button type="button" class="btn btn-petit btn-or" data-act="joindre-preuve" data-p="' + l.p.id + '" data-cible="' + (l.type === 'Devis' ? 'devis' : l.id.replace('avenant-', '')) + '">Joindre</button>' : '<span class="fichier manquant" title="À joindre par Hugo ou Jeff">Manquante</span>');
        return '<tr><td>' + dfr(l.date) + '<div class="aide" style="margin-top:2px">' + l.type + '</div></td>' +
          '<td><a href="#" data-act="fiche" data-id="' + l.p.id + '" data-onglet="devis">' + esc(l.p.entreprise) + '</a><div class="aide" style="margin-top:2px">' + esc(l.ref) + (l.objet ? ' · ' + esc(l.objet) : '') + (l.el.ok ? '' : ' · ' + l.el.raison) + '</div></td>' +
          '<td class="num">' + eur(l.ht) + '</td><td class="num' + cj + '">' + (l.el.ok ? eur(l.j) : '—') + '</td><td class="num' + cm + '">' + (l.el.ok ? eur(l.m) : '—') + '</td>' +
          '<td>' + preuve + '</td><td class="' + cj.trim() + '">' + cellulePaiement(l, 'j') + '</td><td class="' + cm.trim() + '">' + cellulePaiement(l, 'm') + '</td></tr>';
      }).join('') + (L.length ? '' : '<tr><td colspan="8" class="vide">' + (ui.resteSeulement ? 'Tout est payé.' : 'Aucun devis signé sur cette période') + '</td></tr>') +
      '</tbody><tfoot><tr><td colspan="2">Total éligible' + (ui.mois ? ' — ' + moisLabel(ui.mois) : '') + '</td><td class="num">' + eur(r2(el.reduce(function (s, l) { return s + l.ht; }, 0))) + '</td><td class="num' + cj + '">' + eur(r2(el.reduce(function (s, l) { return s + l.j; }, 0))) + '</td><td class="num' + cm + '">' + eur(r2(el.reduce(function (s, l) { return s + l.m; }, 0))) + '</td><td colspan="3"></td></tr></tfoot></table></div>';
    h += '<p class="aide" style="margin-top:10px">Étapes pour chaque bénéficiaire : preuve de signature jointe (Hugo ou Jeff) → facture envoyée à la coopérative → paiement confirmé par le bénéficiaire, puis ligne figée. Avenant signé : une ligne en plus ; contrat annulé : une ligne négative à déduire, sans rien effacer.</p>';
    return h;
  }

  /* ───────────── Rendu : historique ───────────── */
  function vueHistorique() {
    return '<div class="tete-page"><div><h1>Historique</h1><p>Journal des actions : rien n’y est modifiable ni supprimable.</p></div></div>' +
      '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Date</th><th>Par</th><th>Action</th><th>Prospect</th><th>Détails</th></tr></thead><tbody>' +
      S.journal.map(function (j) {
        var p = j.pid ? prospect(j.pid) : null;
        return '<tr><td style="white-space:nowrap;font-family:var(--mono);font-size:12px">' + esc(dheure(j.le)) + '</td><td>' + esc(j.auteur) + '</td><td><b>' + esc(j.action) + '</b></td><td>' + (p ? '<a href="#" data-act="fiche" data-id="' + p.id + '" data-onglet="historique">' + esc(p.entreprise) + '</a>' : '—') + '</td><td style="font-size:12.5px;color:var(--texte-2)">' + esc(j.details) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ───────────── Rendu : admin ───────────── */
  function vueAdmin() {
    return '<div class="tete-page"><div><h1>Admin</h1><p>Équipe, accès et mots de passe</p></div></div><div class="deux-col"><div>' +
      '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Membre</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th><th></th></tr></thead><tbody>' +
      S.comptes.map(function (c) {
        return '<tr style="opacity:' + (c.actif ? 1 : .55) + '"><td><div style="display:flex;align-items:center;gap:10px"><span class="avatar petit" style="width:32px;height:32px;font-size:11px">' + initiales(c.nom) + '</span><div><b>' + esc(c.nom) + '</b><div class="aide" style="margin-top:0">' + esc(c.id) + ' · ' + esc(c.societe) + '</div></div></div></td>' +
          '<td>' + (c.id !== S.session ? '<select class="champ mini-select" data-role="' + c.id + '">' + Object.keys(ROLES).map(function (r) { return '<option value="' + r + '"' + (c.role === r ? ' selected' : '') + '>' + ROLES[r] + '</option>'; }).join('') + '</select>' : ROLES[c.role]) + '</td>' +
          '<td><span class="statut ' + (c.actif ? 'on' : 'off') + '">' + (c.actif ? 'Actif' : 'Désactivé') + '</span>' + (c.actif && c.provisoire ? '<div class="aide" style="margin-top:2px">Mot de passe provisoire</div>' : '') + '</td>' +
          '<td>' + (c.derniere ? esc(dheure(c.derniere)) : 'Jamais') + '</td>' +
          '<td><div class="actions-ligne"><button type="button" class="btn btn-petit" data-act="mdp" data-c="' + c.id + '" title="Générer un nouveau mot de passe">Mot de passe</button>' +
          (c.id !== S.session ? '<button type="button" class="btn btn-petit btn-danger" data-act="actif" data-c="' + c.id + '">' + (c.actif ? 'Désactiver' : 'Réactiver') + '</button>' : '') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="carte-form" style="margin-top:18px"><h2>Paramètres du contrat</h2><div class="grille2"><div><label class="lbl" for="mel">Date de mise en ligne officielle</label><input class="champ" id="mel" type="date" value="' + S.miseEnLigne + '" data-input="miseEnLigne" /></div>' +
      '<div><label class="lbl">Fin de la période éligible</label><input class="champ" value="' + dfr(finIncluse()) + '" disabled /></div></div>' +
      '<p class="aide">Constatée par la recette écrite des trois parties (§ 15). Elle ouvre les 12 mois de commissions. Toute modification est inscrite dans l’historique.</p></div></div>' +
      '<form class="carte-form" data-form="membre"><h2>Ajouter un membre</h2><p class="aide" style="margin-top:-6px">Un mot de passe provisoire est généré automatiquement.</p>' +
      '<div><label class="lbl" for="n-nom">Nom affiché *</label><input class="champ" id="n-nom" name="nom" required /></div>' +
      '<div><label class="lbl" for="n-id">Identifiant *</label><input class="champ" id="n-id" name="id" required pattern="[a-z0-9._\\-]{2,32}" autocapitalize="none" placeholder="ex. sophie" /></div>' +
      '<div class="grille2"><div><label class="lbl" for="n-role">Rôle</label><select class="champ" id="n-role" name="role"><option value="commercial">Commercial</option><option value="gerant">Gérant</option><option value="controle">Consultation</option><option value="admin">Administrateur</option></select></div>' +
      '<div><label class="lbl" for="n-soc">Société</label><input class="champ" id="n-soc" name="societe" placeholder="ex. VATEA" /></div></div>' +
      '<button class="btn btn-or">Créer le compte</button><div class="aide"><b>Rôles</b><br />Gérant (Hugo, Jeff) : saisit et fait avancer les prospects, voit tout.<br />Commercial : gère son propre portefeuille.<br />Consultation (Marc) : voit tout, ne modifie rien ; confirme seulement ses propres commissions reçues.<br />Administrateur : comptes, mots de passe, date de mise en ligne, correction d’étape tracée.</div></form></div>';
  }

  /* ───────────── Écran de choix du compte ───────────── */
  function ecranChoix() {
    var desc = {
      hugo: 'Saisit les prospects, devis et signatures, suit les paiements clients. Voit les commissions dues à JEGO et à Marc.',
      jeff: 'Même accès qu’Hugo : saisit et fait avancer les prospects. Voit sa commission de 16 % du montant HT signé et confirme ses paiements reçus.',
      marc: 'Consulte les ventes et sa commission de 9 % du montant HT signé, confirme ses paiements reçus. Ne modifie rien d’autre.',
      admin: 'Gère les comptes, les mots de passe et la date de mise en ligne. Peut corriger une erreur d’étape (tracé).'
    };
    return '<main class="ecran-choix"><img class="logo" src="/media/logo-va.png" alt="VATEA" /><div><h1 class="titre-logo"><img class="nom-titre" src="/media/vatea-nom.svg" alt="VATEA" width="150" height="36" /><span>CRM</span></h1><p class="sous">Démonstration avec des données fictives. Choisissez un compte : dans la vraie application, chacun se connecte avec son identifiant et son mot de passe.</p></div>' +
      '<div class="choix-comptes">' + ['hugo', 'jeff', 'marc', 'admin'].map(function (id) {
        var c = S.comptes.find(function (x) { return x.id === id; });
        return '<button type="button" class="choix" data-act="connexion" data-c="' + id + '"><span class="avatar">' + initiales(c.nom) + '</span><span class="role">' + ROLES[c.role] + ' · ' + esc(c.societe) + '</span><b>' + esc(c.nom) + '</b><p>' + desc[id] + '</p></button>';
      }).join('') + '</div><p class="aide">Les modifications restent dans ce navigateur. Bouton « Réinitialiser » pour repartir des données de départ.</p></main>';
  }

  /* ───────────── Fiche prospect ───────────── */
  function lienDoc(id, libelle) { var d = id && doc(id); return d ? '<button type="button" class="lien" data-act="doc-dl" data-d="' + d.id + '">📎 ' + esc(libelle || d.nom) + '</button>' : ''; }
  function rendreFiche() {
    var cont = document.getElementById('fiche');
    if (cont) cont.remove();
    if (!ui.fiche) return;
    var nouveau = ui.fiche.id === 'nouveau', p = nouveau ? { etape: 'nouveau', source: '', entreprise: '' } : prospect(ui.fiche.id), w = ecriture(), o = ui.fiche.onglet || 'fiche';
    if (!p) { ui.fiche = null; return; }
    var sel = function (k, opts, req, dis) { return '<select class="champ" name="' + k + '"' + (req ? ' required' : '') + (dis ? ' disabled' : '') + '><option value="">' + (req ? 'Choisir…' : '—') + '</option>' + opts.map(function (x) { return '<option' + (p[k] === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; };
    var inp = function (k, t, extra) { return '<input class="champ" name="' + k + '" type="' + (t || 'text') + '" value="' + esc(p[k] == null ? '' : p[k]) + '"' + (extra || '') + ' />'; };
    var corps;
    if (o === 'fiche') {
      var bloque = p.sourceVerrouillee && !estAdmin();
      var optionsEtape = ETAPES.map(function (e) {
        var interdit = !estAdmin() && e.id !== 'perdu' && e.id !== p.etape && (p.etape === 'perdu' ? e.id !== (p.etapeAvantPerte || 'nouveau') : e.rang < ETAPE[p.etape].rang);
        return '<option value="' + e.id + '"' + (p.etape === e.id ? ' selected' : '') + (interdit ? ' disabled' : '') + '>' + e.label + (interdit ? ' (retour impossible)' : '') + '</option>';
      }).join('');
      corps = '<fieldset class="panneau-corps" style="border:0;margin:0;min-width:0"' + (w ? '' : ' disabled') + '>' + (w ? '' : '<p class="aide">Consultation : votre accès ne permet pas de modifier la fiche.</p>') +
        (nouveau ? '' : '<div><label class="lbl">Étape</label><select class="champ" data-etape-fiche>' + optionsEtape + '</select>' + (p.etape === 'perdu' && p.raisonPerte ? '<p class="aide">Raison : ' + esc(p.raisonPerte) + (p.etapeAvantPerte ? ' — réactivable en « ' + ETAPE[p.etapeAvantPerte].label + ' »' : '') + '</p>' : '') + '</div>') +
        '<div class="bloc"><div class="bloc-titre">Contact</div><div><label class="lbl">Entreprise *</label>' + inp('entreprise', 'text', ' required') + '</div>' +
        '<div class="grille2"><div><label class="lbl">Personne de contact</label>' + inp('contact') + '</div><div><label class="lbl">Téléphone</label>' + inp('telephone', 'tel') + '</div></div>' +
        '<div class="grille2"><div><label class="lbl">E-mail</label>' + inp('email', 'email') + '</div><div><label class="lbl">Site web</label>' + inp('siteWeb', 'text', ' placeholder="https://"') + '</div></div></div>' +
        '<div class="bloc"><div class="bloc-titre">Projet</div><div><label class="lbl">Source *</label>' + sel('source', SOURCES, true, bloque) +
        (p.sourceVerrouillee ? '<p class="aide">🔒 Verrouillée depuis l’envoi du devis' + (estAdmin() ? ' — toute correction est inscrite dans l’historique.' : ' — seul l’administrateur peut la corriger.') + '</p>' : '') + '</div>' +
        '<div class="grille2"><div><label class="lbl">Type de vidéo</label>' + sel('typeVideo', TYPES_VIDEO) + '</div><div><label class="lbl">Budget estimé HT (€)</label>' + inp('montantEstime', 'text', ' inputmode="decimal"') + '</div></div>' +
        '<div><label class="lbl">Prochaine relance</label>' + inp('relance', 'date') + '</div><div><label class="lbl">Notes</label><textarea class="champ" name="notes">' + esc(p.notes || '') + '</textarea></div></div>' +
        '<p class="erreur" hidden></p></fieldset>';
    } else if (o === 'devis') {
      var d = p.devis, el = eligibilite(p), lc = lignesCommission().filter(function (l) { return l.p.id === p.id; });
      corps = '<div class="panneau-corps"><div class="bloc' + (d && d.dateSignature ? ' or' : '') + '"><div class="bloc-titre">Devis</div>';
      if (!d) corps += '<p class="aide" style="margin:0">Aucun devis enregistré.</p>' + (w && p.etape !== 'perdu' ? '<div><button type="button" class="btn btn-petit" data-act="f-devis">Enregistrer le devis envoyé</button></div>' : '');
      else {
        corps += '<div class="info-ligne"><span>Référence</span><b>' + esc(d.ref) + '</b></div><div class="info-ligne"><span>Envoyé le</span><span>' + dfr(d.dateEnvoi) + '</span></div><div class="info-ligne"><span>Montant HT</span><b>' + eur(d.montantHt) + '</b></div>' +
          '<div class="info-ligne"><span>Statut</span><span class="pastille ' + (p.annulation ? 'p-bad' : d.dateSignature ? 'p-ok' : p.etape === 'perdu' ? 'p-bad' : 'p-info') + '">' + (p.annulation ? 'Annulé le ' + dfr(p.annulation.date) : d.dateSignature ? 'Signé' : p.etape === 'perdu' ? 'Refusé' : 'Envoyé') + '</span></div>';
        if (d.dateSignature) corps += '<div class="info-ligne"><span>Signé le</span><b>' + dfr(d.dateSignature) + '</b></div><div class="info-ligne"><span>Preuve</span><span>' + esc(d.typePreuve) + '</span></div>' +
          '<div class="info-ligne"><span>Fichier</span>' + (d.docPreuve && doc(d.docPreuve) ? lienDoc(d.docPreuve) : (peutJoindrePreuve() ? '<button type="button" class="btn btn-petit btn-or" data-act="joindre-preuve" data-cible="devis">Joindre la preuve</button>' : '<span class="fichier manquant">À joindre</span>')) + '</div>';
        else if (w && p.etape !== 'perdu') corps += '<div><button type="button" class="btn btn-petit" data-act="f-signer">Marquer comme signé</button></div>';
      }
      corps += '</div>';
      if (d && d.dateSignature) {
        corps += '<div class="bloc"><div class="bloc-titre">Avenants signés</div>' + ((p.avenants || []).length ? p.avenants.map(function (a) {
          return '<div class="mvt"><span>' + dfr(a.date) + '</span><span class="ref">' + esc(a.ref) + (a.objet ? ' · ' + esc(a.objet) : '') + '</span><b class="num">' + eur(a.montantHt) + ' HT</b>' +
            (a.docPreuve && doc(a.docPreuve) ? lienDoc(a.docPreuve, 'Preuve') : (peutJoindrePreuve() ? '<button type="button" class="btn btn-petit btn-or" data-act="joindre-preuve" data-cible="' + a.id + '">Joindre la preuve</button>' : '<span class="fichier manquant">Preuve manquante</span>')) + '</div>';
        }).join('') : '<p class="aide" style="margin:0">Aucun avenant.</p>') +
          (w && !p.annulation ? '<div><button type="button" class="btn btn-petit" data-act="f-avenant">+ Avenant signé</button></div>' : '') + '</div>';
        corps += '<div class="bloc"><div class="bloc-titre">Commissions de ce dossier</div>' + (el.ok ? lc.map(function (l) {
          return '<div class="mvt"><span>' + l.type + '</span><span class="ref">' + eur(l.ht) + ' HT</span><span>JEGO ' + eur(l.j) + ' · ' + (l.payeJ ? '✅' : '⏳') + '</span><span>Marc ' + eur(l.m) + ' · ' + (l.payeM ? '✅' : '⏳') + '</span></div>';
        }).join('') + '<p class="aide" style="margin:0">16 % du HT pour JEGO, 9 % du HT pour Marc, acquis à la signature. ✅ payé · ⏳ à payer.</p>' : '<p class="aide" style="margin:0">' + el.raison + ' : pas de commission.</p>') + '</div>';
        corps += '<div class="bloc"><div class="bloc-titre">Paiement du client (suivi)</div><div class="info-ligne"><span>Statut</span>' +
          (p.paiementClient ? '<span class="pastille p-ok">Payé le ' + dfr(p.paiementClient.date) + '</span>' : p.etape === 'facture' ? '<span class="pastille p-warn">Facturé par la coopérative</span>' : '<span class="pastille p-info">Pas encore facturé</span>') + '</div>' +
          (w && !p.paiementClient && !p.annulation ? '<div class="actions-fact">' + (p.etape === 'devis_signe' ? '<button type="button" class="btn btn-petit" data-act="p-facture" data-id="' + p.id + '">Facture envoyée par la coopérative</button>' : '') + '<button type="button" class="btn btn-petit" data-act="p-paye" data-id="' + p.id + '">Le client a payé</button></div>' : '') +
          '<p class="aide" style="margin:0">La coopérative gère la facture et les relances. Sans effet sur les commissions.</p></div>';
        if (w && !p.annulation) corps += '<div><button type="button" class="btn btn-petit btn-danger" data-act="f-annuler">Annuler le contrat signé…</button></div>';
      }
      corps += '</div>';
    } else if (o === 'documents') {
      var ds = S.documents.filter(function (x) { return x.pid === p.id; }).sort(function (a, b) { return a.le < b.le ? 1 : -1; });
      var manquent = ciblesSansPreuve(p);
      corps = '<div class="panneau-corps">' + (manquent.length ? '<div class="bandeau-preuve"><div><b>Preuve de signature manquante</b><span>' + manquent.map(function (c) { return esc(c.libelle); }).join(', ') + ' : la commission ne peut pas être confirmée tant que la preuve n’est pas validée.</span></div>' + (peutJoindrePreuve() ? '<button type="button" class="btn btn-petit btn-or" data-act="joindre-preuve">Joindre / valider la preuve</button>' : '') + '</div>' : '') + (w ? '<div class="depot-type"><label class="lbl" for="type-doc">Type des documents ajoutés</label><select class="champ" id="type-doc" data-input="typeDoc">' + TYPES_DOC.map(function (t) { return '<option' + (t === (ui.typeDoc || 'Autre') ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
        '<label class="depot" data-depot><input type="file" multiple data-input="depot" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" hidden /><b>Ajouter des documents</b><span>Cliquez ou glissez vos fichiers ici · PDF, images, Word, Excel · 10 Mo max</span></label>' : '') +
        (ds.length ? '<ul class="docs">' + ds.map(function (x) {
          return '<li><span class="doc-icone">' + (x.mime.indexOf('pdf') >= 0 ? 'PDF' : x.mime.indexOf('image') >= 0 ? 'IMG' : 'DOC') + '</span><div class="doc-info"><b>' + esc(x.nom) + '</b><span>' + esc(x.type) + ' · ' + taille(x.taille) + ' · ajouté le ' + esc(dheure(x.le)) + ' par ' + esc(x.auteur) + '</span></div>' +
            '<button type="button" class="btn btn-petit" data-act="doc-dl" data-d="' + x.id + '">Télécharger</button>' +
            (peutJoindrePreuve() && !preuveUtilisee(x.id) && manquent.length ? '<button type="button" class="btn btn-petit btn-or" data-act="doc-preuve" data-d="' + x.id + '">Utiliser comme preuve de signature</button>' : '') +
            (preuveUtilisee(x.id) ? '<span class="pastille p-ok" title="Rattaché comme preuve de signature">✓ Preuve du ' + esc(usagePreuve(x.id)) + '</span>' : '') + (estAdmin() ? '<button type="button" class="btn btn-petit btn-danger" data-act="doc-suppr" data-d="' + x.id + '">Supprimer</button>' : '') + '</li>';
        }).join('') + '</ul>' : '<p class="vide">Aucun document pour ce client.</p>') + '</div>';
    } else {
      var j = S.journal.filter(function (x) { return x.pid === p.id; });
      corps = '<div class="panneau-corps">' + (j.length ? '<ul class="journal">' + j.map(function (x) { return '<li><time>' + esc(dheure(x.le)) + '</time><b>' + esc(x.action) + ' — ' + esc(x.auteur) + '</b>' + (x.details ? '<div class="diff">' + esc(x.details) + '</div>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="vide">Aucun événement.</p>') + '</div>';
    }
    var nbDocs = nouveau ? 0 : S.documents.filter(function (x) { return x.pid === p.id; }).length;
    var onglets = nouveau ? '' : '<div class="onglets">' + [['fiche', 'Fiche'], ['devis', 'Devis & suivi'], ['documents', 'Documents' + (nbDocs ? ' (' + nbDocs + ')' : '')], ['historique', 'Historique']].map(function (t) { return '<button type="button" data-act="onglet" data-onglet="' + t[0] + '" class="' + (o === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var contact = nouveau ? '' : '<div class="cta-contact">' +
      (p.email ? '<a class="btn btn-or btn-petit" href="mailto:' + encodeURIComponent(p.email).replace('%40', '@') + '?subject=' + encodeURIComponent('VATEA — votre projet vidéo') + '" data-act="mail" data-id="' + p.id + '">✉️ Envoyer un e-mail</a>' : '<span class="btn btn-petit desactive" title="Ajoutez l’e-mail du client dans la fiche">✉️ Ajoutez l’e-mail du client</span>') +
      (p.telephone ? '<a class="btn btn-petit" href="tel:' + esc(p.telephone.replace(/[^\d+]/g, '')) + '" data-act="tel">📞 Appeler</a>' : '') +
      '<span class="cta-info">' + esc([p.email, p.telephone].filter(Boolean).join(' · ')) + '</span></div>';
    document.getElementById('modale').insertAdjacentHTML('afterbegin',
      '<div class="voile" id="fiche"><form class="panneau" role="dialog" aria-modal="true" aria-label="' + esc(nouveau ? 'Nouveau prospect' : p.entreprise) + '" data-form="fiche" novalidate>' +
      '<div class="panneau-tete"><h2>' + esc(nouveau ? 'Nouveau prospect' : p.entreprise) + '</h2><button type="button" class="btn btn-icone" data-act="fermer-fiche" aria-label="Fermer">✕</button></div>' + contact + onglets + corps +
      '<div class="panneau-pied"><button type="button" class="btn" data-act="fermer-fiche">Fermer</button>' + (o === 'fiche' && w ? '<button class="btn btn-or">' + (nouveau ? 'Créer le prospect' : 'Enregistrer') + '</button>' : '') + '</div></form></div>');
  }

  var LIBELLES = { entreprise: 'Entreprise', contact: 'Contact', telephone: 'Téléphone', email: 'E-mail', siteWeb: 'Site web', source: 'Source', typeVideo: 'Type de vidéo', montantEstime: 'Budget estimé HT', relance: 'Prochaine relance', notes: 'Notes' };
  function enregistrerFiche(form) {
    var nouveau = ui.fiche.id === 'nouveau', p = nouveau ? null : prospect(ui.fiche.id);
    var g = function (k) { return form.elements[k] ? form.elements[k].value.trim() : ''; };
    var v = { entreprise: g('entreprise'), contact: g('contact'), telephone: g('telephone'), email: g('email'), siteWeb: g('siteWeb'), source: form.elements.source.disabled ? p.source : g('source'), typeVideo: g('typeVideo'), relance: g('relance'), notes: g('notes') };
    var me = g('montantEstime'), err = form.querySelector('.erreur');
    v.montantEstime = me ? montant(me) : null;
    var pb = !v.entreprise ? 'Le nom de l’entreprise est obligatoire.' : !v.source ? 'Choisissez une source.' : (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) ? 'Adresse e-mail invalide.' : (me && !(v.montantEstime >= 0)) ? 'Budget invalide.' : '';
    if (pb) { err.textContent = pb; err.hidden = false; return; }
    if (nouveau) {
      p = Object.assign({ id: S.seq.p++, etape: 'nouveau', sourceVerrouillee: false, responsable: S.session, raisonPerte: '', devis: null, avenants: [], annulation: null, paiementClient: null, etapeAvantPerte: null, campagneLe: null, creeLe: auj() }, v);
      S.prospects.unshift(p);
      journaliser('Prospect créé', p.id, v.source);
      ui.fiche = { id: p.id, onglet: 'fiche' };
      toast('Prospect créé.');
    } else {
      var ch = [];
      Object.keys(v).forEach(function (k) {
        var avant = p[k] == null ? '' : String(p[k]), apres = v[k] == null ? '' : String(v[k]);
        if (avant !== apres) ch.push(LIBELLES[k] + ' : ' + (k === 'notes' ? '(texte modifié)' : (avant || '∅') + ' → ' + (apres || '∅')));
      });
      if (!ch.length) { ui.fiche = null; rendre(); return; }
      var srcCorr = p.sourceVerrouillee && p.source !== v.source;
      Object.assign(p, v);
      journaliser(srcCorr ? 'Source verrouillée corrigée par l’administrateur' : 'Fiche modifiée', p.id, ch.join(' · '));
      ui.fiche = null;
      toast('Fiche enregistrée.');
    }
    sauver(); rendre();
  }

  /* ───────────── Exports CSV ───────────── */
  function cellule(v) { var s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = "'" + s; return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function nombre(v) { return v == null || v === '' ? '' : Number(v).toFixed(2).replace('.', ','); }
  function telecharger(nom, lignes) {
    var csv = '﻿' + lignes.map(function (l) { return l.map(cellule).join(';'); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = nom; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function exporterCommissions() {
    var L = lignesCommission().filter(function (l) { return !ui.mois || l.date.slice(0, 7) === ui.mois; });
    var lignes = [['Signé le', 'Type', 'Client', 'Référence', 'HT signé', 'Éligibilité', 'JEGO 16 % du HT', 'Marc 9 % du HT', 'Preuve de signature', 'JEGO facture n°', 'JEGO facturée le', 'JEGO payée le', 'Marc facture n°', 'Marc facturée le', 'Marc payée le']];
    L.forEach(function (l) { lignes.push([dfr(l.date), l.type, l.p.entreprise, l.ref, nombre(l.ht), l.el.raison, l.el.ok ? nombre(l.j) : '', l.el.ok ? nombre(l.m) : '', l.preuveOk ? 'Oui' : 'Manquante', l.factJ ? l.factJ.num : '', l.factJ ? dfr(l.factJ.date) : '', l.payeJ ? dfr(l.payeJ.date) : '', l.factM ? l.factM.num : '', l.factM ? dfr(l.factM.date) : '', l.payeM ? dfr(l.payeM.date) : '']); });
    var el = L.filter(function (l) { return l.el.ok; });
    lignes.push(['TOTAL ÉLIGIBLE', '', '', '', nombre(r2(el.reduce(function (s, l) { return s + l.ht; }, 0))), '', nombre(r2(el.reduce(function (s, l) { return s + l.j; }, 0))), nombre(r2(el.reduce(function (s, l) { return s + l.m; }, 0))), '', '', '']);
    telecharger('vatea-commissions-' + (ui.mois || 'complet') + '.csv', lignes);
    journaliser('Export des commissions', null, ui.mois ? moisLabel(ui.mois) : 'Tous les mois'); sauver();
  }
  function exporterProspects() {
    var lignes = [['ID', 'Entreprise', 'Contact', 'Téléphone', 'E-mail', 'Type de vidéo', 'Source', 'Étape', 'Devis', 'Montant HT', 'Signé le', 'Client payé le', 'Prochaine relance']];
    filtres().forEach(function (p) { lignes.push([p.id, p.entreprise, p.contact, p.telephone, p.email, p.typeVideo, p.source, ETAPE[p.etape].label, p.devis ? p.devis.ref : '', nombre(montantP(p)), dfr(p.devis && p.devis.dateSignature), p.paiementClient ? dfr(p.paiementClient.date) : '', dfr(p.relance)]); });
    telecharger('vatea-prospects-' + auj() + '.csv', lignes);
    journaliser('Export des prospects', null, (lignes.length - 1) + ' lignes'); sauver();
  }

  /* ───────────── Rendu principal ───────────── */
  function rendre() {
    var app = document.getElementById('app');
    if (!moi()) { app.innerHTML = ecranChoix(); document.getElementById('modale').innerHTML = ''; return; }
    if (ui.vue === 'admin' && !estAdmin()) ui.vue = 'pipeline';
    var corps = ui.vue === 'paiements' ? vuePaiements() : ui.vue === 'commissions' ? vueCommissions() : ui.vue === 'historique' ? vueHistorique() : ui.vue === 'admin' ? vueAdmin() : vuePipeline();
    var actif = document.activeElement, rech = actif && actif.dataset && actif.dataset.input === 'q', pos = rech ? actif.selectionStart : 0;
    app.innerHTML = entete() + '<main class="page">' + corps + '</main>';
    if (rech) { var el = app.querySelector('[data-input="q"]'); el.focus(); el.setSelectionRange(pos, pos); }
    rendreFiche();
  }

  /* ───────────── Import de contacts (Excel .xlsx ou CSV), sans bibliothèque externe ───────────── */
  function lireCsv(texte) {
    texte = texte.replace(/^﻿/, '');
    var premiere = texte.split(/\r?\n/)[0] || '';
    var sep = [';', ',', '\t'].reduce(function (m, c) { return (premiere.split(c).length > premiere.split(m).length) ? c : m; }, ';');
    var lignes = [], ligne = [], champ = '', guill = false;
    for (var i = 0; i < texte.length; i++) {
      var ch = texte[i];
      if (guill) { if (ch === '"') { if (texte[i + 1] === '"') { champ += '"'; i++; } else guill = false; } else champ += ch; }
      else if (ch === '"') guill = true;
      else if (ch === sep) { ligne.push(champ); champ = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && texte[i + 1] === '\n') i++; ligne.push(champ); lignes.push(ligne); ligne = []; champ = ''; }
      else champ += ch;
    }
    if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
    return lignes.filter(function (l) { return l.some(function (c) { return String(c).trim() !== ''; }); });
  }
  /** Lit la première feuille d'un fichier .xlsx (zip + XML) avec les outils du navigateur. */
  function lireXlsx(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder();
    var fin = -1;
    for (var i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
    if (fin < 0) return Promise.reject(new Error('Fichier Excel illisible.'));
    var n = dv.getUint16(fin + 10, true), pos = dv.getUint32(fin + 16, true), entrees = {};
    for (var k = 0; k < n; k++) {
      var lnom = dv.getUint16(pos + 28, true), lext = dv.getUint16(pos + 30, true), lcom = dv.getUint16(pos + 32, true);
      entrees[dec.decode(u8.subarray(pos + 46, pos + 46 + lnom))] = { methode: dv.getUint16(pos + 10, true), taille: dv.getUint32(pos + 20, true), local: dv.getUint32(pos + 42, true) };
      pos += 46 + lnom + lext + lcom;
    }
    function lire(nom) {
      var e = entrees[nom]; if (!e) return Promise.resolve(null);
      var debut = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true), data = u8.subarray(debut, debut + e.taille);
      if (e.methode === 0) return Promise.resolve(dec.decode(data));
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Navigateur trop ancien pour lire ce fichier Excel : enregistrez-le en CSV.'));
      return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    var xml = function (t) { return new DOMParser().parseFromString(t, 'application/xml'); };
    var tags = function (d, nom) { return Array.prototype.slice.call(d.getElementsByTagNameNS('*', nom)); };
    return Promise.all([lire('xl/sharedStrings.xml'), lire('xl/workbook.xml'), lire('xl/_rels/workbook.xml.rels')]).then(function (r) {
      var partages = r[0] ? tags(xml(r[0]), 'si').map(function (si) { return tags(si, 't').map(function (t) { return t.textContent; }).join(''); }) : [];
      var chemin = 'xl/worksheets/sheet1.xml';
      if (r[1] && r[2]) {
        var feuille = tags(xml(r[1]), 'sheet')[0], rid = feuille && (feuille.getAttribute('r:id') || feuille.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
        var rel = tags(xml(r[2]), 'Relationship').find(function (x) { return x.getAttribute('Id') === rid; });
        if (rel) { var cible = rel.getAttribute('Target'); chemin = cible.charAt(0) === '/' ? cible.slice(1) : 'xl/' + cible.replace(/^\.\//, ''); }
      }
      return lire(chemin).then(function (t) {
        if (!t) throw new Error('Feuille introuvable dans le fichier Excel.');
        return tags(xml(t), 'row').map(function (row) {
          var cells = [];
          tags(row, 'c').forEach(function (c) {
            var ref = c.getAttribute('r') || '', lettres = (ref.match(/^[A-Z]+/) || [''])[0], col = 0;
            for (var j = 0; j < lettres.length; j++) col = col * 26 + (lettres.charCodeAt(j) - 64);
            col = lettres ? col - 1 : cells.length;
            var type = c.getAttribute('t'), v = tags(c, 'v')[0], val = '';
            if (type === 's') val = v ? (partages[Number(v.textContent)] || '') : '';
            else if (type === 'inlineStr') val = tags(c, 't').map(function (x) { return x.textContent; }).join('');
            else val = v ? v.textContent : '';
            cells[col] = val;
          });
          for (var q = 0; q < cells.length; q++) if (cells[q] == null) cells[q] = '';
          return cells;
        }).filter(function (l) { return l.some(function (x) { return String(x).trim() !== ''; }); });
      });
    });
  }
  var CHAMPS_IMPORT = [
    { k: 'email', label: 'E-mail *', re: /^(e[-\s._]?mail|courriel|mail|adresse e[-\s]?mail|email address)$/i },
    { k: 'entreprise', label: 'Entreprise', re: /^(entreprise|soci[ée]t[ée]|company|organisation|organization|raison sociale|nom de l'entreprise)$/i },
    { k: 'prenom', label: 'Prénom', re: /^(pr[ée]nom|first ?name|given name)$/i },
    { k: 'nom', label: 'Nom', re: /^(nom|last ?name|surname|family name|nom de famille)$/i },
    { k: 'contact', label: 'Contact (nom complet)', re: /^(contact|nom complet|full ?name|name|personne de contact|interlocuteur)$/i },
    { k: 'telephone', label: 'Téléphone', re: /^(t[ée]l[ée]?phone|t[ée]l|phone|gsm|mobile|portable|num[ée]ro)$/i },
    { k: 'siteWeb', label: 'Site web', re: /^(site( web| internet)?|website|web|url)$/i },
    { k: 'notes', label: 'Notes', re: /^(notes?|commentaires?|remarques?|ville|secteur)$/i }
  ];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var imp = null;
  function analyserImport() {
    var m = imp.map, lignes = imp.lignes.slice(imp.avecEntete ? 1 : 0), existants = {}, vus = {}, res = { prets: [], doublonsCrm: 0, doublonsFichier: 0, invalides: [] };
    S.prospects.forEach(function (p) { if (p.email) existants[p.email.toLowerCase()] = 1; });
    var val = function (l, k) { return m[k] === '' || m[k] == null ? '' : String(l[m[k]] == null ? '' : l[m[k]]).trim(); };
    lignes.forEach(function (l, i) {
      var email = val(l, 'email').toLowerCase().replace(/^mailto:/, '');
      if (!EMAIL_RE.test(email)) { res.invalides.push({ ligne: i + (imp.avecEntete ? 2 : 1), valeur: email || '(vide)' }); return; }
      if (existants[email]) { res.doublonsCrm++; return; }
      if (vus[email]) { res.doublonsFichier++; return; }
      vus[email] = 1;
      var contact = val(l, 'contact') || [val(l, 'prenom'), val(l, 'nom')].filter(Boolean).join(' ');
      var dom = email.split('@')[1].split('.')[0], entreprise = val(l, 'entreprise') || contact || (dom.charAt(0).toUpperCase() + dom.slice(1));
      res.prets.push({ email: email, entreprise: entreprise.slice(0, 200), contact: contact.slice(0, 200), telephone: val(l, 'telephone').slice(0, 50), siteWeb: val(l, 'siteWeb').slice(0, 300), notes: val(l, 'notes').slice(0, 2000) });
    });
    return res;
  }
  function fenetreImport(contenu) {
    var el = document.getElementById('import'); if (el) el.remove();
    document.getElementById('modale').insertAdjacentHTML('beforeend', '<div class="modale-voile" id="import"><div class="modale modale-large" role="dialog" aria-modal="true" aria-label="Importer des contacts">' + contenu + '</div></div>');
  }
  function etapeImportChoix(erreur) {
    imp = null;
    fenetreImport('<h3>Importer des contacts</h3><p>Fichier <b>Excel (.xlsx)</b> ou <b>CSV</b>, une ligne par contact, avec au minimum une colonne e-mail. Les fiches sont créées en « Nouveau » ; les doublons sont ignorés.</p>' +
      '<label class="depot" data-depot-import><input type="file" accept=".xlsx,.csv,.txt" data-input="fichier-import" hidden /><b>Choisir le fichier</b><span>ou le glisser ici</span></label>' +
      (erreur ? '<p class="erreur">' + esc(erreur) + '</p>' : '') +
      '<p class="aide">Pas sûr du format ? <button type="button" class="lien" data-act="modele-import">Télécharger un modèle (CSV)</button>. Rappel : une campagne commerciale doit proposer un lien de désinscription dans chaque e-mail.</p>' +
      '<div class="actions"><button type="button" class="btn" data-act="fermer-import">Annuler</button></div>');
  }
  function chargerFichierImport(f) {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return etapeImportChoix('Fichier trop lourd (20 Mo maximum).');
    var xlsx = /\.xlsx$/i.test(f.name);
    if (/\.xls$/i.test(f.name)) return etapeImportChoix('Ancien format Excel (.xls) : enregistrez le fichier en .xlsx ou en CSV.');
    var lecture = xlsx ? f.arrayBuffer().then(lireXlsx) : f.text().then(lireCsv);
    fenetreImport('<h3>Lecture du fichier…</h3><p>' + esc(f.name) + '</p>');
    lecture.then(function (lignes) {
      if (!lignes.length) return etapeImportChoix('Le fichier est vide.');
      var entetes = lignes[0].map(function (x) { return String(x).trim(); });
      var map = {}, trouve = false;
      CHAMPS_IMPORT.forEach(function (c) { var i = entetes.findIndex(function (h) { return c.re.test(h); }); map[c.k] = i >= 0 ? i : ''; if (i >= 0) trouve = true; });
      var avecEntete = trouve;
      if (!avecEntete) { var ie = lignes[0].findIndex(function (x) { return EMAIL_RE.test(String(x).trim()); }); map.email = ie >= 0 ? ie : ''; }
      imp = { nom: f.name, lignes: lignes, entetes: avecEntete ? entetes : lignes[0].map(function (x, i) { return 'Colonne ' + (i + 1); }), avecEntete: avecEntete, map: map, source: 'Prospection de Hugo' };
      etapeImportCorrespondance();
    }).catch(function (e) { etapeImportChoix(e.message || 'Fichier illisible.'); });
  }
  function etapeImportCorrespondance() {
    var a = analyserImport(), nbCol = Math.max.apply(null, imp.lignes.map(function (l) { return l.length; }));
    var options = function (k) { return '<option value="">— ignorer —</option>' + Array.from({ length: nbCol }, function (x, i) { return '<option value="' + i + '"' + (String(imp.map[k]) === String(i) ? ' selected' : '') + '>' + esc(imp.entetes[i] || 'Colonne ' + (i + 1)) + '</option>'; }).join(''); };
    var apercu = a.prets.slice(0, 5);
    fenetreImport('<h3>Importer « ' + esc(imp.nom) + ' »</h3><p>' + (imp.lignes.length - (imp.avecEntete ? 1 : 0)).toLocaleString('fr-BE') + ' ligne(s) lue(s). Vérifiez la correspondance des colonnes :</p>' +
      '<div class="corresp">' + CHAMPS_IMPORT.map(function (c) { return '<label><span class="lbl">' + c.label + '</span><select class="champ" data-map="' + c.k + '">' + options(c.k) + '</select></label>'; }).join('') + '</div>' +
      '<label class="ligne-entete"><input type="checkbox" data-input="avecEntete"' + (imp.avecEntete ? ' checked' : '') + ' /> La première ligne contient les titres des colonnes</label>' +
      '<div><label class="lbl" for="imp-source">Source des fiches créées</label><select class="champ" id="imp-source" data-input="sourceImport">' + SOURCES.map(function (s) { return '<option' + (s === imp.source ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></div>' +
      '<div class="bilan"><div class="ok"><b>' + a.prets.length.toLocaleString('fr-BE') + '</b><span>à importer</span></div><div><b>' + a.doublonsCrm.toLocaleString('fr-BE') + '</b><span>déjà dans le CRM</span></div><div><b>' + a.doublonsFichier.toLocaleString('fr-BE') + '</b><span>en double dans le fichier</span></div><div class="' + (a.invalides.length ? 'ko' : '') + '"><b>' + a.invalides.length.toLocaleString('fr-BE') + '</b><span>e-mail manquant ou invalide</span></div></div>' +
      (a.invalides.length ? '<p class="aide">Lignes ignorées : ' + a.invalides.slice(0, 6).map(function (x) { return 'ligne ' + x.ligne + ' (' + esc(x.valeur) + ')'; }).join(', ') + (a.invalides.length > 6 ? '…' : '') + '</p>' : '') +
      (apercu.length ? '<div class="tableau-wrap apercu"><table class="tableau"><thead><tr><th>Entreprise</th><th>Contact</th><th>E-mail</th><th>Téléphone</th></tr></thead><tbody>' + apercu.map(function (x) { return '<tr><td>' + esc(x.entreprise) + '</td><td>' + esc(x.contact || '—') + '</td><td>' + esc(x.email) + '</td><td>' + esc(x.telephone || '—') + '</td></tr>'; }).join('') + '</tbody></table></div><p class="aide">Aperçu des 5 premières fiches.</p>' : '') +
      '<div class="actions"><button type="button" class="btn" data-act="fermer-import">Annuler</button><button type="button" class="btn" data-act="import-retour">Autre fichier</button><button type="button" class="btn btn-or" data-act="import-go"' + (a.prets.length ? '' : ' disabled') + '>Créer ' + a.prets.length.toLocaleString('fr-BE') + ' fiche(s)</button></div>');
  }
  function executerImport() {
    var a = analyserImport(), lot = 'imp' + Date.now().toString(36), ts = maintenant(), m = moi();
    a.prets.forEach(function (x) {
      var p = { id: S.seq.p++, entreprise: x.entreprise, contact: x.contact, email: x.email, telephone: x.telephone, siteWeb: x.siteWeb, typeVideo: '', montantEstime: null, source: imp.source, sourceVerrouillee: false,
        etape: 'nouveau', responsable: S.session, relance: '', notes: [x.notes, 'Importé depuis « ' + imp.nom + ' » le ' + dheure(ts) + '.'].filter(Boolean).join('\n'), raisonPerte: '', devis: null, avenants: [], annulation: null, paiementClient: null,
        etapeAvantPerte: null, campagneLe: null, creeLe: auj(), importLot: lot };
      S.prospects.unshift(p);
      S.journal.unshift({ le: ts, auteur: m.nom, action: 'Prospect créé par import', pid: p.id, details: imp.nom });
    });
    journaliser('Import de contacts', null, a.prets.length + ' fiche(s) créée(s) depuis « ' + imp.nom + ' » (source : ' + imp.source + ') — ignorés : ' + a.doublonsCrm + ' déjà présents, ' + a.doublonsFichier + ' doublons, ' + a.invalides.length + ' invalides');
    var ok = sauver2();
    var el = document.getElementById('import'); if (el) el.remove();
    ui.mode = 'liste'; ui.etapeListe = 'nouveau'; ui.source = imp.source; ui.page = 1; ui.vue = 'pipeline';
    var n = a.prets.length; imp = null; rendre();
    toast(n.toLocaleString('fr-BE') + ' fiche(s) créée(s) en « Nouveau ».' + (ok ? '' : ' Attention : la mémoire du navigateur est pleine, la démo ne pourra pas tout conserver.'), !ok);
  }
  function sauver2() { try { localStorage.setItem(CLE, JSON.stringify(S)); return true; } catch (e) { return false; } }
  function telechargerModele() {
    telecharger('modele-import-contacts.csv', [['Entreprise', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Site web', 'Notes'], ['Exemple SPRL', 'Marie', 'Dupont', 'marie.dupont@exemple.be', '+32 470 00 00 00', 'https://exemple.be', 'Rencontrée au salon'], ['Autre Exemple SA', 'Luc', 'Martin', 'luc@autre-exemple.be', '', '', '']]);
  }

  /* ───────────── Événements ───────────── */
  function ajouterFichiers(liste) {
    var p = prospect(ui.fiche && ui.fiche.id); if (!p || !ecriture()) return;
    var ok = 0, refus = [];
    var rattaches = [];
    Array.prototype.forEach.call(liste, function (f) {
      if (f.size > TAILLE_MAX) { refus.push(f.name); return; }
      var type = ui.typeDoc || 'Autre', id = ajouterDocument(p.id, f, type); ok++;
      if (/preuve|contrat/i.test(type)) { var r = rattacherPreuve(p, id); if (r) rattaches.push(r); }
    });
    sauver(); rendre();
    if (rattaches.length) toast('Preuve rattachée au ' + rattaches.join(', ') + ' : la commission peut être confirmée.');
    else if (ok && ciblesSansPreuve(p).length) {
      // Fichier ajouté avec un autre type (ex. « Devis ») alors qu'une preuve manque : on demande explicitement.
      var dernier = S.documents[S.documents.length - 1];
      confirmer('Est-ce la preuve de signature ?', 'Il manque la preuve de signature du <b>' + esc(ciblesSansPreuve(p)[0].libelle) + '</b>. Le fichier « ' + esc(dernier.nom) + ' » est-il ce document signé ?', 'Oui, c’est la preuve', function () { modaleJoindrePreuve(p, null, dernier.id); });
    }
    else if (ok) toast(ok + ' document(s) ajouté(s).');
    if (refus.length) toast('Trop lourd (10 Mo max) : ' + refus.join(', '), true);
  }

  document.addEventListener('click', function (ev) {
    if (ev.target.matches && ev.target.matches('input[type="date"]') && ev.target.showPicker && !ev.target.disabled) { try { ev.target.showPicker(); } catch (e) { /* navigateur sans showPicker */ } }
    var t = ev.target.closest('[data-act]');
    if (!t) { if (ev.target.classList.contains('voile')) { ui.fiche = null; rendreFiche(); } else if (ev.target.classList.contains('modale-voile')) fermerModale(ev.target); return; }
    var act = t.dataset.act;
    if (t.tagName === 'A' && act !== 'mail' && act !== 'tel') ev.preventDefault();
    switch (act) {
      case 'connexion': {
        var c = S.comptes.find(function (x) { return x.id === t.dataset.c; });
        if (!c.actif) return toast('Ce compte est désactivé.', true);
        S.session = c.id; c.derniere = maintenant(); journaliser('Connexion'); sauver(); ui.vue = 'pipeline'; ui.fiche = null; rendre(); window.scrollTo(0, 0); break;
      }
      case 'changer-compte': S.session = null; ui.fiche = null; sauver(); rendre(); window.scrollTo(0, 0); break;
      case 'reinitialiser':
        confirmer('Réinitialiser la démo ?', 'Toutes vos modifications et les documents ajoutés seront effacés, et les données fictives de départ rechargées.', 'Réinitialiser', function () {
          var sess = S.session; S = etatInitial(); S.session = sess; sauver(); fichiers.vider().catch(function () {}); ui.fiche = null; o_apres = function () { rendre(); toast('Démo réinitialisée.'); };
        });
        break;
      case 'vue': ui.vue = t.dataset.vue; ui.fiche = null; rendre(); window.scrollTo(0, 0); break;
      case 'mode': ui.mode = t.dataset.mode; try { localStorage.setItem(CLE + '-mode', ui.mode); } catch (e) { /* */ } rendre(); break;
      case 'perdu-toggle': ui.perduOuvert = !ui.perduOuvert; rendre(); if (ui.perduOuvert) { var kb = document.querySelector('.kanban'); if (kb) kb.scrollLeft = kb.scrollWidth; } break;
      case 'nouveau': ui.fiche = { id: 'nouveau', onglet: 'fiche' }; rendreFiche(); break;
      case 'fiche': ui.fiche = { id: Number(t.dataset.id), onglet: t.dataset.onglet || 'fiche' }; rendreFiche(); break;
      case 'onglet': ui.fiche.onglet = t.dataset.onglet; rendreFiche(); break;
      case 'fermer-fiche': ui.fiche = null; rendreFiche(); break;
      case 'modale-annuler': fermerModale(t.closest('[data-modale]')); break;
      case 'mail': {
        var pm = prospect(t.dataset.id);
        journaliser('E-mail ouvert dans la messagerie', pm.id, pm.email);
        sauver();
        if (pm.etape === 'nouveau' && ecriture()) setTimeout(function () {
          confirmer('Passer en « Contacté » ?', 'Votre messagerie s’est ouverte pour écrire à ' + esc(pm.contact || pm.entreprise) + '. Une fois l’e-mail envoyé, voulez-vous passer ce prospect en « Contacté » ?', 'Passer en Contacté', function () {
            pm.etape = 'contacte'; journaliser('Étape changée', pm.id, 'Nouveau → Contacté (après e-mail)'); sauver(); o_apres = function () { rendre(); toast(pm.entreprise + ' → Contacté'); };
          });
        }, 400);
        break;
      }
      case 'tel': break;
      case 'f-devis': { var p1 = prospect(ui.fiche.id); demanderDevis(p1, function () { var pp = prospect(ui.fiche.id); if (ETAPE[pp.etape].rang < ETAPE.devis_envoye.rang) avancer(pp, 'devis_envoye'); else rendre(); }); break; }
      case 'f-signer': avancer(prospect(ui.fiche.id), 'devis_signe'); break;
      case 'p-facture': avancer(prospect(t.dataset.id), 'facture'); break;
      case 'p-paye': {
        var pp2 = prospect(t.dataset.id);
        if (pp2.etape === 'devis_signe' || pp2.etape === 'facture') avancer(pp2, 'paye');
        else demanderPaiementClient(pp2, rendre);
        break;
      }
      case 'f-avenant': {
        var pa = prospect(ui.fiche.id);
        ouvrirModale({ titre: pa.entreprise + ' — avenant signé', texte: 'Un avenant signé ajoute une ligne de commission sur son montant HT (16 % pour JEGO, 9 % pour Marc).', bouton: 'Enregistrer l’avenant',
          champs: [
            { k: 'ref', label: 'Référence', req: true, demi: true, val: pa.devis.ref.replace('DEV', 'AVN') + '-' + ((pa.avenants || []).length + 1) },
            { k: 'date', label: 'Date de signature', type: 'date', req: true, demi: true, val: auj(), max: auj(), min: pa.devis.dateSignature },
            { k: 'objet', label: 'Objet', val: '' },
            { k: 'montantHt', label: 'Montant HT (€)', req: true, demi: true, mode: 'decimal' },
            { k: 'typePreuve', label: 'Type de preuve', type: 'select', options: TYPES_PREUVE, req: true, demi: true },
            { k: 'fichier', label: 'Preuve de signature', type: 'file' }
          ],
          onOk: function (v, f) {
            var m = montant(v.montantHt); if (!(m > 0)) return 'Montant HT invalide.';
            if (v.date < pa.devis.dateSignature) return 'L’avenant ne peut pas précéder la signature du devis.';
            var a = { id: uid('av'), ref: v.ref, date: v.date, montantHt: m, objet: v.objet, typePreuve: v.typePreuve, docPreuve: f.fichier ? ajouterDocument(pa.id, f.fichier, 'Preuve de signature') : null };
            pa.avenants = (pa.avenants || []).concat([a]);
            journaliser('Avenant signé', pa.id, v.ref + ' — ' + eur(m) + ' HT' + (eligibilite(pa).ok ? ' — commission : JEGO ' + eur(r2(m * TAUX_J)) + ', Marc ' + eur(r2(m * TAUX_M)) : ''));
            sauver(); o_apres = rendre; return null;
          } });
        break;
      }
      case 'f-annuler': {
        var pn = prospect(ui.fiche.id), tot = htSigne(pn);
        ouvrirModale({ titre: 'Annuler le contrat signé', texte: 'Le contrat de ' + esc(pn.entreprise) + ' (' + eur(tot) + ' HT) sera annulé : une ligne négative de commission sera ajoutée (JEGO ' + eur(-r2(tot * TAUX_J)) + ', Marc ' + eur(-r2(tot * TAUX_M)) + '), sans rien effacer. Le prospect passe en « Perdu ».', bouton: 'Annuler le contrat',
          champs: [{ k: 'date', label: 'Date d’annulation', type: 'date', req: true, val: auj(), max: auj() }, { k: 'raison', label: 'Raison', type: 'textarea', req: true }],
          onOk: function (v) {
            pn.annulation = { date: v.date, raison: v.raison, montantHt: tot };
            pn.etapeAvantPerte = pn.etape; pn.etape = 'perdu'; pn.raisonPerte = 'Contrat annulé : ' + v.raison;
            journaliser('Contrat annulé', pn.id, eur(tot) + ' HT — ' + v.raison);
            sauver(); o_apres = rendre; return null;
          } });
        break;
      }
      case 'joindre-preuve': modaleJoindrePreuve(prospect(t.dataset.p ? Number(t.dataset.p) : ui.fiche.id), t.dataset.cible, t.dataset.d); break;
      case 'doc-dl': telechargerDocument(t.dataset.d); break;
      case 'doc-preuve': modaleJoindrePreuve(prospect(ui.fiche.id), null, t.dataset.d); break;
      case 'doc-suppr': {
        var dd = doc(t.dataset.d);
        confirmer('Supprimer ce document ?', esc(dd.nom) + ' sera supprimé. La suppression est inscrite dans l’historique.', 'Supprimer', function () {
          S.documents = S.documents.filter(function (x) { return x.id !== dd.id; });
          S.prospects.forEach(function (p) { if (p.devis && p.devis.docPreuve === dd.id) p.devis.docPreuve = null; (p.avenants || []).forEach(function (a) { if (a.docPreuve === dd.id) a.docPreuve = null; }); });
          fichiers.supprimer(dd.id).catch(function () {});
          journaliser('Document supprimé par l’administrateur', dd.pid, dd.type + ' — ' + dd.nom); sauver(); o_apres = rendre;
        });
        break;
      }
      case 'com-facture': modaleFacture(t.dataset.l); break;
      case 'com-payee': {
        var l = lignesCommission().find(function (x) { return x.id === t.dataset.l; }), b = t.dataset.b, mm = moi();
        if (!l || (b === 'j' && mm.id !== 'jeff') || (b === 'm' && mm.id !== 'marc')) return toast('Seul le bénéficiaire peut confirmer son paiement.', true);
        if (!l.preuveOk) return toast('Preuve de signature manquante.', true);
        if (!(b === 'j' ? l.factJ : l.factM)) return toast('Déclarez d’abord la facture envoyée à la coopérative.', true);
        var montantB = b === 'j' ? l.j : l.m, neg = l.ht < 0;
        ouvrirModale({ titre: neg ? 'Confirmer la déduction' : 'Confirmer que vous avez été payé', texte: l.p.entreprise + ' — ' + l.type.toLowerCase() + ' ' + esc(l.ref) + ' : <b>' + eur(montantB) + '</b> (' + (b === 'j' ? '16' : '9') + ' % de ' + eur(l.ht) + ' HT). Une fois confirmée, la ligne est figée.', bouton: 'Confirmer',
          champs: [{ k: 'date', label: neg ? 'Date de la déduction' : 'Date de réception du paiement de la coopérative', type: 'date', req: true, val: auj(), max: auj() }],
          onOk: function (v) {
            S.comPayee[l.id] = S.comPayee[l.id] || {};
            S.comPayee[l.id][b] = { date: v.date, par: mm.nom };
            journaliser(neg ? 'Déduction de commission confirmée' : 'Commission reçue (' + (b === 'j' ? 'JEGO 16 % du HT' : 'Marc 9 % du HT') + ')', l.p.id, l.ref + ' — ' + eur(montantB) + ' le ' + dfr(v.date));
            sauver(); o_apres = function () { rendre(); toast('Paiement confirmé : ' + eur(montantB) + '. Ligne figée.'); }; return null;
          } });
        break;
      }
      case 'campagne': {
        var nouveaux = S.prospects.filter(function (p) { return p.etape === 'nouveau' && p.email; });
        var externe = !S.prospects.some(function (p) { return p.email === 'lea@fleuriste-ixelles.example'; });
        var opts;
        if (nouveaux.length > 15) {
          var parSource = {};
          nouveaux.forEach(function (p) { parSource[p.source] = (parSource[p.source] || 0) + 1; });
          opts = Object.keys(parSource).map(function (src) { return { v: 'src:' + src, checked: true, label: '<b>' + esc(src) + '</b> — ' + parSource[src].toLocaleString('fr-BE') + ' contact(s) « Nouveau » avec e-mail <span class="aide">(→ Contacté)</span>' }; });
        } else opts = nouveaux.map(function (p) { return { v: 'p' + p.id, checked: true, label: esc(p.entreprise) + ' — ' + esc(p.email) + ' <span class="aide">(Nouveau → Contacté)</span>' }; });
        if (externe) opts.push({ v: 'externe', checked: true, label: 'Fleuriste Ixelles (fictif) — lea@fleuriste-ixelles.example <span class="aide">(absent du CRM : créé en Contacté)</span>' });
        if (!opts.length) return toast('Aucun prospect « Nouveau » avec une adresse e-mail à contacter.', true);
        ouvrirModale({ titre: 'Simuler l’envoi de la campagne', texte: 'Dans le vrai CRM, l’outil de campagne prévient le CRM à chaque e-mail envoyé : le prospect passe tout seul en « Contacté ».', bouton: 'Envoyer la campagne',
          champs: [{ k: 'nom', label: 'Nom de la campagne', req: true, val: 'Relance automne' }, { k: 'cibles', label: 'Destinataires', type: 'checks', options: opts }],
          onOk: function (v) {
            if (!v.cibles.length) return 'Cochez au moins un destinataire.';
            var n = 0, ts = maintenant();
            var cibles = [];
            v.cibles.forEach(function (c) {
              if (c.indexOf('src:') === 0) nouveaux.forEach(function (p) { if (p.source === c.slice(4)) cibles.push('p' + p.id); });
              else cibles.push(c);
            });
            cibles.forEach(function (c) {
              if (c === 'externe') {
                var np = { id: S.seq.p++, entreprise: 'Fleuriste Ixelles (fictif)', contact: 'Léa Martin', email: 'lea@fleuriste-ixelles.example', telephone: '', siteWeb: '', typeVideo: '', montantEstime: null, source: 'Campagne e-mail', sourceVerrouillee: false,
                  etape: 'contacte', responsable: 'hugo', relance: auj(3), notes: 'Contact créé par la campagne « ' + v.nom + ' ».', raisonPerte: '', devis: null, avenants: [], annulation: null, paiementClient: null, etapeAvantPerte: null, creeLe: auj(), campagneLe: ts };
                S.prospects.unshift(np); journaliser('Contact créé par la campagne', np.id, v.nom + ' — ' + np.email, 'Campagne automatique');
              } else {
                var p = prospect(c.slice(1));
                if (p.etape !== 'nouveau') return;
                p.etape = 'contacte'; p.campagneLe = ts; if (!p.relance) p.relance = auj(3);
                journaliser('Contacté par la campagne automatique', p.id, v.nom + ' — Nouveau → Contacté', 'Campagne automatique');
              }
              n++;
            });
            sauver(); o_apres = function () { rendre(); toast('Campagne « ' + v.nom + ' » : ' + n + ' contact(s) passé(s) automatiquement en « Contacté ».'); }; return null;
          } });
        break;
      }
      case 'import': etapeImportChoix(); break;
      case 'fermer-import': { var fi = document.getElementById('import'); if (fi) fi.remove(); imp = null; break; }
      case 'import-retour': etapeImportChoix(); break;
      case 'import-go': executerImport(); break;
      case 'modele-import': telechargerModele(); break;
      case 'voir-liste': ui.mode = 'liste'; ui.etapeListe = t.dataset.etape; ui.page = 1; try { localStorage.setItem(CLE + '-mode', 'liste'); } catch (e) { /* */ } rendre(); window.scrollTo(0, 0); break;
      case 'page': ui.page = Math.max(1, Number(t.dataset.p)); rendre(); window.scrollTo(0, 0); break;
      case 'export-commissions': exporterCommissions(); toast('Export CSV téléchargé (ouvrable dans Excel).'); break;
      case 'export-prospects': exporterProspects(); toast('Liste exportée (CSV).'); break;
      case 'mdp': {
        var c2 = S.comptes.find(function (x) { return x.id === t.dataset.c; });
        confirmer('Générer un nouveau mot de passe ?', 'L’ancien mot de passe de ' + esc(c2.nom) + ' ne fonctionnera plus et ses sessions seront fermées.', 'Générer', function () {
          c2.provisoire = true; journaliser('Mot de passe réinitialisé', null, c2.id); sauver(); o_apres = function () { rendre(); afficherMdp(c2); };
        });
        break;
      }
      case 'actif': {
        var c3 = S.comptes.find(function (x) { return x.id === t.dataset.c; });
        if (c3.actif && c3.role === 'admin' && S.comptes.filter(function (x) { return x.role === 'admin' && x.actif; }).length <= 1) return toast('Il doit rester au moins un administrateur actif.', true);
        c3.actif = !c3.actif; journaliser(c3.actif ? 'Compte réactivé' : 'Compte désactivé', null, c3.id); sauver(); rendre(); toast(c3.nom + (c3.actif ? ' est réactivé.' : ' est désactivé et déconnecté.'));
        break;
      }
      case 'copier': try { navigator.clipboard.writeText(t.dataset.v); t.textContent = 'Copié ✓'; } catch (er) { /* */ } break;
    }
  });
  function afficherMdp(c) {
    var mdp = motDePasse();
    ouvrirModale({ titre: 'Mot de passe provisoire', texte: '<b>' + esc(c.nom) + '</b> — identifiant <b>' + esc(c.id) + '</b></p><div class="mdp-affiche">' + mdp + '</div><p class="aide">Il ne sera plus jamais affiché. Transmettez-le en privé ; la personne devra le remplacer à sa première connexion. <button type="button" class="btn btn-petit" data-act="copier" data-v="' + mdp + '">Copier</button>', bouton: 'J’ai transmis le mot de passe', champs: [], onOk: function () { return null; } });
  }

  document.addEventListener('input', function (ev) {
    var k = ev.target.dataset && ev.target.dataset.input;
    if (k === 'q') { ui.q = ev.target.value; ui.page = 1; rendre(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, k = t.dataset && t.dataset.input;
    if (k === 'source') { ui.source = t.value; ui.page = 1; rendre(); }
    else if (k === 'mois') { ui.mois = t.value; rendre(); }
    else if (k === 'resteSeulement') { ui.resteSeulement = t.checked; rendre(); }
    else if (k === 'typeDoc') { ui.typeDoc = t.value; }
    else if (k === 'fichier-import') { chargerFichierImport(t.files && t.files[0]); }
    else if (k === 'avecEntete' && imp) { imp.avecEntete = t.checked; etapeImportCorrespondance(); }
    else if (k === 'sourceImport' && imp) { imp.source = t.value; }
    else if (k === 'etapeListe') { ui.etapeListe = t.value; ui.page = 1; rendre(); }
    else if (t.dataset && t.dataset.map && imp) { imp.map[t.dataset.map] = t.value === '' ? '' : Number(t.value); etapeImportCorrespondance(); }
    else if (k === 'depot') { ajouterFichiers(t.files); }
    else if (k === 'miseEnLigne' && t.value) { var av = S.miseEnLigne; S.miseEnLigne = t.value; journaliser('Date de mise en ligne modifiée', null, dfr(av) + ' → ' + dfr(t.value)); sauver(); rendre(); toast('Période éligible recalculée.'); }
    else if (t.dataset && t.dataset.role) {
      var c = S.comptes.find(function (x) { return x.id === t.dataset.role; }), av2 = c.role;
      if (av2 === 'admin' && t.value !== 'admin' && S.comptes.filter(function (x) { return x.role === 'admin' && x.actif; }).length <= 1) { t.value = av2; return toast('Il doit rester au moins un administrateur actif.', true); }
      c.role = t.value; journaliser('Rôle modifié', null, c.id + ' : ' + ROLES[av2] + ' → ' + ROLES[c.role]); sauver(); rendre(); toast(c.nom + ' : ' + ROLES[c.role]);
    } else if (t.hasAttribute && t.hasAttribute('data-etape-fiche')) {
      var p = prospect(ui.fiche.id), cible = t.value; t.value = p.etape; avancer(p, cible);
    }
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (f.dataset.form === 'fiche') { ev.preventDefault(); enregistrerFiche(f); }
    else if (f.dataset.form === 'membre') {
      ev.preventDefault();
      var id = f.elements.id.value.trim().toLowerCase(), nom = f.elements.nom.value.trim();
      if (!/^[a-z0-9._-]{2,32}$/.test(id)) return toast('Identifiant : 2 à 32 caractères (minuscules, chiffres, . _ -).', true);
      if (!nom) return toast('Le nom est obligatoire.', true);
      if (S.comptes.some(function (c) { return c.id === id; })) return toast('Cet identifiant existe déjà.', true);
      var c = { id: id, nom: nom, societe: f.elements.societe.value.trim() || 'VATEA', role: f.elements.role.value, actif: true, provisoire: true, derniere: '' };
      S.comptes.push(c); journaliser('Compte créé', null, id + ' — ' + ROLES[c.role]); sauver(); rendre(); afficherMdp(c);
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { if (document.getElementById('import')) { document.getElementById('import').remove(); imp = null; return; } if (document.querySelector('[data-modale]')) fermerModale(); else if (ui.fiche) { ui.fiche = null; rendreFiche(); } }
    if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.act === 'perdu-toggle') { ui.perduOuvert = true; rendre(); }
  });

  // Glisser-déposer des cartes et des documents (rien n'est redessiné pendant le survol)
  var glisse = null;
  document.addEventListener('dragstart', function (ev) { var c = ev.target.closest && ev.target.closest('.carte[draggable]'); if (!c) return; glisse = Number(c.dataset.id); ev.dataTransfer.setData('text/plain', String(glisse)); ev.dataTransfer.effectAllowed = 'move'; c.classList.add('glisse'); });
  document.addEventListener('dragend', function () { glisse = null; document.querySelectorAll('.glisse, .survol').forEach(function (n) { n.classList.remove('glisse', 'survol'); }); });
  document.addEventListener('dragover', function (ev) {
    var depot = ev.target.closest && ev.target.closest('[data-depot], [data-depot-import]');
    if (depot) { ev.preventDefault(); depot.classList.add('survol'); return; }
    var col = ev.target.closest && ev.target.closest('.colonne[data-etape]'); if (!col || glisse == null) return;
    ev.preventDefault(); document.querySelectorAll('.survol').forEach(function (n) { if (n !== col) n.classList.remove('survol'); }); col.classList.add('survol');
  });
  document.addEventListener('dragleave', function (ev) { var depot = ev.target.closest && ev.target.closest('[data-depot]'); if (depot && !depot.contains(ev.relatedTarget)) depot.classList.remove('survol'); });
  document.addEventListener('drop', function (ev) {
    var depotImp = ev.target.closest && ev.target.closest('[data-depot-import]');
    if (depotImp) { ev.preventDefault(); if (ev.dataTransfer.files && ev.dataTransfer.files[0]) chargerFichierImport(ev.dataTransfer.files[0]); return; }
    var depot = ev.target.closest && ev.target.closest('[data-depot]');
    if (depot) { ev.preventDefault(); depot.classList.remove('survol'); if (ev.dataTransfer.files && ev.dataTransfer.files.length) ajouterFichiers(ev.dataTransfer.files); return; }
    var col = ev.target.closest && ev.target.closest('.colonne[data-etape]'); if (!col) return;
    ev.preventDefault(); col.classList.remove('survol');
    var id = Number(ev.dataTransfer.getData('text/plain')), p = prospect(id); glisse = null;
    if (p && p.etape !== col.dataset.etape) avancer(p, col.dataset.etape);
  });

  rendre();
})();
