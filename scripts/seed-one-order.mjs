// Cria UM pedido de teste (Cartão de crédito) — para ver a notificação ao vivo.
// Uso: node scripts/seed-one-order.mjs
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const env = {};
readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n').forEach((l) => {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
});

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const order = {
  id: Date.now(),
  nome: 'Ana Beatriz',
  telefone: '(37) 99123-4567',
  tipo: 'entrega',
  pagamento: 'Cartão de crédito',
  rua: 'Rua dos Ipês', numero: '45', bairro: 'Jardim das Acácias', cidade: 'Formiga', uf: 'MG',
  source: 'montar',
  items: [
    { name: 'Tomate', qty: 2, unidade: 'g' }, { name: 'Alface', qty: 1, unidade: 'un' },
    { name: 'Cenoura', qty: 2, unidade: 'g' }, { name: 'Banana', qty: 2, unidade: 'g' },
    { name: 'Batata', qty: 2, unidade: 'g' }, { name: 'Couve', qty: 1, unidade: 'un' },
    { name: 'Beterraba', qty: 1, unidade: 'g' }, { name: 'Abacate', qty: 1, unidade: 'g' },
    { name: 'Mamão', qty: 1, unidade: 'g' }, { name: 'Agrião', qty: 1, unidade: 'un' },
  ],
  total: 48,
  pago: false, embalado: false, entregue: false,
  timestamp: new Date().toISOString(),
  _encrypted: false,
};

const ref = await addDoc(collection(db, 'orders'), order);
console.log('✓ pedido criado (Cartão de crédito):', order.nome, '->', ref.id);
process.exit(0);
