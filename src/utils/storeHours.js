// Utilitário para controle de horário de funcionamento da loja

// Horários de funcionamento
export const OPENING_HOUR = 7;  // 7h - horário oficial exibido ao cliente
export const OPENING_HOUR_REAL = 6;  // 6h30 - horário real de abertura (se config pronta)
export const OPENING_MINUTE_REAL = 30; // 30 minutos
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
export function getBrasiliaDateString(date = null) {
  const brasiliaTime = date || getBrasiliaDateTime();
  const year = brasiliaTime.getFullYear();
  const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasiliaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se é fim de semana (sábado ou domingo)
 */
export function isWeekend(date = null) {
  const brasiliaTime = date || getBrasiliaDateTime();
  const day = brasiliaTime.getDay(); // 0 = domingo, 6 = sábado
  return day === 0 || day === 6;
}

/**
 * Verifica se é sexta-feira
 */
export function isFriday(date = null) {
  const brasiliaTime = date || getBrasiliaDateTime();
  return brasiliaTime.getDay() === 5;
}

/**
 * Verifica se é sábado
 */
export function isSaturday(date = null) {
  const brasiliaTime = date || getBrasiliaDateTime();
  return brasiliaTime.getDay() === 6;
}

/**
 * Verifica se é domingo
 */
export function isSunday(date = null) {
  const brasiliaTime = date || getBrasiliaDateTime();
  return brasiliaTime.getDay() === 0;
}

/**
 * Verifica se é segunda-feira
 */
export function isMonday(date = null) {
  const brasiliaTime = date || getBrasiliaDateTime();
  return brasiliaTime.getDay() === 1;
}

/**
 * Retorna o horário de fechamento baseado no dia da semana
 */
export function getClosingHourForDay(date = null) {
  if (isFriday(date)) {
    return FRIDAY_CLOSING_HOUR;
  }
  return CLOSING_HOUR;
}

/**
 * Retorna o horário de fechamento para hoje
 */
export function getClosingHourForToday() {
  return getClosingHourForDay();
}

/**
 * Verifica se estamos dentro do horário comercial
 * Segunda a Quinta: 6h30-17h (aceita pedidos a partir de 6h30)
 * Sexta: 6h30-16h
 * Sábado e Domingo: Fechado
 * Nota: O horário oficial exibido é 7h, mas pedidos são aceitos a partir de 6h30
 */
export function isWithinBusinessHours() {
  // Fim de semana sempre fechado
  if (isWeekend()) {
    return false;
  }

  const brasiliaTime = getBrasiliaDateTime();
  const hour = brasiliaTime.getHours();
  const minute = brasiliaTime.getMinutes();
  const closingHour = getClosingHourForToday();

  // Verifica se passou das 6h30 (horário real de abertura)
  const isAfterOpening = hour > OPENING_HOUR_REAL || (hour === OPENING_HOUR_REAL && minute >= OPENING_MINUTE_REAL);

  return isAfterOpening && hour < closingHour;
}

/**
 * Retorna o próximo dia útil (segunda a sexta)
 */
export function getNextBusinessDay(fromDate = null) {
  const date = fromDate ? new Date(fromDate) : getBrasiliaDateTime();
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // Se cair no sábado, pula para segunda
  if (nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 2);
  }
  // Se cair no domingo, pula para segunda
  else if (nextDay.getDay() === 0) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * Converte uma data para o fuso horário de Brasília
 */
function toBrasiliaTime(date) {
  const brasiliaOffset = -3 * 60;
  const utcOffset = date.getTimezoneOffset();
  return new Date(date.getTime() + (utcOffset + brasiliaOffset) * 60000);
}

/**
 * Verifica se a configuração foi feita durante o horário comercial do mesmo dia
 * (ou seja, são itens do dia que devem ser limpos após o fechamento)
 */
export function wasConfigMadeDuringBusinessHours(updatedAt) {
  if (!updatedAt) return false;

  try {
    const updateDate = new Date(updatedAt);
    const updateBrasilia = toBrasiliaTime(updateDate);
    const today = getBrasiliaDateTime();

    const updateDateString = getBrasiliaDateString(updateBrasilia);
    const todayDateString = getBrasiliaDateString(today);

    // Se não foi hoje, não é do horário comercial de hoje
    if (updateDateString !== todayDateString) return false;

    // Verifica se foi durante o horário comercial (a partir de 6h30)
    const updateHour = updateBrasilia.getHours();
    const updateMinute = updateBrasilia.getMinutes();
    const closingHour = getClosingHourForDay(updateBrasilia);

    const isAfterOpening = updateHour > OPENING_HOUR_REAL || (updateHour === OPENING_HOUR_REAL && updateMinute >= OPENING_MINUTE_REAL);

    return isAfterOpening && updateHour < closingHour;
  } catch (e) {
    return false;
  }
}

/**
 * Verifica se a configuração foi feita após o fechamento da loja
 * (itens configurados para o próximo dia útil)
 */
export function wasConfigMadeAfterClosing(updatedAt) {
  if (!updatedAt) return false;

  try {
    const updateDate = new Date(updatedAt);
    const updateBrasilia = toBrasiliaTime(updateDate);
    const updateHour = updateBrasilia.getHours();
    const closingHour = getClosingHourForDay(updateBrasilia);

    // Se é fim de semana, sempre considera como "após fechamento"
    if (isWeekend(updateBrasilia)) {
      return true;
    }

    // Se foi após o horário de fechamento
    return updateHour >= closingHour;
  } catch (e) {
    return false;
  }
}

/**
 * Verifica se a configuração é válida para hoje
 *
 * Cenários válidos:
 * 1. Config feita HOJE após o horário de abertura (durante ou após horário comercial)
 * 2. Config feita ONTEM após o fechamento (17h seg-qui ou 16h sexta)
 * 3. Config feita na SEXTA após 16h, SÁBADO ou DOMINGO → válida para SEGUNDA
 */
export function isConfigValidForToday(updatedAt) {
  if (!updatedAt) return false;

  try {
    const updateDate = new Date(updatedAt);
    const updateBrasilia = toBrasiliaTime(updateDate);
    const today = getBrasiliaDateTime();

    const updateDateString = getBrasiliaDateString(updateBrasilia);
    const todayDateString = getBrasiliaDateString(today);

    // CASO 1: Config feita hoje
    if (updateDateString === todayDateString) {
      return true;
    }

    // CASO 2 & 3: Config feita em dia anterior
    // Só é válida se foi feita APÓS o fechamento
    if (!wasConfigMadeAfterClosing(updatedAt)) {
      return false;
    }

    // Se hoje é segunda-feira, aceita configs de sexta (após 16h), sábado ou domingo
    if (isMonday()) {
      const friday = new Date(today);
      friday.setDate(friday.getDate() - 3);
      const saturday = new Date(today);
      saturday.setDate(saturday.getDate() - 2);
      const sunday = new Date(today);
      sunday.setDate(sunday.getDate() - 1);

      const fridayString = getBrasiliaDateString(friday);
      const saturdayString = getBrasiliaDateString(saturday);
      const sundayString = getBrasiliaDateString(sunday);

      if (updateDateString === fridayString ||
          updateDateString === saturdayString ||
          updateDateString === sundayString) {
        return true;
      }
    }

    // Se não é segunda, só aceita config de ontem (após fechamento)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = getBrasiliaDateString(yesterday);

    if (updateDateString === yesterdayString) {
      return true;
    }

    return false;
  } catch (e) {
    console.warn('Erro ao verificar validade da configuração:', e);
    return false;
  }
}

/**
 * Verifica se os itens devem ser limpos (config antiga do horário comercial)
 * Retorna true se a config foi feita durante o horário comercial de um dia anterior
 */
export function shouldClearItems(config) {
  if (!config || !config.updatedAt) return false;
  if (!config.selectedItems || config.selectedItems.length === 0) return false;

  try {
    const updateDate = new Date(config.updatedAt);
    const updateBrasilia = toBrasiliaTime(updateDate);
    const today = getBrasiliaDateTime();

    const updateDateString = getBrasiliaDateString(updateBrasilia);
    const todayDateString = getBrasiliaDateString(today);

    // Se foi hoje, não limpa
    if (updateDateString === todayDateString) {
      return false;
    }

    // Se foi em dia anterior E foi durante o horário comercial (não após fechamento)
    // significa que são itens antigos que devem ser limpos
    return !wasConfigMadeAfterClosing(config.updatedAt);
  } catch (e) {
    return false;
  }
}

/**
 * Verifica se a loja está aberta
 * A loja está aberta se:
 * 1. Estamos dentro do horário comercial (6h30-17h seg-qui, 6h30-16h sex)
 *    Nota: O horário exibido ao cliente é 7h, mas pedidos são aceitos a partir de 6h30
 * 2. O admin configurou os produtos (hoje OU após fechamento do dia anterior)
 * 3. Há produtos selecionados
 * 4. Não está fechada manualmente
 *
 * @param {Object} config - Configuração do admin { selectedItems, updatedAt, lojaFechada }
 */
export function isStoreOpen(config) {
  // Sem configuração = fechada
  if (!config) return false;

  // Loja fechada manualmente
  if (config.lojaFechada) return false;

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
  if (!isConfigValidForToday(config?.updatedAt)) {
    return 'Aguardando atualização da configuração do dia';
  }
  if (!isWithinBusinessHours()) {
    if (isWeekend()) {
      return 'Fechado nos finais de semana - Volte na segunda-feira às 7h';
    }
    const brasiliaTime = getBrasiliaDateTime();
    const hour = brasiliaTime.getHours();
    const minute = brasiliaTime.getMinutes();
    // Verifica se é antes das 6h30
    const isBeforeOpening = hour < OPENING_HOUR_REAL || (hour === OPENING_HOUR_REAL && minute < OPENING_MINUTE_REAL);
    if (isBeforeOpening) {
      return `Abre às ${OPENING_HOUR}h`; // Exibe 7h (horário oficial)
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
