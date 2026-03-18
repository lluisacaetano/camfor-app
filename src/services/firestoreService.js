import { db } from '../firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';

// Referência do documento de configuração do admin
const CONFIG_DOC = doc(db, 'config', 'admin');

/**
 * Salva a configuração do admin (itens selecionados e preços)
 */
export async function saveAdminConfig(selectedItems, prices) {
  try {
    await setDoc(CONFIG_DOC, {
      selectedItems,
      prices,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    throw error;
  }
}

/**
 * Busca a configuração do admin uma única vez
 */
export async function getAdminConfig() {
  try {
    const docSnap = await getDoc(CONFIG_DOC);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return { selectedItems: [], prices: { 10: 0, 15: 0, 18: 0 } };
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return { selectedItems: [], prices: { 10: 0, 15: 0, 18: 0 } };
  }
}

/**
 * Escuta mudanças em tempo real na configuração do admin
 * Retorna uma função para cancelar a inscrição
 */
export function subscribeToAdminConfig(callback) {
  return onSnapshot(CONFIG_DOC, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ selectedItems: [], prices: { 10: 0, 15: 0, 18: 0 } });
    }
  }, (error) => {
    console.error('Erro ao escutar configuração:', error);
    callback({ selectedItems: [], prices: { 10: 0, 15: 0, 18: 0 } });
  });
}

/**
 * Limpa a configuração do admin (reset diário)
 */
export async function clearAdminConfig() {
  try {
    await setDoc(CONFIG_DOC, {
      selectedItems: [],
      prices: { 10: 0, 15: 0, 18: 0 },
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Erro ao limpar configuração:', error);
    throw error;
  }
}

// ============ PEDIDOS ============

const ORDERS_COLLECTION = collection(db, 'orders');

/**
 * Salva um novo pedido
 */
export async function saveOrder(orderData) {
  try {
    const docRef = await addDoc(ORDERS_COLLECTION, {
      ...orderData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      entregue: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    throw error;
  }
}

/**
 * Busca todos os pedidos
 */
export async function getOrders() {
  try {
    const q = query(ORDERS_COLLECTION, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ ...doc.data(), docId: doc.id });
    });
    return orders;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

/**
 * Escuta mudanças em tempo real nos pedidos
 */
export function subscribeToOrders(callback) {
  const q = query(ORDERS_COLLECTION, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ ...doc.data(), docId: doc.id });
    });
    callback(orders);
  }, (error) => {
    console.error('Erro ao escutar pedidos:', error);
    callback([]);
  });
}

/**
 * Atualiza um pedido (ex: marcar como entregue)
 */
export async function updateOrder(docId, updates) {
  try {
    const orderRef = doc(db, 'orders', docId);
    await updateDoc(orderRef, updates);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    throw error;
  }
}

/**
 * Remove um pedido
 */
export async function deleteOrder(docId) {
  try {
    const orderRef = doc(db, 'orders', docId);
    await deleteDoc(orderRef);
    return true;
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    throw error;
  }
}

/**
 * Limpa todos os pedidos (reset diário)
 */
export async function clearAllOrders() {
  try {
    const querySnapshot = await getDocs(ORDERS_COLLECTION);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Erro ao limpar pedidos:', error);
    throw error;
  }
}

// ============ PRODUTOS ============

const PRODUCTS_COLLECTION = collection(db, 'products');

/**
 * Busca todos os produtos cadastrados
 */
export async function getProducts() {
  try {
    const q = query(PRODUCTS_COLLECTION, orderBy('nome'));
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ ...doc.data(), docId: doc.id });
    });
    return products;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

/**
 * Escuta mudanças em tempo real nos produtos
 */
export function subscribeToProducts(callback) {
  const q = query(PRODUCTS_COLLECTION, orderBy('nome'));
  return onSnapshot(q, (querySnapshot) => {
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ ...doc.data(), docId: doc.id });
    });
    callback(products);
  }, (error) => {
    console.error('Erro ao escutar produtos:', error);
    callback([]);
  });
}

/**
 * Adiciona um produto
 */
export async function addProduct(nome, imagem) {
  try {
    const docRef = await addDoc(PRODUCTS_COLLECTION, { nome, imagem });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    throw error;
  }
}

/**
 * Remove um produto
 */
export async function deleteProduct(docId) {
  try {
    const productRef = doc(db, 'products', docId);
    await deleteDoc(productRef);
    return true;
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    throw error;
  }
}

/**
 * Popula os produtos iniciais (usar apenas uma vez)
 */
