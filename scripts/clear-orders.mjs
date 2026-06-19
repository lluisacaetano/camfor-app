// Apaga TODOS os pedidos da coleção `orders`.
// Excluir exige login de admin (regras do Firestore), então rode passando
// as credenciais por variável de ambiente (assim a senha não fica no código):
//
//   ADMIN_EMAIL="seu@email" ADMIN_PASSWORD="suasenha" node scripts/clear-orders.mjs
//
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const env = {};
readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n').forEach((l) => {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Defina ADMIN_EMAIL e ADMIN_PASSWORD ao rodar. Ex.:');
  console.error('  ADMIN_EMAIL="..." ADMIN_PASSWORD="..." node scripts/clear-orders.mjs');
  process.exit(1);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
console.log('✓ login admin ok');

const snap = await getDocs(collection(db, 'orders'));
console.log(`Encontrados ${snap.size} pedido(s). Apagando...`);

let n = 0;
for (const d of snap.docs) {
  await deleteDoc(doc(db, 'orders', d.id));
  n++;
}

console.log(`✓ ${n} pedido(s) apagado(s).`);
process.exit(0);
