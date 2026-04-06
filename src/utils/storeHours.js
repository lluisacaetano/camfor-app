// Utilitário para controle de horário de funcionamento da loja

// Horários de funcionamento
export const OPENING_HOUR = 7;  // 7h (todos os dias úteis)
export const CLOSING_HOUR = 17; // 17h (segunda a quinta para pedidos)
export const FRIDAY_CLOSING_HOUR = 16; // 16h (sexta-feira para pedidos)

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
 * Verifica se é fim de semana (sábado ou domingo)
 */
export function isWeekend() {
  const brasiliaTime = getBrasiliaDateTime();
  const day = brasiliaTime.getDay(); // 0 = domingo, 6 = sábado
  return day === 0 || day === 6;
}

/**
 * Verifica se é sexta-feira
 */
export function isFriday() {
  const brasiliaTime = getBrasiliaDateTime();
  return brasiliaTime.getDay() === 5;
}

/**
 * Retorna o horário de fechamento baseado no dia da semana
 */
export function getClosingHourForToday() {
  if (isFriday()) {
    return FRIDAY_CLOSING_HOUR;
  }
  return CLOSING_HOUR;
}

/**
 * Verifica se estamos dentro do horário comercial
 * Segunda a Quinta: 7h-17h
 * Sexta: 7h-16h
 * Sábado e Domingo: Fechado
 */
export function isWithinBusinessHours() {
  // Fim de semana sempre fechado
  if (isWeekend()) {
    return false;
  }

  const brasiliaTime = getBrasiliaDateTime();
  const hour = brasiliaTime.getHours();
  const closingHour = getClosingHourForToday();

  return hour >= OPENING_HOUR && hour < closingHour;
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
 * Verifica se a configuração é válida para hoje
 * Aceita configurações de HOJE ou de ONTEM se foram feitas após 17h
 * (admin pode configurar para o dia seguinte)
 * @param {string} updatedAt - ISO string da data de atualização
 */
export function isConfigValidForToday(updatedAt) {
  if (!updatedAt) return false;

  try {
    const updateDate = new Date(updatedAt);
    const brasiliaOffset = -3 * 60;
    const utcOffset = updateDate.getTimezoneOffset();
    const updateBrasilia = new Date(updateDate.getTime() + (utcOffset + brasiliaOffset) * 60000);

    const today = getBrasiliaDateTime();
    const todayDateString = getBrasiliaDateString();

    // Data de atualização
    const updateYear = updateBrasilia.getFullYear();
    const updateMonth = String(updateBrasilia.getMonth() + 1).padStart(2, '0');
    const updateDay = String(updateBrasilia.getDate()).padStart(2, '0');
    const updateDateString = `${updateYear}-${updateMonth}-${updateDay}`;

    // Se foi atualizado hoje, é válido
    if (updateDateString === todayDateString) {
      return true;
    }

    // Se foi atualizado ontem após 17h, é válido para hoje
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayDateString = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

    if (updateDateString === yesterdayDateString) {
      const updateHour = updateBrasilia.getHours();
      // Se foi após 17h de ontem, vale para hoje
      return updateHour >= CLOSING_HOUR;
    }

    return false;
  } catch (e) {
    console.warn('Erro ao verificar validade da configuração:', e);
    return false;
  }
}

/**
 * Verifica se a loja está aberta
 * A loja está aberta se:
 * 1. Estamos dentro do horário comercial (7h-17h)
 * 2. O admin configurou os produtos (hoje OU ontem após 17h)
 * 3. Há produtos selecionados
 * 4. Não está fechada manualmente
 *
 * @param {Object} config - Configuração do admin { selectedItems, updatedAt, lojaFechada }
 */
export function isStoreOpen(config) {
  // Loja fechada manualmente
  if (config && config.lojaFechada) return false;

  // Sem configuração = fechada
  if (!config) return false;

  // Sem produtos selecionados = fechada
  if (!config.selectedItems || config.selectedItems.length === 0) return false;

  // Fora do horário comercial = fechada
  if (!isWithinBusinessHours()) return false;

  // Configuração não é válida para hoje = fechada
  if (!isConfigValidForToday(config.updatedAt)) return false;

  return true;
}

/**
 * Retorna o motivo da loja estar fechada (para exibir ao usuário)
 * @param {Object} config - Configuração do admin
 */
export function getClosedReason(config) {
  if (config && config.lojaFechada) {
    return 'Loja fechada';
  }
  if (!config || !config.selectedItems || config.selectedItems.length === 0) {
    return 'Aguardando seleção dos produtos do dia';
  }
  if (!wasConfigUpdatedToday(config.updatedAt)) {
    return 'Aguardando atualização da configuração do dia';
  }
  if (!isWithinBusinessHours()) {
    if (isWeekend()) {
      return 'Fechado nos finais de semana - Volte na segunda-feira às 7h';
    }
    const brasiliaTime = getBrasiliaDateTime();
    const hour = brasiliaTime.getHours();
    if (hour < OPENING_HOUR) {
      return `Abre às ${OPENING_HOUR}h`;
    } else {
      if (isFriday()) {
        return 'Fechado - Volte na segunda-feira às 7h';
      }
      return 'Fechado - Volte amanhã às 7h';
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

/**
 * Retorna informações completas de horário de funcionamento
 */
export function getFullBusinessHoursInfo() {
  return {
    pedidos: {
      segundaQuinta: '07:00 às 17:00',
      sexta: '07:00 às 16:00',
      fimSemana: 'Fechado'
    },
    estabelecimento: {
      segundaQuinta: '07:00 às 17:30',
      sexta: '07:00 às 16:30',
      fimSemana: 'Fechado'
    }
  };
}
