'use client';

import { ouvrirParametresCookies } from './CookieConsent';

export default function LienCookies() {
  return <button type="button" className="lien-cookies" onClick={ouvrirParametresCookies}>Paramètres des cookies</button>;
}
