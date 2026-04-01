// Utilitário para controle de horário de funcionamento da loja

// Horário de funcionamento
export const OPENING_HOUR = 7;  // 7h
export const CLOSING_HOUR = 17; // 17h

/**
 * Retorna a data/hora atual no fuso horário de Brasília
 */
export function getBrasiliaDateTime() {
  const now = new Date();
  // Converte para horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utcOffset = now.getTimezoneOffset(); // offset local em minutos
  const brasiliaTime = new Date(now.getTime() + (utcOffset + brasiliaOffset) * 60000);
  return brasiliaTime;
}

/**
 * Retorna apenas a data (sem hora) em formato YYYY-MM-DD no fuso de Brasília
 */
export function getBrasiliaDateString() {
  const brasiliaTime = getBrasiliaDateTime();
  const year = brasiliaTime.getFullYear();
  const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasiliaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se estamos dentro do horário comercial (7h-17h)
 */
export function isWithinBusinessHours() {
  const brasiliaTime = getBrasiliaDateTime();
  const hour = brasiliaTime.getHours();
  return hour >= OPENING_HOUR && hour < CLOSING_HOUR;
}

/**
 * Verifica se a configuração foi atualizada hoje (mesmo dia em Brasília)
 * @param {string} updatedAt - ISO string da data de atualização
 */
export function wasConfigUpdatedToday(updatedAt) {
  if (!updatedAt) return false;

  try {
    // Converte a data de atualização para Brasília
    const updateDate = new Date(updatedAt);
    const brasiliaOffset = -3 * 60;
    const utcOffset = updateDate.getTimezoneOffset();
    const updateBrasilia = new Date(updateDate.getTime() + (utcOffset + brasiliaOffset) * 60000);

    // Compara apenas a data (YYYY-MM-DD)
    const updateYear = updateBrasilia.getFullYear();
    const updateMonth = String(updateBrasilia.getMonth() + 1).padStart(2, '0');
    const updateDay = String(updateBrasilia.getDate()).padStart(2, '0');
    const updateDateString = `${updateYear}-${updateMonth}-${updateDay}`;

    return updateDateString === getBrasiliaDateString();
  } catch (e) {
    console.warn('Erro ao verificar data de atualização:', e);
    return false;
  }
}

/**
 * Verifica se a loja está aberta
 * A loja está aberta se:
 * 1. Estamos dentro do horário comercial (7h-17h)
 * 2. O admin configurou os produtos HOJE (no mesmo dia)
 * 3. Há produtos selecionados
 *
 * @param {Object} config - Configuração do admin { selectedItems, updatedAt }
 */
export function isStoreOpen(config) {
  // Sem configuração = fechada
  if (!config) return false;

  // Sem produtos selecionados = fechada
  if (!config.selectedItems || config.selectedItems.length === 0) return false;

  // Fora do horário comercial = fechada
  if (!isWithinBusinessHours()) return false;

  // Configuração não foi feita hoje = fechada
  if (!wasConfigUpdatedToday(config.updatedAt)) return false;

  return true;
}

/**
 * Retorna o motivo da loja estar fechada (para exibir ao usuário)
 * @param {Object} config - Configuração do admin
 */
export function getClosedReason(config) {
  if (!config || !config.selectedItems || config.selectedItems.length === 0) {
    return 'Aguardando seleção dos produtos do dia';
  }

  if (!wasConfigUpdatedToday(config.updatedAt)) {
    return 'Aguardando seleção dos produtos do dia';
  }

  if (!isWithinBusinessHours()) {
    const brasiliaTime = getBrasiliaDateTime();
    const hour = brasiliaTime.getHours();

    if (hour < OPENING_HOUR) {
      return `Abre às ${OPENING_HOUR}h`;
    } else {
      return 'Fechado - Volte amanhã a partir das 7h';
    }
  }

  return '';
}

/**
 * Formata o horário de funcionamento para exibição
 */
export function getBusinessHoursText() {
  return '07:00 às 17:00';
}
