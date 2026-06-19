// Seed de pedidos de TESTE no Firestore (texto puro — a tela exibe normal).
// Uso: node scripts/seed-orders.mjs   (rodar na raiz do projeto)
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Lê as variáveis do .env
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
const ordersCol = collection(db, 'orders');

const now = Date.now();
const iso = (minsAgo) => new Date(now - minsAgo * 60000).toISOString();

const samples = [
  {
    id: now + 1, nome: 'Maria Aparecida', telefone: '(37) 99999-1111',
    tipo: 'retirada', pagamento: 'PIX', source: 'cesta',
    items: [{ id: 'cesta18', name: 'Cesta 18 itens', qty: 1, price: 55 }],
    total: 55, pago: false, embalado: false, entregue: false, timestamp: iso(8), _encrypted: false,
  },
  {
    id: now + 2, nome: 'João Silva', telefone: '(37) 98888-2222',
    tipo: 'entrega', pagamento: 'Dinheiro', precisaTroco: true, valorTroco: 'R$ 100,00',
    rua: 'Rua das Flores', numero: '123', bairro: 'Centro', cidade: 'Formiga', uf: 'MG',
    source: 'montar',
    items: [
      { name: 'Banana', qty: 2, unidade: 'g' }, { name: 'Alface', qty: 1, unidade: 'un' },
      { name: 'Tomate', qty: 2, unidade: 'g' }, { name: 'Cenoura', qty: 2, unidade: 'g' },
      { name: 'Batata', qty: 2, unidade: 'g' }, { name: 'Abacate', qty: 1, unidade: 'g' },
      { name: 'Beterraba', qty: 1, unidade: 'g' }, { name: 'Abobrinha Italiana', qty: 2, unidade: 'g' },
      { name: 'Agrião', qty: 1, unidade: 'un' }, { name: 'Acelga', qty: 1, unidade: 'un' },
    ],
    total: 48, pago: false, embalado: true, entregue: false, timestamp: iso(22), _encrypted: false,
  },
  {
    id: now + 3, nome: 'Carla Ferreira', telefone: '(37) 97777-3333',
    tipo: 'retirada', pagamento: 'PIX', source: 'cesta',
    items: [{ id: 'cesta18', name: 'Cesta 18 itens', qty: 2, price: 55 }],
    total: 110, pago: true, embalado: false, entregue: false, timestamp: iso(45), _encrypted: false,
  },
  {
    id: now + 4, nome: 'Pedro Henrique', telefone: '(37) 96666-4444',
    tipo: 'entrega', pagamento: 'PIX',
    rua: 'Av. Brasil', numero: '900', bairro: 'São Luiz', cidade: 'Formiga', uf: 'MG',
    source: 'montar',
    items: [
      { name: 'Abacaxi', qty: 1, unidade: 'g' }, { name: 'Mamão', qty: 1, unidade: 'g' },
      { name: 'Couve', qty: 2, unidade: 'un' }, { name: 'Brócolis Ramoso', qty: 1, unidade: 'un' },
    ],
    total: 35, pago: false, embalado: false, entregue: false, timestamp: iso(3), _encrypted: false,
  },
];

for (const o of samples) {
  const ref = await addDoc(ordersCol, o);
  console.log('criado:', o.nome, '->', ref.id);
}
console.log('\n✓ pedidos de teste criados');
process.exit(0);
