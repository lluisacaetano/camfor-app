import { setDoc } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import { db } from '../firebase';

// Referência do documento de configuração do admin
const CONFIG_DOC = doc(db, 'config', 'admin');

/**
 * Fecha a loja (desabilita vendas e limpa produtos selecionados)
 */
export async function fecharLoja() {
  try {
    await setDoc(CONFIG_DOC, {
      lojaFechada: true,
      selectedItems: [],
      prices: { 10: 0, 15: 0, 18: 0 },
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao fechar loja:', error);
    throw error;
  }
}

/**
 * Abre a loja (habilita vendas)
 */
export async function abrirLoja() {
  try {
    await setDoc(CONFIG_DOC, {
      lojaFechada: false,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao abrir loja:', error);
    throw error;
  }
}
