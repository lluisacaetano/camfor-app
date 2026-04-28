import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

/**
 * Faz login do administrador com email e senha
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function loginAdmin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Erro no login:', error.code);

    // Traduz os erros do Firebase para português
    const errorMessages = {
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuário desativado',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-credential': 'Email ou senha incorretos',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
    };

    throw new Error(errorMessages[error.code] || 'Erro ao fazer login');
  }
}

/**
 * Faz logout do administrador
 */
export async function logoutAdmin() {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Erro no logout:', error);
    throw new Error('Erro ao fazer logout');
  }
}

/**
 * Verifica se há um usuário autenticado
 * @returns {User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Escuta mudanças no estado de autenticação
 * @param {Function} callback
 * @returns {Function} Função para cancelar a inscrição
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean}
 */
export function isAuthenticated() {
  return auth.currentUser !== null;
}
