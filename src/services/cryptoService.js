import CryptoJS from 'crypto-js';

// Chave de criptografia (vem da variável de ambiente)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

// Verifica se a chave existe (apenas em produção)
if (!ENCRYPTION_KEY && import.meta.env.PROD) {
  console.error('ERRO: VITE_ENCRYPTION_KEY não está configurada!');
}

// Campos sensíveis que devem ser criptografados
const SENSITIVE_FIELDS = [
  'nome',
  'telefone',
  'cep',
  'rua',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'uf'
];

/**
 * Criptografa um valor string
 * @param {string} value - Valor a ser criptografado
 * @returns {string} Valor criptografado
 */
export function encrypt(value) {
  if (!value || typeof value !== 'string') return value;
  if (!ENCRYPTION_KEY) return value; // Sem chave, não criptografa (dev mode)
  try {
    return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    return value;
  }
}

/**
 * Descriptografa um valor string
 * @param {string} encryptedValue - Valor criptografado
 * @returns {string} Valor original
 */
export function decrypt(encryptedValue) {
  if (!encryptedValue || typeof encryptedValue !== 'string') return encryptedValue;
  if (!ENCRYPTION_KEY) return encryptedValue; // Sem chave, retorna como está
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    // Se não conseguir descriptografar, retorna o valor original (pode ser dado antigo não criptografado)
    return decrypted || encryptedValue;
  } catch (error) {
    // Se falhar, provavelmente é um dado antigo não criptografado
    return encryptedValue;
  }
}

/**
 * Criptografa os campos sensíveis de um objeto de pedido
 * @param {Object} orderData - Dados do pedido
 * @returns {Object} Pedido com campos sensíveis criptografados
 */
export function encryptOrderData(orderData) {
  if (!orderData || typeof orderData !== 'object') return orderData;

  const encryptedData = { ...orderData };

  SENSITIVE_FIELDS.forEach(field => {
    if (encryptedData[field] && typeof encryptedData[field] === 'string') {
      encryptedData[field] = encrypt(encryptedData[field]);
    }
  });

  // Marca o pedido como criptografado
  encryptedData._encrypted = true;

  return encryptedData;
}

/**
 * Descriptografa os campos sensíveis de um objeto de pedido
 * @param {Object} orderData - Dados do pedido criptografado
 * @returns {Object} Pedido com campos descriptografados
 */
export function decryptOrderData(orderData) {
  if (!orderData || typeof orderData !== 'object') return orderData;

  // Se não estiver marcado como criptografado, retorna sem modificar
  if (!orderData._encrypted) return orderData;

  const decryptedData = { ...orderData };

  SENSITIVE_FIELDS.forEach(field => {
    if (decryptedData[field] && typeof decryptedData[field] === 'string') {
      decryptedData[field] = decrypt(decryptedData[field]);
    }
  });

  return decryptedData;
}

/**
 * Descriptografa uma lista de pedidos
 * @param {Array} orders - Lista de pedidos
 * @returns {Array} Lista de pedidos descriptografados
 */
export function decryptOrdersList(orders) {
  if (!Array.isArray(orders)) return orders;
  return orders.map(order => decryptOrderData(order));
}
