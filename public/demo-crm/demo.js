/* VATEA — démonstration du CRM (données fictives, enregistrées dans ce navigateur uniquement).
   Règles reprises du cahier des charges v1.0 du 22/10/2026 :
   § 7 rôles (Hugo saisit ; Jeff et Marc contrôlent en lecture ; administrateur distinct),
   § 8 processus et statuts, § 9 justificatifs et rapport mensuel, § 10 calcul des commissions, § 11 alertes. */
(function () {
  'use strict';

  var CLE = 'vatea-demo-crm-v2';
  var TAUX_J = 0.16, TAUX_M = 0.09, TVA = 0.21;

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

  var SOURCES = ['Formulaire du site', 'Apport JEGO', 'Apport EI BRETZNER MARC', 'Recommandation', 'Réseau / LinkedIn / Instagram', 'Salon / événement', 'Prospection directe', 'Autre'];
  var TYPES_VIDEO = ['Vidéo corporate', 'Vidéo publicitaire', 'Vidéo de formation', 'Autre'];
  var TYPES_PREUVE = ['Devis signé (PDF)', 'Bon de commande', 'Contrat', 'Accord par e-mail', 'Signature électronique'];
  var ROLES = { admin: 'Administrateur', gerant: 'Gérant', commercial: 'Commercial', controle: 'Contrôle' };
  var STATUTS_COM = [
    { id: 'a_verifier', label: 'À vérifier', cl: 'p-warn' },
    { id: 'validee', label: 'Validée', cl: 'p-info' },
    { id: 'facturee', label: 'Facturée', cl: 'p-info' },
    { id: 'reglee', label: 'Réglée', cl: 'p-ok' },
    { id: 'regularisee', label: 'Régularisée', cl: 'p-neutre' }
  ];
  var STATUT_COM = {};
  STATUTS_COM.forEach(function (s) { STATUT_COM[s.id] = s; });

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
  function dcourt(s) { return s ? new Date(s + 'T00:00:00').toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' }) : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function initiales(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (m) { return m[0].toUpperCase(); }).join('') || '?'; }
  function plus12mois(d) { var p = d.split('-').map(Number); return (p[0] + 1) + '-' + z(p[1]) + '-' + z(p[2]); }
  function moisLabel(m) { var p = m.split('-'); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' }); }
  var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  function motDePasse() {
    var a = new Uint32Array(12); crypto.getRandomValues(a);
    var s = Array.prototype.map.call(a, function (n) { return ALPHABET[n % ALPHABET.length]; }).join('');
    return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12);
  }

  /* ───────────── Données fictives de départ ───────────── */
  function etatInitial() {
    var P = function (o) {
      return Object.assign({ contact: '', email: '', telephone: '', siteWeb: '', typeVideo: '', montantEstime: null, sourceVerrouillee: false,
        responsable: 'hugo', relance: '', notes: '', raisonPerte: '', devis: null, creeLe: '2026-10-01' }, o);
    };
    return {
      v: 2,
      session: null,
      miseEnLigne: '2026-03-01',
      comptes: [
        { id: 'admin', nom: 'Administrateur', societe: 'EI BRETZNER MARC', role: 'admin', actif: true, provisoire: false, derniere: '' },
        { id: 'hugo', nom: 'Hugo Elvira', societe: 'VATEA', role: 'gerant', actif: true, provisoire: false, derniere: '' },
        { id: 'jeff', nom: 'Jeff Framarin', societe: 'SASU JEGO', role: 'controle', actif: true, provisoire: false, derniere: '' },
        { id: 'marc', nom: 'Marc Bretzner', societe: 'EI BRETZNER MARC', role: 'controle', actif: true, provisoire: false, derniere: '' }
      ],
      prospects: [
        P({ id: 1, entreprise: 'Clinique Sud (fictif)', contact: 'Dr Sarah Lemaire', email: 'contact@clinique-sud.example', telephone: '+32 2 555 01 10', typeVideo: 'Vidéo de formation', source: 'Formulaire du site', etape: 'nouveau', relance: auj(1), creeLe: '2026-10-21', notes: 'Demande reçue via vatea.be : modules de formation pour le personnel soignant.' }),
        P({ id: 2, entreprise: 'Brasserie du Canal (fictif)', contact: 'Claire Dumont', email: 'claire@brasserie-canal.example', telephone: '+32 470 55 02 20', typeVideo: 'Vidéo publicitaire', montantEstime: 3200, source: 'Formulaire du site', etape: 'nouveau', relance: auj(0), creeLe: '2026-10-19', notes: 'Spot pour les réseaux sociaux avant l’ouverture de la terrasse.' }),
        P({ id: 3, entreprise: 'Atelier Verhaegen (fictif)', contact: 'Tom Verhaegen', telephone: '+32 476 55 03 30', typeVideo: 'Vidéo corporate', montantEstime: 6800, source: 'Apport JEGO', etape: 'contacte', relance: auj(-2), creeLe: '2026-10-08' }),
        P({ id: 4, entreprise: 'Lumen Architectes (fictif)', contact: 'Julien Masson', email: 'j.masson@lumen.example', telephone: '+32 2 555 04 40', typeVideo: 'Vidéo corporate', montantEstime: 5400, source: 'Recommandation', etape: 'rdv', relance: auj(3), creeLe: '2026-10-02' }),
        P({ id: 5, entreprise: 'Groupe Mosane (fictif)', contact: 'Pierre Collard', telephone: '+32 4 555 05 50', typeVideo: 'Vidéo de formation', source: 'Apport EI BRETZNER MARC', sourceVerrouillee: true, etape: 'devis_envoye', relance: auj(4), creeLe: '2026-09-25',
          devis: { ref: 'DEV-2026-014', dateEnvoi: '2026-10-15', montantHt: 14800 } }),
        P({ id: 11, entreprise: 'Domaine des Hautes Fagnes (fictif)', contact: 'Élise Gérard', telephone: '+32 80 55 11 10', typeVideo: 'Vidéo publicitaire', source: 'Salon / événement', sourceVerrouillee: true, etape: 'devis_envoye', relance: auj(-1), creeLe: '2026-09-30',
          devis: { ref: 'DEV-2026-016', dateEnvoi: '2026-10-18', montantHt: 7300 } }),
        P({ id: 6, entreprise: 'Nordtech Solutions (fictif)', contact: 'Kevin Peeters', telephone: '+32 3 555 06 60', typeVideo: 'Vidéo corporate', source: 'Réseau / LinkedIn / Instagram', sourceVerrouillee: true, etape: 'devis_signe', creeLe: '2026-09-10',
          devis: { ref: 'DEV-2026-011', dateEnvoi: '2026-09-22', montantHt: 2500, dateSignature: '2026-10-01', typePreuve: 'Contrat', fichierPreuve: 'contrat-nordtech-signe.pdf' } }),
        P({ id: 7, entreprise: 'Campus Formation (fictif)', contact: 'Nora Benali', telephone: '+32 81 55 07 70', typeVideo: 'Vidéo de formation', source: 'Formulaire du site', sourceVerrouillee: true, etape: 'facture', creeLe: '2026-08-28',
          devis: { ref: 'DEV-2026-009', dateEnvoi: '2026-09-04', montantHt: 4500, dateSignature: '2026-09-15', typePreuve: 'Bon de commande', fichierPreuve: 'bon-commande-campus.pdf' } }),
        P({ id: 8, entreprise: 'Laboratoire Exemple (fictif)', contact: 'Prof. Anne Gilson', telephone: '+32 10 55 08 80', typeVideo: 'Vidéo corporate', source: 'Recommandation', sourceVerrouillee: true, etape: 'paye', creeLe: '2026-03-20',
          devis: { ref: 'DEV-2026-003', dateEnvoi: '2026-03-30', montantHt: 6000, dateSignature: '2026-04-10', typePreuve: 'Devis signé (PDF)', fichierPreuve: 'devis-003-signe.pdf' }, notes: 'Exemple chiffré du cahier des charges (§ 10.1) : acompte, solde puis remboursement de 1 000 € HT.' }),
        P({ id: 9, entreprise: 'Boulangerie Lefèvre (fictif)', contact: 'Anne Lefèvre', telephone: '+32 2 555 09 90', typeVideo: 'Vidéo publicitaire', source: 'Prospection directe', sourceVerrouillee: true, etape: 'paye', creeLe: '2026-01-15',
          devis: { ref: 'DEV-2026-001', dateEnvoi: '2026-01-28', montantHt: 3000, dateSignature: '2026-02-10', typePreuve: 'Devis signé (PDF)', fichierPreuve: 'devis-001-signe.pdf' }, notes: 'Signé avant la mise en ligne : non éligible aux commissions (§ 10).' }),
        P({ id: 10, entreprise: 'Studio Kiné Namur (fictif)', contact: 'Lucas Martin', typeVideo: 'Vidéo de formation', source: 'Formulaire du site', etape: 'perdu', raisonPerte: 'Budget reporté à 2027', creeLe: '2026-09-02' })
      ],
      factures: [
        { id: 'f1', numero: 'FA-2026-012', prospectId: 8, date: '2026-04-12', ht: 6000, fichier: 'FA-2026-012.pdf' },
        { id: 'f2', numero: 'AV-2026-002', prospectId: 8, date: '2026-07-02', ht: -1000, avoir: true, fichier: 'AV-2026-002.pdf' },
        { id: 'f3', numero: 'FA-2026-004', prospectId: 9, date: '2026-02-20', ht: 3000, fichier: 'FA-2026-004.pdf' },
        { id: 'f4', numero: 'FA-2026-031', prospectId: 7, date: '2026-09-20', ht: 4500, fichier: 'FA-2026-031.pdf' }
      ],
      encaissements: [
        { id: 'e1', factureId: 'f1', date: '2026-04-20', ttc: 3630, reference: 'VIR-ACOMPTE-LABO', justificatif: 'extrait-2026-04.pdf', statut: 'reglee' },
        { id: 'e2', factureId: 'f3', date: '2026-03-05', ttc: 3630, reference: 'VIR-LEFEVRE', justificatif: 'extrait-2026-03.pdf', statut: 'a_verifier' },
        { id: 'e3', factureId: 'f1', date: '2026-06-15', ttc: 3630, reference: 'VIR-SOLDE-LABO', justificatif: 'extrait-2026-06.pdf', statut: 'facturee' },
        { id: 'e4', factureId: 'f2', date: '2026-07-05', ttc: -1210, reference: 'REMB-LABO', justificatif: 'extrait-2026-07.pdf', statut: 'regularisee' },
        { id: 'e5', factureId: 'f4', date: '2026-10-05', ttc: 2000, reference: 'VIR-CAMPUS-1', justificatif: 'extrait-2026-10.pdf', statut: 'a_verifier' },
        { id: 'e6', factureId: 'f4', date: '2026-10-12', ttc: 1210, reference: 'VIR-CAMPUS-2', justificatif: '', statut: 'a_verifier' }
      ],
      journal: [
        { le: '2026-10-21 09:14', auteur: 'Site web', action: 'Demande de devis reçue', pid: 1, details: 'Vidéo de formation' },
        { le: '2026-10-19 16:02', auteur: 'Site web', action: 'Demande de devis reçue', pid: 2, details: 'Vidéo publicitaire' },
        { le: '2026-10-12 11:40', auteur: 'Hugo Elvira', action: 'Encaissement déclaré sans justificatif', pid: 7, details: '1 210,00 € TTC sur FA-2026-031' },
        { le: '2026-10-05 10:21', auteur: 'Hugo Elvira', action: 'Encaissement déclaré', pid: 7, details: '2 000,00 € TTC sur FA-2026-031, extrait joint' },
        { le: '2026-10-01 15:05', auteur: 'Hugo Elvira', action: 'Devis signé', pid: 6, details: 'DEV-2026-011 — preuve : contrat du 01/10/2026' },
        { le: '2026-09-20 09:30', auteur: 'Hugo Elvira', action: 'Facture enregistrée', pid: 7, details: 'FA-2026-031 — 4 500,00 € HT' },
        { le: '2026-07-05 14:12', auteur: 'Hugo Elvira', action: 'Remboursement déclaré', pid: 8, details: '−1 210,00 € TTC sur AV-2026-002' }
      ],
      seq: { p: 12, f: 5, e: 7 }
    };
  }

  /* ───────────── État ───────────── */
  var S;
  function charger() {
    try { var t = localStorage.getItem(CLE); if (t) { var o = JSON.parse(t); if (o && o.v === 2) return o; } } catch (e) { /* stockage indisponible */ }
    return etatInitial();
  }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(S)); } catch (e) { /* démo sans sauvegarde */ } }
  S = charger();

  var ui = { vue: 'pipeline', mode: 'kanban', q: '', source: '', perduOuvert: false, mois: '', fiche: null };
  try { ui.mode = localStorage.getItem(CLE + '-mode') || 'kanban'; } catch (e) { /* */ }

  function moi() { return S.comptes.find(function (c) { return c.id === S.session; }); }
  function ecriture() { var m = moi(); return m && (m.role === 'gerant' || m.role === 'commercial' || m.role === 'admin'); }
  function estAdmin() { var m = moi(); return m && m.role === 'admin'; }
  function fin() { return plus12mois(S.miseEnLigne); }
  function prospect(id) { return S.prospects.find(function (p) { return p.id === Number(id); }); }
  function facture(id) { return S.factures.find(function (f) { return f.id === id; }); }
  function facturesDe(pid) { return S.factures.filter(function (f) { return f.prospectId === pid; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
  function encDe(fid) { return S.encaissements.filter(function (e) { return e.factureId === fid; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
  function ttcF(f) { return r2(f.ht * (1 + TVA)); }
  function encaisse(fid) { return r2(encDe(fid).reduce(function (s, e) { return s + e.ttc; }, 0)); }
  function statutPaiement(f) {
    var due = ttcF(f), recu = encaisse(f.id);
    if (f.avoir) return recu === 0 ? { t: 'Non remboursé', cl: 'p-warn' } : Math.abs(recu) < Math.abs(due) ? { t: 'Remboursé partiellement', cl: 'p-info' } : { t: 'Remboursé intégralement', cl: 'p-neutre' };
    return recu <= 0 ? { t: 'Non reçu', cl: 'p-bad' } : recu < due ? { t: 'Partiel', cl: 'p-warn' } : { t: 'Soldé', cl: 'p-ok' };
  }
  function resteDu(p) {
    var fs = facturesDe(p.id);
    var du = fs.reduce(function (s, f) { return s + ttcF(f); }, 0), recu = fs.reduce(function (s, f) { return s + encaisse(f.id); }, 0);
    return r2(du - recu);
  }
  function eligibilite(p) {
    var d = p && p.devis && p.devis.dateSignature;
    if (!d) return { ok: false, raison: 'Devis non signé' };
    if (d < S.miseEnLigne) return { ok: false, raison: 'Signé avant la mise en ligne' };
    if (d >= fin()) return { ok: false, raison: 'Signé après la période' };
    return { ok: true, raison: 'Éligible' };
  }
  function journaliser(action, pid, details) {
    var m = moi();
    S.journal.unshift({ le: maintenant(), auteur: m ? m.nom : 'Système', action: action, pid: pid || null, details: details || '' });
  }

  function lignesCommission() {
    return S.encaissements.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1); }).map(function (e) {
      var f = facture(e.factureId), p = prospect(f.prospectId), el = eligibilite(p);
      var ht = r2(e.ttc / (1 + TVA));
      return { e: e, f: f, p: p, el: el, ht: ht, j: el.ok ? r2(ht * TAUX_J) : 0, m: el.ok ? r2(ht * TAUX_M) : 0 };
    });
  }
  function alertes() {
    var a = [];
    S.prospects.forEach(function (p) {
      if (p.devis && p.devis.dateSignature && p.etape !== 'perdu' && !facturesDe(p.id).some(function (f) { return !f.avoir; }))
        a.push({ sev: 'var(--orange, #e8a15a)', titre: 'Devis signé sans facture', texte: p.entreprise + ' — ' + p.devis.ref + ' (' + eur0(p.devis.montantHt) + ' HT, signé le ' + dfr(p.devis.dateSignature) + ')', pid: p.id });
    });
    S.factures.forEach(function (f) {
      if (f.avoir) return;
      var recu = encaisse(f.id), du = ttcF(f), p = prospect(f.prospectId);
      if (recu <= 0) a.push({ sev: '#e8a15a', titre: 'Facture sans encaissement déclaré', texte: f.numero + ' — ' + p.entreprise + ' (' + eur(du) + ' TTC, émise le ' + dfr(f.date) + ')', pid: p.id });
      else if (recu < du) a.push({ sev: '#e8a15a', titre: 'Facture partiellement encaissée', texte: f.numero + ' — ' + p.entreprise + ' : reste ' + eur(du - recu) + ' TTC', pid: p.id });
    });
    S.encaissements.forEach(function (e) {
      if (!e.justificatif) { var f = facture(e.factureId); a.push({ sev: '#e5674d', titre: 'Justificatif bancaire manquant', texte: e.reference + ' du ' + dfr(e.date) + ' (' + eur(e.ttc) + ' TTC) sur ' + f.numero + ' — commission bloquée à « À vérifier »', pid: f.prospectId }); }
    });
    return a;
  }

  /* ───────────── Toast ───────────── */
  var toastTimer;
  function toast(t, err) {
    var el = document.getElementById('toast');
    el.innerHTML = '<div class="toast' + (err ? ' err' : '') + '" role="status">' + esc(t) + '</div>';
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.innerHTML = ''; }, 4200);
  }

  /* ───────────── Fenêtres de saisie ───────────── */
  var modaleCourante = null;
  function champHtml(c) {
    var id = 'm-' + c.k, req = c.req ? ' required' : '', v = c.val == null ? '' : c.val;
    var lbl = '<label class="lbl" for="' + id + '">' + esc(c.label) + (c.req ? ' *' : '') + '</label>';
    var input;
    if (c.type === 'select') input = '<select class="champ" id="' + id + '" name="' + c.k + '"' + req + '><option value="">Choisir…</option>' + c.options.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    else if (c.type === 'textarea') input = '<textarea class="champ" id="' + id + '" name="' + c.k + '"' + req + '>' + esc(v) + '</textarea>';
    else if (c.type === 'file') input = '<input class="champ" style="padding-top:8px" type="file" id="' + id + '" name="' + c.k + '" accept=".pdf,.jpg,.jpeg,.png"' + req + ' />';
    else input = '<input class="champ" id="' + id + '" name="' + c.k + '" type="' + (c.type || 'text') + '" value="' + esc(v) + '"' + (c.max ? ' max="' + c.max + '"' : '') + (c.type === 'text' && c.mode ? ' inputmode="' + c.mode + '"' : '') + req + ' />';
    return '<div' + (c.demi ? ' class="demi"' : '') + '>' + lbl + input + (c.aide ? '<p class="aide">' + c.aide + '</p>' : '') + '</div>';
  }
  function ouvrirModale(o) {
    modaleCourante = o;
    var champs = o.champs || [], html = '', i = 0;
    while (i < champs.length) {
      if (champs[i].demi && champs[i + 1] && champs[i + 1].demi) { html += '<div class="grille2">' + champHtml(champs[i]) + champHtml(champs[i + 1]) + '</div>'; i += 2; }
      else { html += champHtml(champs[i]); i += 1; }
    }
    document.getElementById('modale').insertAdjacentHTML('beforeend',
      '<div class="modale-voile" data-modale><form class="modale" role="dialog" aria-modal="true" aria-label="' + esc(o.titre) + '" novalidate>' +
      '<h3>' + esc(o.titre) + '</h3>' + (o.texte ? '<p>' + o.texte + '</p>' : '') + html +
      '<p class="erreur" hidden></p><div class="actions"><button type="button" class="btn" data-act="modale-annuler">Annuler</button>' +
      (o.bouton ? '<button class="btn btn-or">' + esc(o.bouton) + '</button>' : '') + '</div></form></div>');
    var f = document.querySelector('[data-modale]:last-child form');
    var premier = f.querySelector('input:not([type=file]), select, textarea');
    if (premier) premier.focus();
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = {}, manque = null;
      champs.forEach(function (c) {
        var el = f.elements[c.k];
        if (c.type === 'file') v[c.k] = el.files && el.files[0] ? el.files[0].name : '';
        else v[c.k] = el.value.trim();
        if (c.req && !v[c.k] && !manque) manque = c.label;
      });
      var err = manque ? 'Champ obligatoire : ' + manque + '.' : o.onOk(v);
      var p = f.querySelector('.erreur');
      if (err) { p.textContent = err; p.hidden = false; return; }
      fermerModale(f.closest('[data-modale]'));
    });
  }
  function fermerModale(el) {
    (el || document.querySelector('[data-modale]:last-child')).remove();
    modaleCourante = null;
    if (o_apres) { var cb = o_apres; o_apres = null; cb(); }
  }
  var o_apres = null;
  function confirmer(titre, texte, bouton, ok) {
    ouvrirModale({ titre: titre, texte: texte, bouton: bouton, champs: [], onOk: function () { ok(); return null; } });
  }
  function montant(v) { var n = Number(String(v).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? r2(n) : NaN; }

  /* ───────────── Processus commercial (§ 8) ───────────── */
  function verrouSource(p) { if (!p.sourceVerrouillee && p.etape !== 'perdu' && ETAPE[p.etape].rang >= ETAPE.devis_envoye.rang) { p.sourceVerrouillee = true; } }

  function demanderDevis(p, suite) {
    ouvrirModale({
      titre: p.entreprise + ' — devis envoyé',
      texte: 'Hugo établit son devis dans son logiciel et l’envoie par e-mail, puis renseigne ici sa référence, sa date et son montant HT (§ 8.1). La source sera verrouillée.',
      bouton: 'Enregistrer',
      champs: [
        { k: 'ref', label: 'Référence du devis', req: true, demi: true, val: 'DEV-2026-0' + (20 + S.seq.p) },
        { k: 'dateEnvoi', label: 'Date d’envoi', type: 'date', req: true, demi: true, val: auj(), max: auj() },
        { k: 'montantHt', label: 'Montant HT (€)', req: true, mode: 'decimal', val: p.montantEstime || '' },
        { k: 'fichier', label: 'Copie du devis (PDF)', type: 'file', aide: 'Démo : seul le nom du fichier est conservé.' }
      ],
      onOk: function (v) {
        var m = montant(v.montantHt);
        if (!(m > 0)) return 'Montant HT invalide.';
        p.devis = { ref: v.ref, dateEnvoi: v.dateEnvoi, montantHt: m, fichierDevis: v.fichier };
        journaliser('Devis envoyé', p.id, v.ref + ' — ' + eur(m) + ' HT');
        sauver(); o_apres = suite; return null;
      }
    });
  }
  function demanderSignature(p, suite) {
    ouvrirModale({
      titre: p.entreprise + ' — devis signé',
      texte: 'La date d’éligibilité repose sur la preuve de signature, pas sur la date de saisie (§ 10.2). Période éligible : du ' + dfr(S.miseEnLigne) + ' au ' + dfr(plus12moisMoins1()) + '.',
      bouton: 'Valider la signature',
      champs: [
        { k: 'dateSignature', label: 'Date de signature', type: 'date', req: true, demi: true, val: auj(), max: auj() },
        { k: 'typePreuve', label: 'Type de preuve', type: 'select', options: TYPES_PREUVE, req: true, demi: true },
        { k: 'fichier', label: 'Preuve de signature', type: 'file', aide: 'Devis accepté, bon de commande ou contrat. Démo : seul le nom du fichier est conservé.' }
      ],
      onOk: function (v) {
        if (p.devis.dateEnvoi && v.dateSignature < p.devis.dateEnvoi) return 'La signature ne peut pas précéder l’envoi du devis.';
        p.devis.dateSignature = v.dateSignature; p.devis.typePreuve = v.typePreuve; p.devis.fichierPreuve = v.fichier;
        var el = eligibilite(p);
        journaliser('Devis signé', p.id, p.devis.ref + ' — preuve : ' + v.typePreuve + (v.fichier ? ' (' + v.fichier + ')' : ' (fichier à joindre)') + ' — ' + el.raison);
        sauver(); o_apres = suite; return null;
      }
    });
  }
  function demanderFacture(p, suite, avoir) {
    var base = avoir ? '' : (p.devis ? p.devis.montantHt - facturesDe(p.id).filter(function (f) { return !f.avoir; }).reduce(function (s, f) { return s + f.ht; }, 0) : '');
    ouvrirModale({
      titre: p.entreprise + (avoir ? ' — avoir' : ' — facture'),
      texte: (avoir ? 'Un avoir régularise une facture sans supprimer les écritures initiales (§ 10.2).' : 'La facture est émise dans le logiciel de facturation de Hugo (Peppol). On enregistre ici son numéro, son montant et son PDF.'),
      bouton: 'Enregistrer',
      champs: [
        { k: 'numero', label: avoir ? 'N° d’avoir' : 'N° de facture', req: true, demi: true, val: (avoir ? 'AV-2026-0' : 'FA-2026-0') + (30 + S.seq.f) },
        { k: 'date', label: 'Date', type: 'date', req: true, demi: true, val: auj(), max: auj() },
        { k: 'ht', label: 'Montant HT (€)' + (avoir ? ' — positif, il sera déduit' : ''), req: true, mode: 'decimal', val: base > 0 ? base : '', aide: 'TVA 21 % calculée automatiquement.' },
        { k: 'fichier', label: 'PDF', type: 'file' }
      ],
      onOk: function (v) {
        var m = montant(v.ht);
        if (!(m > 0)) return 'Montant HT invalide.';
        if (S.factures.some(function (f) { return f.numero === v.numero; })) return 'Ce numéro existe déjà.';
        var f = { id: 'f' + S.seq.f++, numero: v.numero, prospectId: p.id, date: v.date, ht: avoir ? -m : m, avoir: !!avoir, fichier: v.fichier };
        S.factures.push(f);
        journaliser(avoir ? 'Avoir enregistré' : 'Facture enregistrée', p.id, f.numero + ' — ' + eur(f.ht) + ' HT (' + eur(ttcF(f)) + ' TTC)');
        if (!avoir && ETAPE[p.etape].rang < ETAPE.facture.rang) { p.etape = 'facture'; journaliser('Étape changée', p.id, '→ Facturé'); }
        sauver(); o_apres = suite; return null;
      }
    });
  }
  function demanderEncaissement(f, suite) {
    var p = prospect(f.prospectId), reste = r2(ttcF(f) - encaisse(f.id)), remb = f.avoir;
    ouvrirModale({
      titre: f.numero + (remb ? ' — remboursement' : ' — encaissement'),
      texte: (remb ? 'Remboursement versé au client. ' : 'Le CRM ne voit pas le compte bancaire : Hugo déclare chaque acompte ou solde avec l’extrait bancaire (§ 9). ') +
        'Reste ' + (remb ? 'à rembourser' : 'dû') + ' : <b>' + eur(Math.abs(reste)) + ' TTC</b>.',
      bouton: 'Déclarer',
      champs: [
        { k: 'date', label: 'Date du crédit bancaire', type: 'date', req: true, demi: true, val: auj(), max: auj() },
        { k: 'ttc', label: 'Montant TTC (€)', req: true, demi: true, mode: 'decimal', val: Math.abs(reste) || '' },
        { k: 'reference', label: 'Référence du virement', req: true, val: (remb ? 'REMB-' : 'VIR-') + p.entreprise.split(' ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '') + '-' + S.seq.e },
        { k: 'justificatif', label: 'Extrait bancaire', type: 'file', aide: 'Sans extrait, la commission reste bloquée à « À vérifier » et une alerte apparaît. Démo : seul le nom du fichier est conservé.' }
      ],
      onOk: function (v) {
        var m = montant(v.ttc);
        if (!(m > 0)) return 'Montant invalide.';
        if (m > Math.abs(reste) + 0.005) return 'Le montant dépasse le reste ' + (remb ? 'à rembourser' : 'dû') + ' (' + eur(Math.abs(reste)) + ').';
        var e = { id: 'e' + S.seq.e++, factureId: f.id, date: v.date, ttc: remb ? -m : m, reference: v.reference, justificatif: v.justificatif, statut: 'a_verifier' };
        S.encaissements.push(e);
        journaliser(remb ? 'Remboursement déclaré' : (v.justificatif ? 'Encaissement déclaré' : 'Encaissement déclaré sans justificatif'), p.id, eur(e.ttc) + ' TTC sur ' + f.numero + (v.justificatif ? ', extrait joint' : ''));
        if (!remb && resteDu(p) <= 0 && p.etape === 'facture') { p.etape = 'paye'; journaliser('Étape changée', p.id, '→ Payé (soldé)'); }
        sauver(); o_apres = suite; return null;
      }
    });
  }
  function plus12moisMoins1() { var t = new Date(fin() + 'T00:00:00'); t.setDate(t.getDate() - 1); return t.getFullYear() + '-' + z(t.getMonth() + 1) + '-' + z(t.getDate()); }

  /** Fait avancer un prospect vers une étape en demandant d'abord ce qui manque. */
  function avancer(p, etape) {
    if (!ecriture()) return toast('Votre rôle ne permet pas de modifier les données commerciales.', true);
    if (p.etape === etape) { rendre(); return; }
    var rang = ETAPE[etape].rang, refaire = function () { avancer(p, etape); };
    if (etape === 'perdu') {
      return ouvrirModale({ titre: p.entreprise + ' → Perdu', bouton: 'Valider', champs: [{ k: 'raison', label: 'Raison de la perte', type: 'textarea', req: true }],
        onOk: function (v) { var av = ETAPE[p.etape].label; p.etape = 'perdu'; p.raisonPerte = v.raison; journaliser('Étape changée', p.id, av + ' → Perdu : ' + v.raison); sauver(); o_apres = rendre; return null; } });
    }
    if (rang >= ETAPE.devis_envoye.rang && !(p.devis && p.devis.ref)) return demanderDevis(p, refaire);
    if (rang >= ETAPE.devis_signe.rang && !(p.devis.dateSignature && p.devis.typePreuve)) return demanderSignature(p, refaire);
    if (rang >= ETAPE.facture.rang && !facturesDe(p.id).some(function (f) { return !f.avoir; })) return demanderFacture(p, refaire);
    if (etape === 'paye' && resteDu(p) > 0) {
      var f = facturesDe(p.id).find(function (x) { return !x.avoir && encaisse(x.id) < ttcF(x); });
      return demanderEncaissement(f, function () {
        if (resteDu(p) > 0) { rendre(); toast('Encaissement enregistré. Reste ' + eur(resteDu(p)) + ' TTC : le dossier passera en « Payé » au solde.'); }
        else refaire();
      });
    }
    var avant = ETAPE[p.etape].label;
    p.etape = etape;
    verrouSource(p);
    journaliser('Étape changée', p.id, avant + ' → ' + ETAPE[etape].label);
    sauver(); rendre();
    toast(p.entreprise + ' → ' + ETAPE[etape].label);
  }

  /* ───────────── Rendu : en-tête ───────────── */
  function entete() {
    var m = moi(), nbAl = alertes().length;
    var liens = [['pipeline', 'Prospects'], ['encaissements', 'Encaissements'], ['commissions', 'Commissions'], ['historique', 'Historique']];
    if (m.role === 'admin') liens.push(['admin', 'Admin']);
    return '<div class="bandeau-demo">Démonstration — données fictives enregistrées dans ce navigateur uniquement <button type="button" data-act="changer-compte">Changer de compte</button><button type="button" data-act="reinitialiser">Réinitialiser</button></div>' +
      '<header class="entete"><a href="#" class="marque" data-act="vue" data-vue="pipeline"><img src="/media/logo-va.png" alt="" /><span><b>VATEA</b><i>CRM commercial</i></span></a>' +
      '<nav class="nav" aria-label="Navigation">' + liens.map(function (l) {
        return '<a href="#" data-act="vue" data-vue="' + l[0] + '" class="' + (ui.vue === l[0] ? 'actif' : '') + '">' + l[1] + (l[0] === 'commissions' && nbAl ? '<span class="badge" title="Alertes de contrôle">' + nbAl + '</span>' : '') + '</a>';
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
  function montantP(p) { return p.devis ? p.devis.montantHt : p.montantEstime; }
  function carte(p) {
    var a = auj(), retard = p.relance && p.relance < a && ['paye', 'perdu'].indexOf(p.etape) < 0, w = ecriture();
    var m = montantP(p);
    return '<button type="button" class="carte" data-act="fiche" data-id="' + p.id + '"' + (w ? ' draggable="true"' : '') + '>' +
      '<h3>' + esc(p.entreprise) + '</h3>' + (p.contact ? '<p class="contact">' + esc(p.contact) + '</p>' : '') +
      '<div class="ligne">' + (p.typeVideo ? '<span class="puce">' + esc(p.typeVideo.replace('Vidéo ', '')) + '</span>' : '') +
      '<span class="puce or" title="' + (p.sourceVerrouillee ? 'Source verrouillée' : 'Source') + '">' + (p.sourceVerrouillee ? '🔒 ' : '') + esc(p.source) + '</span></div>' +
      '<div class="ligne">' + (p.relance && ['paye', 'perdu'].indexOf(p.etape) < 0 ? '<span class="puce' + (retard ? ' alerte' : '') + '" title="Prochaine relance">⏰ ' + dcourt(p.relance) + '</span>' : '') +
      (p.etape === 'facture' ? '<span class="puce alerte" title="Reste dû">Reste ' + eur0(resteDu(p)) + '</span>' : '') +
      '<span class="montant">' + (m != null ? eur0(m) : '') + '</span></div></button>';
  }
  function vuePipeline() {
    var L = filtres(), a = auj(), w = ecriture(), mois = a.slice(0, 7);
    var somme = function (arr) { return arr.reduce(function (t, p) { return t + (montantP(p) || 0); }, 0); };
    var k = {
      actifs: L.filter(function (p) { return ETAPE[p.etape].rang < ETAPE.devis_signe.rang; }).length,
      devis: somme(L.filter(function (p) { return p.etape === 'devis_envoye'; })),
      signe: somme(L.filter(function (p) { return p.etape !== 'perdu' && p.devis && p.devis.dateSignature && p.devis.dateSignature.slice(0, 7) === mois; })),
      rdv: L.filter(function (p) { return p.etape === 'rdv'; }).length,
      clients: L.filter(function (p) { return ['devis_signe', 'facture', 'paye'].indexOf(p.etape) >= 0; }).length,
      retard: L.filter(function (p) { return p.relance && p.relance < a && ['paye', 'perdu'].indexOf(p.etape) < 0; }).length
    };
    var h = '<div class="tete-page"><div><h1>Pipeline</h1><p>' + (w ? 'Tous les prospects' : 'Consultation (lecture seule)') + ' · ' + L.length + ' prospect' + (L.length > 1 ? 's' : '') + '</p></div>' +
      '<div class="kpis"><div class="kpi"><span>Actifs</span><b>' + k.actifs + '</b></div><div class="kpi"><span>Devis en cours</span><b>' + eur0(k.devis) + '</b></div>' +
      '<div class="kpi"><span>Signé ce mois</span><b class="or">' + eur0(k.signe) + '</b></div><div class="kpi"><span>RDV</span><b>' + k.rdv + '</b></div>' +
      '<div class="kpi"><span>Clients</span><b class="or">' + k.clients + '</b></div><div class="kpi"><span>Relances en retard</span><b class="' + (k.retard ? 'alerte' : '') + '">' + k.retard + '</b></div></div></div>';
    h += '<div class="barre"><div class="bascule" role="group" aria-label="Affichage"><button type="button" data-act="mode" data-mode="kanban" class="' + (ui.mode === 'kanban' ? 'on' : '') + '">Kanban</button><button type="button" data-act="mode" data-mode="liste" class="' + (ui.mode === 'liste' ? 'on' : '') + '">Liste</button></div>' +
      '<input class="champ recherche" type="search" placeholder="Rechercher…" value="' + esc(ui.q) + '" data-input="q" aria-label="Rechercher" />' +
      '<select class="champ" data-input="source" aria-label="Source"><option value="">Toutes les sources</option>' + SOURCES.map(function (s) { return '<option' + (ui.source === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
      '<div class="droite"><button type="button" class="btn" data-act="export-prospects">Exporter</button>' + (w ? '<button type="button" class="btn btn-or" data-act="nouveau">+ Nouveau prospect</button>' : '') + '</div></div>';
    if (ui.mode === 'kanban') {
      h += '<div class="kanban' + (ui.perduOuvert ? '' : ' avec-perdu-replie') + '">';
      ETAPES.filter(function (e) { return e.id !== 'perdu'; }).forEach(function (e) {
        var it = L.filter(function (p) { return p.etape === e.id; }), tot = somme(it);
        h += '<section class="colonne" style="--c:' + e.c + '" data-etape="' + e.id + '" aria-label="' + e.label + '"><div class="col-tete"><span class="point"></span><h2>' + e.label + '</h2><span class="nb">' + it.length + '</span>' +
          (e.id === 'nouveau' && w ? '<button type="button" class="btn btn-icone" style="margin-left:auto" data-act="nouveau" aria-label="Ajouter un prospect">+</button>' : '') +
          (tot > 0 ? '<span class="somme">' + eur0(tot) + '</span>' : '') + '</div><div class="col-corps">' +
          (it.length ? it.map(carte).join('') : '<p class="vide">—</p>') + '</div></section>';
      });
      var perdus = L.filter(function (p) { return p.etape === 'perdu'; });
      h += ui.perduOuvert
        ? '<section class="colonne" style="--c:#7a7a7a" data-etape="perdu" aria-label="Perdu"><div class="col-tete"><span class="point"></span><h2>Perdu</h2><span class="nb">' + perdus.length + '</span><button type="button" class="btn btn-icone" style="margin-left:auto" data-act="perdu-toggle" aria-label="Replier">‹</button></div><div class="col-corps">' + (perdus.length ? perdus.map(carte).join('') : '<p class="vide">—</p>') + '</div></section>'
        : '<section class="colonne repliee" style="--c:#7a7a7a" data-etape="perdu" data-act="perdu-toggle" role="button" tabindex="0" aria-label="Afficher les prospects perdus"><span class="point"></span><h2>Perdu</h2><span class="nb">' + perdus.length + '</span></section>';
      h += '</div>';
      if (w) h += '<p class="aide" style="margin-top:10px">Astuce : glissez une carte vers une autre colonne. Le CRM demande ce qui manque (devis, preuve de signature, facture, encaissement).</p>';
    } else {
      h += '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Entreprise</th><th>Étape</th><th>Source</th><th>Téléphone</th><th class="num">Montant HT</th><th>Relance</th></tr></thead><tbody>' +
        L.map(function (p) {
          var retard = p.relance && p.relance < a && ['paye', 'perdu'].indexOf(p.etape) < 0;
          return '<tr class="cliquable" data-act="fiche" data-id="' + p.id + '"><td><b>' + esc(p.entreprise) + '</b>' + (p.contact ? '<div class="aide" style="margin-top:2px">' + esc(p.contact) + '</div>' : '') + '</td>' +
            '<td><span class="etape-badge" style="--c:' + ETAPE[p.etape].c + '">' + ETAPE[p.etape].label + '</span></td><td>' + (p.sourceVerrouillee ? '🔒 ' : '') + esc(p.source) + '</td>' +
            '<td>' + (p.telephone ? esc(p.telephone) : '—') + '</td><td class="num">' + eur0(montantP(p)) + '</td><td>' + (p.relance ? '<span class="puce' + (retard ? ' alerte' : '') + '">' + dcourt(p.relance) + '</span>' : '—') + '</td></tr>';
        }).join('') + (L.length ? '' : '<tr><td colspan="6" class="vide">Aucun prospect</td></tr>') + '</tbody></table></div>';
    }
    return h;
  }

  /* ───────────── Rendu : encaissements ───────────── */
  function vueEncaissements() {
    var w = ecriture();
    var fs = S.factures.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var totTtc = 0, totRecu = 0;
    var h = '<div class="tete-page"><div><h1>Encaissements</h1><p>Factures émises par VATEA et paiements déclarés avec leur extrait bancaire (§ 9).</p></div></div>';
    h += '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Facture</th><th>Client</th><th>Date</th><th class="num">HT</th><th class="num">TTC</th><th class="num">Encaissé</th><th>Paiement</th><th></th></tr></thead><tbody>' +
      fs.map(function (f) {
        var p = prospect(f.prospectId), sp = statutPaiement(f), recu = encaisse(f.id), du = ttcF(f);
        totTtc += du; totRecu += recu;
        var peut = w && Math.abs(recu) < Math.abs(du) - 0.005;
        return '<tr><td><b>' + esc(f.numero) + '</b>' + (f.avoir ? ' <span class="pastille p-neutre">Avoir</span>' : '') + '</td><td><a href="#" data-act="fiche" data-id="' + p.id + '" data-onglet="facturation">' + esc(p.entreprise) + '</a></td><td>' + dfr(f.date) + '</td>' +
          '<td class="num">' + eur(f.ht) + '</td><td class="num">' + eur(du) + '</td><td class="num">' + eur(recu) + '</td><td><span class="pastille ' + sp.cl + '">' + sp.t + '</span></td>' +
          '<td>' + (peut ? '<button type="button" class="btn btn-petit" data-act="encaisser" data-f="' + f.id + '">' + (f.avoir ? '+ Remboursement' : '+ Encaissement') + '</button>' : '') + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><td colspan="4">Total</td><td class="num">' + eur(totTtc) + '</td><td class="num">' + eur(totRecu) + '</td><td colspan="2"></td></tr></tfoot></table></div>';
    h += '<h2 class="sous-titre">Mouvements déclarés</h2><div class="tableau-wrap"><table class="tableau"><thead><tr><th>Date</th><th>Référence</th><th>Facture</th><th>Client</th><th class="num">TTC</th><th class="num">Base HT</th><th>Extrait bancaire</th><th></th></tr></thead><tbody>' +
      S.encaissements.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (e) {
        var f = facture(e.factureId), p = prospect(f.prospectId);
        return '<tr><td>' + dfr(e.date) + '</td><td>' + esc(e.reference) + '</td><td>' + esc(f.numero) + '</td><td>' + esc(p.entreprise) + '</td><td class="num">' + eur(e.ttc) + '</td><td class="num">' + eur(r2(e.ttc / (1 + TVA))) + '</td>' +
          '<td>' + (e.justificatif ? '<span class="fichier">📎 ' + esc(e.justificatif) + '</span>' : '<span class="fichier manquant">Manquant</span>') + '</td>' +
          '<td>' + (!e.justificatif && w ? '<button type="button" class="btn btn-petit" data-act="joindre" data-e="' + e.id + '">Joindre</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    return h;
  }

  /* ───────────── Rendu : commissions (§ 9.2, § 10) ───────────── */
  function vueCommissions() {
    var m = moi(), toutes = lignesCommission();
    var moisDispo = Array.from(new Set(toutes.map(function (l) { return l.e.date.slice(0, 7); }))).sort().reverse();
    var L = toutes.filter(function (l) { return !ui.mois || l.e.date.slice(0, 7) === ui.mois; });
    var el = L.filter(function (l) { return l.el.ok; });
    var tHt = r2(el.reduce(function (s, l) { return s + l.ht; }, 0)), tJ = r2(el.reduce(function (s, l) { return s + l.j; }, 0)), tM = r2(el.reduce(function (s, l) { return s + l.m; }, 0));
    var aVerif = el.filter(function (l) { return l.e.statut === 'a_verifier'; }).length;
    var al = alertes();
    var h = '<div class="tete-page"><div><h1>Commissions</h1><p>' + (m.id === 'jeff' ? 'Votre commission JEGO : 16 % du HT encaissé' : m.id === 'marc' ? 'Votre commission EI BRETZNER MARC : 9 % du HT encaissé' : 'JEGO 16 % et EI BRETZNER MARC 9 % du HT réellement encaissé') + '</p></div>' +
      '<div class="kpis"><div class="kpi"><span>HT encaissé éligible</span><b>' + eur(tHt) + '</b></div><div class="kpi"><span>JEGO 16 %</span><b class="or">' + eur(tJ) + '</b></div>' +
      '<div class="kpi"><span>Marc 9 %</span><b class="or">' + eur(tM) + '</b></div><div class="kpi"><span>Total 25 %</span><b>' + eur(r2(tJ + tM)) + '</b></div>' +
      '<div class="kpi"><span>À vérifier</span><b class="' + (aVerif ? 'alerte' : '') + '">' + aVerif + '</b></div></div></div>';
    h += '<div class="periode"><span>Période éligible : <b>du ' + dfr(S.miseEnLigne) + ' au ' + dfr(plus12moisMoins1()) + '</b> (12 mois après la mise en ligne constatée par écrit — date fictive pour la démo).</span><span>Base HT = TTC ÷ 1,21, arrondie au centime par encaissement.</span></div>';
    if (al.length) {
      h += '<h2 class="sous-titre" style="margin-top:0">Contrôle : ' + al.length + ' point' + (al.length > 1 ? 's' : '') + ' à vérifier</h2><div class="alertes">' +
        al.map(function (a) { return '<button type="button" class="alerte-ligne" style="--sev:' + a.sev + '" data-act="fiche" data-id="' + a.pid + '" data-onglet="facturation"><div><b>' + esc(a.titre) + '</b><span>' + esc(a.texte) + '</span></div></button>'; }).join('') + '</div>';
    }
    h += '<div class="barre"><select class="champ" data-input="mois" aria-label="Mois d’encaissement"><option value="">Tous les mois</option>' + moisDispo.map(function (x) { return '<option value="' + x + '"' + (ui.mois === x ? ' selected' : '') + '>' + moisLabel(x) + '</option>'; }).join('') + '</select>' +
      '<div class="droite"><button type="button" class="btn btn-or" data-act="export-commissions">Exporter le rapport' + (ui.mois ? ' du mois' : '') + '</button></div></div>';
    var cj = m.id === 'jeff' ? ' col-j' : '', cm = m.id === 'marc' ? ' col-j' : '';
    h += '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Encaissement</th><th>Client / dossier</th><th>Devis signé</th><th class="num">TTC</th><th class="num">Base HT</th><th class="num' + cj + '">JEGO 16 %</th><th class="num' + cm + '">Marc 9 %</th><th>Justificatif</th><th>Statut</th></tr></thead><tbody>' +
      L.slice().reverse().map(function (l) {
        var st = STATUT_COM[l.e.statut] || STATUT_COM.a_verifier, sel;
        if (!l.el.ok) sel = '<span class="pastille p-neutre">Non éligible</span>';
        else if (estAdmin()) sel = '<select class="champ mini-select" data-statut="' + l.e.id + '">' + STATUTS_COM.map(function (s) { return '<option value="' + s.id + '"' + (s.id === l.e.statut ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') + '</select>';
        else sel = '<span class="pastille ' + st.cl + '">' + st.label + '</span>';
        return '<tr><td>' + dfr(l.e.date) + '<div class="aide" style="margin-top:2px">' + esc(l.e.reference) + ' · ' + esc(l.f.numero) + '</div></td>' +
          '<td><a href="#" data-act="fiche" data-id="' + l.p.id + '" data-onglet="facturation">' + esc(l.p.entreprise) + '</a><div class="aide" style="margin-top:2px">' + esc(l.p.devis ? l.p.devis.ref : '') + '</div></td>' +
          '<td>' + dfr(l.p.devis && l.p.devis.dateSignature) + '<div style="margin-top:3px"><span class="pastille ' + (l.el.ok ? 'p-ok' : 'p-neutre') + '">' + l.el.raison + '</span></div></td>' +
          '<td class="num">' + eur(l.e.ttc) + '</td><td class="num">' + eur(l.ht) + '</td><td class="num' + cj + '">' + (l.el.ok ? eur(l.j) : '—') + '</td><td class="num' + cm + '">' + (l.el.ok ? eur(l.m) : '—') + '</td>' +
          '<td>' + (l.e.justificatif ? '<span class="fichier">📎 Extrait</span>' : '<span class="fichier manquant">Manquant</span>') + '</td><td>' + sel + '</td></tr>';
      }).join('') + (L.length ? '' : '<tr><td colspan="9" class="vide">Aucun encaissement ce mois-ci</td></tr>') +
      '</tbody><tfoot><tr><td colspan="4">Total éligible' + (ui.mois ? ' — ' + moisLabel(ui.mois) : '') + '</td><td class="num">' + eur(tHt) + '</td><td class="num' + cj + '">' + eur(tJ) + '</td><td class="num' + cm + '">' + eur(tM) + '</td><td colspan="2"></td></tr></tfoot></table></div>';
    h += '<p class="aide" style="margin-top:10px">' + (estAdmin() ? 'Vous pouvez faire évoluer le statut après le rapprochement mensuel. Une commission sans extrait bancaire ne peut pas être validée.' : 'Le statut est mis à jour par l’administrateur après le rapprochement mensuel validé par les parties.') +
      ' Rappel § 11 : aucun CRM tenu par le débiteur ne prouve à lui seul que toutes les ventes sont déclarées ; la protection repose sur les pièces et les droits d’audit.</p>';
    return h;
  }

  /* ───────────── Rendu : historique ───────────── */
  function vueHistorique() {
    return '<div class="tete-page"><div><h1>Historique</h1><p>Journal des actions : rien n’y est modifiable ni supprimable.</p></div></div>' +
      '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Date</th><th>Par</th><th>Action</th><th>Prospect</th><th>Détails</th></tr></thead><tbody>' +
      S.journal.map(function (j) {
        var p = j.pid ? prospect(j.pid) : null;
        return '<tr><td style="white-space:nowrap;font-family:var(--mono);font-size:12px">' + esc(dfr(j.le) + j.le.slice(10)) + '</td><td>' + esc(j.auteur) + '</td><td><b>' + esc(j.action) + '</b></td><td>' + (p ? '<a href="#" data-act="fiche" data-id="' + p.id + '" data-onglet="historique">' + esc(p.entreprise) + '</a>' : '—') + '</td><td style="font-size:12.5px;color:var(--texte-2)">' + esc(j.details) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ───────────── Rendu : admin ───────────── */
  function vueAdmin() {
    var h = '<div class="tete-page"><div><h1>Admin</h1><p>Équipe, accès et mots de passe</p></div></div><div class="deux-col"><div>' +
      '<div class="tableau-wrap"><table class="tableau"><thead><tr><th>Membre</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th><th></th></tr></thead><tbody>' +
      S.comptes.map(function (c) {
        return '<tr style="opacity:' + (c.actif ? 1 : .55) + '"><td><div style="display:flex;align-items:center;gap:10px"><span class="avatar petit" style="width:32px;height:32px;font-size:11px">' + initiales(c.nom) + '</span><div><b>' + esc(c.nom) + '</b><div class="aide" style="margin-top:0">' + esc(c.id) + ' · ' + esc(c.societe) + '</div></div></div></td>' +
          '<td>' + ROLES[c.role] + '</td><td><span class="statut ' + (c.actif ? 'on' : 'off') + '">' + (c.actif ? 'Actif' : 'Désactivé') + '</span>' + (c.actif && c.provisoire ? '<div class="aide" style="margin-top:2px">Mot de passe provisoire</div>' : '') + '</td>' +
          '<td>' + (c.derniere ? esc(dfr(c.derniere) + c.derniere.slice(10)) : 'Jamais') + '</td>' +
          '<td><div class="actions-ligne"><button type="button" class="btn btn-petit" data-act="mdp" data-c="' + c.id + '" title="Générer un nouveau mot de passe">Mot de passe</button>' +
          (c.id !== S.session ? '<button type="button" class="btn btn-petit btn-danger" data-act="actif" data-c="' + c.id + '">' + (c.actif ? 'Désactiver' : 'Réactiver') + '</button>' : '') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="carte-form" style="margin-top:18px"><h2>Paramètres du contrat</h2><div class="grille2"><div><label class="lbl" for="mel">Date de mise en ligne officielle</label><input class="champ" id="mel" type="date" value="' + S.miseEnLigne + '" data-input="miseEnLigne" /></div>' +
      '<div><label class="lbl">Fin de la période éligible</label><input class="champ" value="' + dfr(plus12moisMoins1()) + '" disabled /></div></div>' +
      '<p class="aide">Constatée par la recette écrite des trois parties (§ 15). Elle déclenche les 12 mois de commissions. Toute modification est inscrite dans l’historique.</p></div></div>' +
      '<form class="carte-form" data-form="membre"><h2>Ajouter un membre</h2><p class="aide" style="margin-top:-6px">Un mot de passe provisoire est généré automatiquement.</p>' +
      '<div><label class="lbl" for="n-nom">Nom affiché *</label><input class="champ" id="n-nom" name="nom" required /></div>' +
      '<div><label class="lbl" for="n-id">Identifiant *</label><input class="champ" id="n-id" name="id" required pattern="[a-z0-9._\\-]{2,32}" autocapitalize="none" placeholder="ex. sophie" /></div>' +
      '<div class="grille2"><div><label class="lbl" for="n-role">Rôle</label><select class="champ" id="n-role" name="role"><option value="commercial">Commercial</option><option value="controle">Contrôle</option><option value="gerant">Gérant</option><option value="admin">Administrateur</option></select></div>' +
      '<div><label class="lbl" for="n-soc">Société</label><input class="champ" id="n-soc" name="societe" placeholder="ex. VATEA" /></div></div>' +
      '<button class="btn btn-or">Créer le compte</button><div class="aide"><b>Rôles (cahier des charges § 7)</b><br />Gérant / commercial : saisit prospects, devis, factures et encaissements.<br />Contrôle : consulte ventes, encaissements et commissions, exporte ; ne modifie rien.<br />Administrateur : comptes, sécurité, statut des commissions.</div></form></div>';
    return h;
  }

  /* ───────────── Écran de choix du compte ───────────── */
  function ecranChoix() {
    var desc = {
      hugo: 'Saisit les prospects, devis, factures et encaissements, et joint les justificatifs.',
      jeff: 'Consulte les ventes, les encaissements et sa commission de 16 %, exporte le rapport. Ne modifie rien.',
      marc: 'Consulte les ventes, les encaissements et sa commission de 9 %, exporte le rapport. Ne modifie rien.',
      admin: 'Gère les comptes et les mots de passe, valide le statut des commissions après le contrôle mensuel.'
    };
    return '<main class="ecran-choix"><img class="logo" src="/media/logo-va.png" alt="VATEA" /><div><h1>VATEA — CRM</h1><p class="sous">Démonstration avec des données fictives. Choisissez un compte : dans la vraie application, chacun se connecte avec son identifiant et son mot de passe.</p></div>' +
      '<div class="choix-comptes">' + ['hugo', 'jeff', 'marc', 'admin'].map(function (id) {
        var c = S.comptes.find(function (x) { return x.id === id; });
        return '<button type="button" class="choix" data-act="connexion" data-c="' + id + '"><span class="avatar">' + initiales(c.nom) + '</span><span class="role">' + ROLES[c.role] + ' · ' + esc(c.societe) + '</span><b>' + esc(c.nom) + '</b><p>' + desc[id] + '</p></button>';
      }).join('') + '</div><p class="aide">Les modifications restent dans ce navigateur. Bouton « Réinitialiser » pour repartir des données de départ.</p></main>';
  }

  /* ───────────── Fiche prospect ───────────── */
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
      corps = '<fieldset class="panneau-corps" style="border:0;margin:0;min-width:0"' + (w ? '' : ' disabled') + '>' + (w ? '' : '<p class="aide">Consultation seule : votre rôle ne permet pas de modifier les données commerciales.</p>') +
        (nouveau ? '' : '<div><label class="lbl">Étape</label><select class="champ" data-etape-fiche>' + ETAPES.map(function (e) { return '<option value="' + e.id + '"' + (p.etape === e.id ? ' selected' : '') + '>' + e.label + '</option>'; }).join('') + '</select>' + (p.etape === 'perdu' && p.raisonPerte ? '<p class="aide">Raison : ' + esc(p.raisonPerte) + '</p>' : '') + '</div>') +
        '<div class="bloc"><div class="bloc-titre">Contact</div><div><label class="lbl">Entreprise *</label>' + inp('entreprise', 'text', ' required') + '</div>' +
        '<div class="grille2"><div><label class="lbl">Personne de contact</label>' + inp('contact') + '</div><div><label class="lbl">Téléphone</label>' + inp('telephone', 'tel') + '</div></div>' +
        '<div class="grille2"><div><label class="lbl">E-mail</label>' + inp('email', 'email') + '</div><div><label class="lbl">Site web</label>' + inp('siteWeb', 'text', ' placeholder="https://"') + '</div></div></div>' +
        '<div class="bloc"><div class="bloc-titre">Projet</div><div><label class="lbl">Source *</label>' + sel('source', SOURCES, true, bloque) +
        (p.sourceVerrouillee ? '<p class="aide">🔒 Verrouillée depuis l’envoi du devis' + (estAdmin() ? ' — toute correction est inscrite dans l’historique.' : ' — seul l’administrateur peut la corriger.') + '</p>' : '') + '</div>' +
        '<div class="grille2"><div><label class="lbl">Type de vidéo</label>' + sel('typeVideo', TYPES_VIDEO) + '</div><div><label class="lbl">Budget estimé HT (€)</label>' + inp('montantEstime', 'text', ' inputmode="decimal"') + '</div></div>' +
        '<div><label class="lbl">Prochaine relance</label>' + inp('relance', 'date') + '</div><div><label class="lbl">Notes</label><textarea class="champ" name="notes">' + esc(p.notes || '') + '</textarea></div></div>' +
        '<p class="erreur" hidden></p></fieldset>';
    } else if (o === 'facturation') {
      var d = p.devis, el = eligibilite(p), fs = facturesDe(p.id);
      corps = '<div class="panneau-corps"><div class="bloc' + (d && d.dateSignature ? ' or' : '') + '"><div class="bloc-titre">Devis</div>';
      if (!d) corps += '<p class="aide" style="margin:0">Aucun devis enregistré.</p>' + (w && p.etape !== 'perdu' ? '<div><button type="button" class="btn btn-petit" data-act="f-devis">Enregistrer le devis envoyé</button></div>' : '');
      else {
        corps += '<div class="info-ligne"><span>Référence</span><b>' + esc(d.ref) + '</b></div><div class="info-ligne"><span>Envoyé le</span><span>' + dfr(d.dateEnvoi) + '</span></div><div class="info-ligne"><span>Montant HT</span><b>' + eur(d.montantHt) + '</b></div>' +
          '<div class="info-ligne"><span>Statut</span><span class="pastille ' + (d.dateSignature ? 'p-ok' : p.etape === 'perdu' ? 'p-bad' : 'p-info') + '">' + (d.dateSignature ? 'Accepté' : p.etape === 'perdu' ? 'Refusé' : 'Envoyé') + '</span></div>';
        if (d.dateSignature) corps += '<div class="info-ligne"><span>Signé le</span><b>' + dfr(d.dateSignature) + '</b></div><div class="info-ligne"><span>Preuve</span><span>' + esc(d.typePreuve) + '</span></div>' +
          '<div class="info-ligne"><span>Fichier</span>' + (d.fichierPreuve ? '<span class="fichier">📎 ' + esc(d.fichierPreuve) + '</span>' : (w ? '<button type="button" class="btn btn-petit" data-act="joindre-preuve">Joindre la preuve</button>' : '<span class="fichier manquant">À joindre</span>')) + '</div>' +
          '<div class="info-ligne"><span>Commissions</span><span class="pastille ' + (el.ok ? 'p-ok' : 'p-neutre') + '">' + el.raison + '</span></div>';
        else if (w && p.etape !== 'perdu') corps += '<div><button type="button" class="btn btn-petit" data-act="f-signer">Marquer comme signé</button></div>';
      }
      corps += '</div><div class="bloc"><div class="bloc-titre">Factures et paiements</div>';
      if (!fs.length) corps += '<p class="aide" style="margin:0">Aucune facture enregistrée.</p>';
      fs.forEach(function (f) {
        var sp = statutPaiement(f), recu = encaisse(f.id), du = ttcF(f), es = encDe(f.id);
        corps += '<div class="facture"><div class="facture-tete"><b>' + esc(f.numero) + '</b>' + (f.avoir ? '<span class="pastille p-neutre">Avoir</span>' : '') + '<span class="pastille ' + sp.cl + '">' + sp.t + '</span><span class="num">' + eur(f.ht) + ' HT · ' + eur(du) + ' TTC</span></div>' +
          '<div class="aide" style="margin:0">Émise le ' + dfr(f.date) + (f.fichier ? ' · 📎 ' + esc(f.fichier) : '') + ' · ' + (f.avoir ? 'remboursé ' : 'encaissé ') + eur(Math.abs(recu)) + '</div>' +
          es.map(function (e) {
            return '<div class="mvt"><span>' + dfr(e.date) + '</span><span class="ref">' + esc(e.reference) + '</span><b class="num">' + eur(e.ttc) + '</b>' +
              (e.justificatif ? '<span class="fichier" title="' + esc(e.justificatif) + '">📎 Extrait</span>' : (w ? '<button type="button" class="btn btn-petit" data-act="joindre" data-e="' + e.id + '">Joindre l’extrait</button>' : '<span class="fichier manquant">Sans extrait</span>')) + '</div>';
          }).join('') +
          (w && Math.abs(recu) < Math.abs(du) - 0.005 ? '<div class="actions-fact"><button type="button" class="btn btn-petit" data-act="encaisser" data-f="' + f.id + '">' + (f.avoir ? '+ Remboursement' : '+ Encaissement') + '</button></div>' : '') + '</div>';
      });
      if (w && d && d.dateSignature && p.etape !== 'perdu') corps += '<div class="actions-fact"><button type="button" class="btn btn-petit" data-act="f-facture">+ Facture</button>' + (fs.some(function (f) { return !f.avoir; }) ? '<button type="button" class="btn btn-petit" data-act="f-avoir">+ Avoir</button>' : '') + '</div>';
      else if (w && d && !d.dateSignature) corps += '<p class="aide" style="margin:0">La facturation s’ouvre après la signature du devis.</p>';
      corps += '<p class="aide" style="margin:0">Les factures sont émises dans le logiciel de Hugo (facturation électronique Peppol) ; le CRM en garde la trace et calcule les commissions.</p></div></div>';
    } else {
      var j = S.journal.filter(function (x) { return x.pid === p.id; });
      corps = '<div class="panneau-corps">' + (j.length ? '<ul class="journal">' + j.map(function (x) { return '<li><time>' + esc(dfr(x.le) + x.le.slice(10)) + '</time><b>' + esc(x.action) + ' — ' + esc(x.auteur) + '</b>' + (x.details ? '<div class="diff">' + esc(x.details) + '</div>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="vide">Aucun événement.</p>') + '</div>';
    }
    var onglets = nouveau ? '' : '<div class="onglets">' + [['fiche', 'Fiche'], ['facturation', 'Devis & paiements'], ['historique', 'Historique']].map(function (t) { return '<button type="button" data-act="onglet" data-onglet="' + t[0] + '" class="' + (o === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    document.getElementById('modale').insertAdjacentHTML('afterbegin',
      '<div class="voile" id="fiche"><form class="panneau" role="dialog" aria-modal="true" aria-label="' + esc(nouveau ? 'Nouveau prospect' : p.entreprise) + '" data-form="fiche" novalidate>' +
      '<div class="panneau-tete"><h2>' + esc(nouveau ? 'Nouveau prospect' : p.entreprise) + '</h2><button type="button" class="btn btn-icone" data-act="fermer-fiche" aria-label="Fermer">✕</button></div>' + onglets + corps +
      '<div class="panneau-pied"><button type="button" class="btn" data-act="fermer-fiche">Fermer</button>' + (o === 'fiche' && w ? '<button class="btn btn-or">' + (nouveau ? 'Créer le prospect' : 'Enregistrer') + '</button>' : '') + '</div></form></div>');
  }

  function enregistrerFiche(form) {
    var nouveau = ui.fiche.id === 'nouveau', p = nouveau ? null : prospect(ui.fiche.id);
    var g = function (k) { return form.elements[k] ? form.elements[k].value.trim() : ''; };
    var v = { entreprise: g('entreprise'), contact: g('contact'), telephone: g('telephone'), email: g('email'), siteWeb: g('siteWeb'), source: form.elements.source.disabled ? p.source : g('source'), typeVideo: g('typeVideo'), relance: g('relance'), notes: g('notes') };
    var me = g('montantEstime'), err = form.querySelector('.erreur');
    v.montantEstime = me ? montant(me) : null;
    var pb = !v.entreprise ? 'Le nom de l’entreprise est obligatoire.' : !v.source ? 'Choisissez une source.' : (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) ? 'Adresse e-mail invalide.' : (me && !(v.montantEstime >= 0)) ? 'Budget invalide.' : '';
    if (pb) { err.textContent = pb; err.hidden = false; return; }
    if (nouveau) {
      p = Object.assign({ id: S.seq.p++, etape: 'nouveau', sourceVerrouillee: false, responsable: S.session, raisonPerte: '', devis: null, creeLe: auj() }, v);
      S.prospects.unshift(p);
      journaliser('Prospect créé', p.id, v.source);
      ui.fiche = { id: p.id, onglet: 'fiche' };
      toast('Prospect créé.');
    } else {
      var ch = [];
      Object.keys(v).forEach(function (k) { if (String(p[k] == null ? '' : p[k]) !== String(v[k] == null ? '' : v[k])) ch.push(k === 'source' ? 'source : ' + p.source + ' → ' + v.source : k); });
      if (!ch.length) { ui.fiche = null; rendre(); return; }
      var srcCorr = p.sourceVerrouillee && p.source !== v.source;
      Object.assign(p, v);
      journaliser(srcCorr ? 'Source verrouillée corrigée par l’administrateur' : 'Fiche modifiée', p.id, ch.join(', '));
      ui.fiche = null;
      toast('Fiche enregistrée.');
    }
    sauver(); rendre();
  }

  /* ───────────── Exports CSV ───────────── */
  function cellule(v) { var s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = "'" + s; return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function nombre(v) { return v == null || v === '' ? '' : String(v.toFixed ? v.toFixed(2) : v).replace('.', ','); }
  function telecharger(nom, lignes) {
    var csv = '﻿' + lignes.map(function (l) { return l.map(cellule).join(';'); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = nom; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function exporterCommissions() {
    var L = lignesCommission().filter(function (l) { return !ui.mois || l.e.date.slice(0, 7) === ui.mois; });
    var lignes = [['Date encaissement', 'Client / dossier', 'Devis', 'Devis signé le', 'Montant devis HT', 'Éligibilité', 'Facture', 'Référence virement', 'Encaissé TTC', 'Base HT', 'Commission JEGO 16 %', 'Commission Marc 9 %', 'Justificatif', 'Statut']];
    L.forEach(function (l) {
      lignes.push([dfr(l.e.date), l.p.entreprise, l.p.devis ? l.p.devis.ref : '', dfr(l.p.devis && l.p.devis.dateSignature), nombre(l.p.devis && l.p.devis.montantHt), l.el.raison, l.f.numero, l.e.reference, nombre(l.e.ttc), nombre(l.ht), l.el.ok ? nombre(l.j) : '', l.el.ok ? nombre(l.m) : '', l.e.justificatif ? 'Extrait joint' : 'Manquant', l.el.ok ? (STATUT_COM[l.e.statut] || STATUT_COM.a_verifier).label : 'Non éligible']);
    });
    var el = L.filter(function (l) { return l.el.ok; });
    lignes.push(['TOTAL ÉLIGIBLE', '', '', '', '', '', '', '', '', nombre(r2(el.reduce(function (s, l) { return s + l.ht; }, 0))), nombre(r2(el.reduce(function (s, l) { return s + l.j; }, 0))), nombre(r2(el.reduce(function (s, l) { return s + l.m; }, 0))), '', '']);
    telecharger('vatea-rapport-commissions-' + (ui.mois || 'complet') + '.csv', lignes);
    journaliser('Export du rapport de commissions', null, ui.mois ? moisLabel(ui.mois) : 'Tous les mois'); sauver();
  }
  function exporterProspects() {
    var lignes = [['ID', 'Entreprise', 'Contact', 'Téléphone', 'E-mail', 'Type de vidéo', 'Source', 'Source verrouillée', 'Étape', 'Devis', 'Montant HT', 'Signé le', 'Prochaine relance']];
    filtres().forEach(function (p) { lignes.push([p.id, p.entreprise, p.contact, p.telephone, p.email, p.typeVideo, p.source, p.sourceVerrouillee ? 'oui' : 'non', ETAPE[p.etape].label, p.devis ? p.devis.ref : '', nombre(montantP(p)), dfr(p.devis && p.devis.dateSignature), dfr(p.relance)]); });
    telecharger('vatea-prospects-' + auj() + '.csv', lignes);
    journaliser('Export des prospects', null, lignes.length - 1 + ' lignes'); sauver();
  }

  /* ───────────── Rendu principal ───────────── */
  function rendre() {
    var app = document.getElementById('app');
    if (!moi()) { app.innerHTML = ecranChoix(); document.getElementById('modale').innerHTML = ''; return; }
    if (ui.vue === 'admin' && !estAdmin()) ui.vue = 'pipeline';
    var corps = ui.vue === 'encaissements' ? vueEncaissements() : ui.vue === 'commissions' ? vueCommissions() : ui.vue === 'historique' ? vueHistorique() : ui.vue === 'admin' ? vueAdmin() : vuePipeline();
    var actif = document.activeElement, rech = actif && actif.dataset && actif.dataset.input === 'q', pos = rech ? actif.selectionStart : 0;
    app.innerHTML = entete() + '<main class="page">' + corps + '</main>';
    if (rech) { var el = app.querySelector('[data-input="q"]'); el.focus(); el.setSelectionRange(pos, pos); }
    rendreFiche();
  }

  /* ───────────── Événements ───────────── */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act]');
    if (!t) { if (ev.target.classList.contains('voile')) { ui.fiche = null; rendreFiche(); } else if (ev.target.classList.contains('modale-voile')) fermerModale(ev.target); return; }
    var act = t.dataset.act;
    if (t.tagName === 'A') ev.preventDefault();
    switch (act) {
      case 'connexion': {
        var c = S.comptes.find(function (x) { return x.id === t.dataset.c; });
        if (!c.actif) return toast('Ce compte est désactivé.', true);
        S.session = c.id; c.derniere = maintenant(); journaliser('Connexion'); sauver(); ui.vue = 'pipeline'; ui.fiche = null; rendre(); window.scrollTo(0, 0); break;
      }
      case 'changer-compte': S.session = null; ui.fiche = null; sauver(); rendre(); window.scrollTo(0, 0); break;
      case 'reinitialiser':
        confirmer('Réinitialiser la démo ?', 'Toutes vos modifications seront effacées et les données fictives de départ rechargées.', 'Réinitialiser', function () {
          var sess = S.session; S = etatInitial(); S.session = sess; sauver(); ui.fiche = null; o_apres = function () { rendre(); toast('Démo réinitialisée.'); };
        });
        break;
      case 'vue': ui.vue = t.dataset.vue; ui.fiche = null; rendre(); window.scrollTo(0, 0); break;
      case 'mode': ui.mode = t.dataset.mode; try { localStorage.setItem(CLE + '-mode', ui.mode); } catch (e) { /* */ } rendre(); break;
      case 'perdu-toggle': ui.perduOuvert = !ui.perduOuvert; rendre(); break;
      case 'nouveau': ui.fiche = { id: 'nouveau', onglet: 'fiche' }; rendreFiche(); break;
      case 'fiche': ui.fiche = { id: Number(t.dataset.id), onglet: t.dataset.onglet || 'fiche' }; rendreFiche(); break;
      case 'onglet': ui.fiche.onglet = t.dataset.onglet; rendreFiche(); break;
      case 'fermer-fiche': ui.fiche = null; rendreFiche(); break;
      case 'modale-annuler': fermerModale(t.closest('[data-modale]')); break;
      case 'f-devis': { var p1 = prospect(ui.fiche.id); demanderDevis(p1, function () { var pp = prospect(ui.fiche.id); if (ETAPE[pp.etape].rang < ETAPE.devis_envoye.rang) avancer(pp, 'devis_envoye'); else rendre(); }); break; }
      case 'f-signer': { var p2 = prospect(ui.fiche.id); avancer(p2, 'devis_signe'); break; }
      case 'f-facture': demanderFacture(prospect(ui.fiche.id), rendre); break;
      case 'f-avoir': demanderFacture(prospect(ui.fiche.id), rendre, true); break;
      case 'encaisser': demanderEncaissement(facture(t.dataset.f), rendre); break;
      case 'joindre': {
        var e = S.encaissements.find(function (x) { return x.id === t.dataset.e; });
        ouvrirModale({ titre: 'Extrait bancaire — ' + e.reference, texte: 'Extrait faisant apparaître le crédit reçu, sa date, son montant et la référence (§ 9.1). Masquez les mouvements sans rapport avec le contrat.', bouton: 'Joindre',
          champs: [{ k: 'f', label: 'Extrait bancaire', type: 'file', req: true }],
          onOk: function (v) { e.justificatif = v.f; journaliser('Extrait bancaire joint', facture(e.factureId).prospectId, e.reference + ' — ' + v.f); sauver(); o_apres = rendre; return null; } });
        break;
      }
      case 'joindre-preuve': {
        var pp2 = prospect(ui.fiche.id);
        ouvrirModale({ titre: 'Preuve de signature — ' + pp2.devis.ref, texte: 'Devis accepté, bon de commande ou contrat (§ 8.1). Démo : seul le nom du fichier est conservé.', bouton: 'Joindre',
          champs: [{ k: 'f', label: 'Fichier', type: 'file', req: true }],
          onOk: function (v) { pp2.devis.fichierPreuve = v.f; journaliser('Preuve de signature jointe', pp2.id, pp2.devis.ref + ' — ' + v.f); sauver(); o_apres = rendre; return null; } });
        break;
      }
      case 'export-commissions': exporterCommissions(); toast('Rapport exporté (CSV, ouvrable dans Excel).'); break;
      case 'export-prospects': exporterProspects(); toast('Liste exportée (CSV).'); break;
      case 'mdp': {
        var c2 = S.comptes.find(function (x) { return x.id === t.dataset.c; });
        confirmer('Générer un nouveau mot de passe ?', 'L’ancien mot de passe de ' + esc(c2.nom) + ' ne fonctionnera plus et ses sessions seront fermées.', 'Générer', function () {
          c2.provisoire = true; journaliser('Mot de passe réinitialisé', null, c2.id); sauver();
          o_apres = function () { rendre(); afficherMdp(c2); };
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
    if (k === 'q') { ui.q = ev.target.value; rendre(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, k = t.dataset && t.dataset.input;
    if (k === 'source') { ui.source = t.value; rendre(); }
    else if (k === 'mois') { ui.mois = t.value; rendre(); }
    else if (k === 'miseEnLigne' && t.value) { var av = S.miseEnLigne; S.miseEnLigne = t.value; journaliser('Date de mise en ligne modifiée', null, dfr(av) + ' → ' + dfr(t.value)); sauver(); rendre(); toast('Période éligible recalculée.'); }
    else if (t.dataset && t.dataset.statut) {
      var e = S.encaissements.find(function (x) { return x.id === t.dataset.statut; });
      if (!e.justificatif && t.value !== 'a_verifier') { t.value = e.statut; return toast('Impossible de valider sans extrait bancaire.', true); }
      var av2 = STATUT_COM[e.statut].label; e.statut = t.value; journaliser('Statut de commission', facture(e.factureId).prospectId, e.reference + ' : ' + av2 + ' → ' + STATUT_COM[e.statut].label); sauver(); rendre();
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
    if (ev.key === 'Escape') { if (document.querySelector('[data-modale]')) fermerModale(); else if (ui.fiche) { ui.fiche = null; rendreFiche(); } }
    if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.act === 'perdu-toggle') { ui.perduOuvert = true; rendre(); }
  });

  // Glisser-déposer : on ne redessine rien pendant le survol (sinon le glissement s'interrompt)
  var glisse = null;
  document.addEventListener('dragstart', function (ev) { var c = ev.target.closest && ev.target.closest('.carte[draggable]'); if (!c) return; glisse = Number(c.dataset.id); ev.dataTransfer.setData('text/plain', String(glisse)); ev.dataTransfer.effectAllowed = 'move'; c.classList.add('glisse'); });
  document.addEventListener('dragend', function () { glisse = null; document.querySelectorAll('.glisse, .survol').forEach(function (n) { n.classList.remove('glisse', 'survol'); }); });
  document.addEventListener('dragover', function (ev) { var col = ev.target.closest && ev.target.closest('.colonne[data-etape]'); if (!col || glisse == null) return; ev.preventDefault(); document.querySelectorAll('.survol').forEach(function (n) { if (n !== col) n.classList.remove('survol'); }); col.classList.add('survol'); });
  document.addEventListener('drop', function (ev) {
    var col = ev.target.closest && ev.target.closest('.colonne[data-etape]'); if (!col) return;
    ev.preventDefault(); col.classList.remove('survol');
    var id = Number(ev.dataTransfer.getData('text/plain')), p = prospect(id); glisse = null;
    if (p && p.etape !== col.dataset.etape) avancer(p, col.dataset.etape);
  });

  rendre();
})();