export async function seedProducts() {
  const produtosIniciais = [
    { nome: 'Abacate', imagem: 'abacate.jpg' },
    { nome: 'Abacaxi', imagem: 'abacaxi.jpg' },
    { nome: 'Abóbora', imagem: 'abobora.jpg' },
    { nome: 'Abobrinha Italiana', imagem: 'abobrinhaitaliana.jpg' },
    { nome: 'Abobrinha Caipira', imagem: 'abobrinhacaipira.jpg' },
    { nome: 'Acelga', imagem: 'acelga.png' },
    { nome: 'Acerola', imagem: 'acerola.jpg' },
    { nome: 'Agrião', imagem: 'agriao.jpg' },
    { nome: 'Alface', imagem: 'alface.jpeg' },
    { nome: 'Alho', imagem: 'alho.jpg' },
    { nome: 'Alho Poró', imagem: 'alhoPoro.jpg' },
    { nome: 'Almeirão', imagem: 'almeirao.jpeg' },
    { nome: 'Banana', imagem: 'banana.jpg' },
    { nome: 'Batata', imagem: 'batata.jpg' },
    { nome: 'Batata Doce', imagem: 'batataDoce.jpg' },
    { nome: 'Beterraba', imagem: 'beterraba.jpg' },
    { nome: 'Biscoito', imagem: 'biscoito.jpg' },
    { nome: 'Rosquinha', imagem: 'rosquinha.png' },
    { nome: 'Brócolis Chinês', imagem: 'brocolisChines.jpg' },
    { nome: 'Brócolis Ramoso', imagem: 'brocolisRamoso.png' },
    { nome: 'Cara', imagem: 'cara.jpg' },
    { nome: 'Cebola', imagem: 'cebola.jpg' },
    { nome: 'Cebolinha', imagem: 'cebolinha.jpg' },
    { nome: 'Cenoura', imagem: 'cenoura.jpg' },
    { nome: 'Chicória', imagem: 'chicoria.jpg' },
    { nome: 'Chuchu', imagem: 'chuchu.jpg' },
    { nome: 'Couve', imagem: 'couve.jpg' },
    { nome: 'Couve Flor', imagem: 'couveFlor.jpg' },
    { nome: 'Espinafre', imagem: 'espinafre.jpg' },
    { nome: 'Goiaba', imagem: 'goiaba.jpg' },
    { nome: 'Inhame', imagem: 'inhame.jpg' },
    { nome: 'Inhame Cabeça', imagem: 'inhameCabeca.jpg' },
    { nome: 'Jabuticaba', imagem: 'jabuticaba.jpg' },
    { nome: 'Jilo', imagem: 'jilo.jpg' },
    { nome: 'Laranja', imagem: 'laranja.jpg' },
    { nome: 'Limão', imagem: 'limao.jpeg' },
    { nome: 'Maçã', imagem: 'maca.jpg' },
    { nome: 'Mamão', imagem: 'mamao.jpg' },
    { nome: 'Mandioca Congelada', imagem: 'mandiocaCongelada.png' },
    { nome: 'Manga', imagem: 'manga.jpg' },
    { nome: 'Maracujá', imagem: 'maracuja.jpg' },
    { nome: 'Melão', imagem: 'melao.jpg' },
    { nome: 'Laranjinha', imagem: 'laranjinha.png' },
    { nome: 'Mexerica', imagem: 'mexerica.jpg' },
    { nome: 'Milho', imagem: 'milho.jpg' },
    { nome: 'Mostarda', imagem: 'mostarda.jpg' },
    { nome: 'Pera', imagem: 'pera.jpg' },
    { nome: 'Pêssego', imagem: 'pessego.jpg' },
    { nome: 'Pimentão', imagem: 'pimentao.jpg' },
    { nome: 'Repolho', imagem: 'repolho.jpg' },
    { nome: 'Rúcula', imagem: 'rucula.jpg' },
    { nome: 'Salsinha', imagem: 'salsinha.png' },
    { nome: 'Tomate', imagem: 'tomate.jpg' },
    { nome: 'Vagem', imagem: 'vagem.png' }
  ];

  try {
    // Verifica se já existem produtos
    const existing = await getProducts();
    if (existing.length > 0) {
      console.log('Produtos já existem no Firebase. Pulando seed.');
      return false;
    }

    // Adiciona todos os produtos
    const batch = writeBatch(db);
    produtosIniciais.forEach((produto) => {
      const docRef = doc(PRODUCTS_COLLECTION);
      batch.set(docRef, produto);
    });
    await batch.commit();
    console.log('Produtos adicionados com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao popular produtos:', error);
    throw error;
  }
}
