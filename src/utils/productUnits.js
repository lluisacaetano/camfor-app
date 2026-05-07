/**
 * Utilitário para categorizar produtos por tipo de medida
 *
 * Produtos vendidos por UNIDADE/MAÇO: folhosos, temperos, milho, etc.
 * Produtos vendidos por PESO (200g-500g): frutas, legumes, tubérculos, etc.
 */

// Lista de produtos vendidos por unidade ou maço
const PRODUTOS_POR_UNIDADE = [
  // Folhosos e verduras (maço/unidade)
  'alface', 'rucula', 'agriao', 'espinafre', 'couve', 'acelga', 'chicoria',
  'almeirão', 'almeirao', 'mostarda', 'repolho',

  // Temperos (maço)
  'cebolinha', 'salsa', 'salsinha', 'coentro', 'manjericao', 'manjericão',
  'hortela', 'hortelã', 'tomilho', 'alecrim', 'oregano', 'orégano',
  'cheiro verde', 'cheiroverde',

  // Outros por unidade
  'milho', 'brocolis', 'brócolis', 'couve-flor', 'couveflor', 'couve flor',
  'pepino', 'abobrinha', 'berinjela', 'pimentao', 'pimentão',
  'chuchu', 'quiabo', 'maxixe', 'jiló', 'jilo'
];

/**
 * Verifica se um produto é vendido por unidade
 * @param {string} nomeProduto - Nome do produto
 * @returns {boolean}
 */
export function isPorUnidade(nomeProduto) {
  if (!nomeProduto) return false;

  const nomeNormalizado = nomeProduto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '')     // Remove caracteres especiais
    .trim();

  return PRODUTOS_POR_UNIDADE.some(produto => {
    const produtoNormalizado = produto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return nomeNormalizado.includes(produtoNormalizado) ||
           produtoNormalizado.includes(nomeNormalizado);
  });
}

/**
 * Retorna o texto da unidade de medida
 * @param {string} nomeProduto - Nome do produto
 * @returns {string} "un" para unidade ou "g" para gramas
 */
export function getUnidadeMedida(nomeProduto) {
  return isPorUnidade(nomeProduto) ? 'un' : 'g';
}

/**
 * Retorna o texto descritivo da unidade
 * @param {string} nomeProduto - Nome do produto
 * @returns {string}
 */
export function getDescricaoUnidade(nomeProduto) {
  return isPorUnidade(nomeProduto) ? '1 maço/unidade' : '200g a 500g';
}
