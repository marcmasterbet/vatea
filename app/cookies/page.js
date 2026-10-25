import { redirect } from 'next/navigation';

// Les cookies sont décrits dans la politique de confidentialité (section 11).
export default function Page() {
  redirect('/politique-de-confidentialite#11-cookies');
}
