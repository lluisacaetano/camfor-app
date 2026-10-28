// Configuração SOMENTE para demonstração local (sem Firebase). Não faz parte do app.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');

const nomes = [
  ['Abacate', 'g'], ['Abacaxi', 'un'], ['Abóbora', 'g'], ['Acelga', 'un'], ['Acerola', 'pct'],
  ['Agrião', 'un'], ['Alface', 'un'], ['Alho', 'g'], ['Almeirão', 'un'], ['Banana', 'g'],
  ['Batata', 'g'], ['Beterraba', 'g'], ['Cebola', 'g'], ['Cebolinha', 'un'], ['Cenoura', 'g'],
  ['Chicória', 'un'], ['Chuchu', 'g'], ['Couve', 'un'], ['Goiaba', 'g'], ['Inhame', 'g'],
];

const firestoreMock = `
const produtos = ${JSON.stringify(nomes.map(([nome, unidade]) => ({ nome, unidade, docId: nome })))};
const config = { selectedItems: produtos.map(p => p.nome), prices: { 10: 35, 15: 50, 18: 60 } };
export const subscribeToAdminConfig = cb => { setTimeout(() => cb(config), 0); return () => {}; };
export const subscribeToProducts = cb => { setTimeout(() => cb(produtos), 0); return () => {}; };
const noop = async () => null;
export const saveAdminConfig = noop, getAdminConfig = noop, clearAdminConfig = noop, saveOrder = noop,
  getOrders = noop, updateOrder = noop, deleteOrder = noop, clearAllOrders = noop, getProducts = noop,
  addProduct = noop, deleteProduct = noop, updateProduct = noop, seedProducts = noop,
  uploadProductImage = noop, deleteProductImage = noop, addProductWithImage = noop,
  updateProductWithImage = noop, migrateProductsUnits = noop, deleteProductWithImage = noop;
export const subscribeToOrders = () => () => {};
`;

const demoPlugin = {
  name: 'camfor-demo',
  enforce: 'pre',
  load(id) {
    const f = id.split('?')[0];
    if (f === path.join(root, 'src/firebase.js')) return 'export const db = {}; export const auth = {}; export default {};';
    if (f === path.join(root, 'src/services/firestoreService.js')) return firestoreMock;
    if (f === path.join(root, 'src/services/storeControl.js')) return 'export const fecharLoja = async () => {}; export const abrirLoja = async () => {};';
    if (f === path.join(root, 'src/services/authService.js')) {
      return 'export const subscribeToAuthChanges = cb => { cb(null); return () => {}; }; export const logoutAdmin = async () => {}; export const loginAdmin = async () => {}; export const getCurrentUser = () => null; export const isAuthenticated = () => false;';
    }
    if (f === path.join(root, 'src/utils/storeHours.js')) {
      return fs.readFileSync(f, 'utf8').replace('const FORCE_OPEN = false', 'const FORCE_OPEN = true');
    }
  },
};

export default defineConfig({ root, plugins: [demoPlugin, react()] });
