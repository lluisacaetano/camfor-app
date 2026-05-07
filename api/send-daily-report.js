// API Route para gerar e enviar relatório diário em PDF
// Executada automaticamente às 17h (horário de Brasília)
// Agendamento configurado em: https://cron-job.org
// Envio de email via: https://resend.com

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const CryptoJS = require('crypto-js');

// Chave de criptografia
const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY;

// Campos sensíveis que estão criptografados
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

// Descriptografa um valor
function decrypt(encryptedValue) {
  if (!encryptedValue || typeof encryptedValue !== 'string') return encryptedValue;
  if (!ENCRYPTION_KEY) return encryptedValue;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedValue;
  } catch (error) {
    return encryptedValue;
  }
}

// Descriptografa os campos sensíveis de um pedido
function decryptOrderData(orderData) {
  if (!orderData || typeof orderData !== 'object') return orderData;
  if (!orderData._encrypted) return orderData;

  const decryptedData = { ...orderData };
  SENSITIVE_FIELDS.forEach(field => {
    if (decryptedData[field] && typeof decryptedData[field] === 'string') {
      decryptedData[field] = decrypt(decryptedData[field]);
    }
  });
  return decryptedData;
}

// Cores - Paleta Premium
const COLORS = {
  // Cores principais
  primary: rgb(10/255, 77/255, 92/255),        // #0a4d5c - Teal escuro
  secondary: rgb(13/255, 100/255, 120/255),    // #0d6478 - Teal médio
  accent: rgb(38/255, 198/255, 218/255),       // #26c6da - Turquesa vibrante

  // Neutros
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  darkText: rgb(33/255, 33/255, 33/255),       // #212121
  gray: rgb(97/255, 97/255, 97/255),           // #616161
  lightGray: rgb(250/255, 250/255, 250/255),   // #fafafa
  mediumGray: rgb(238/255, 238/255, 238/255),  // #eeeeee
  border: rgb(224/255, 224/255, 224/255),      // #e0e0e0

  // Badges e status
  entrega: rgb(13/255, 100/255, 120/255),      // Teal para entrega
  retirada: rgb(46/255, 125/255, 50/255),      // Verde para retirada

  // Formas de pagamento
  pix: rgb(0/255, 189/255, 174/255),           // Verde PIX
  cartao: rgb(63/255, 81/255, 181/255),        // Azul cartão
  dinheiro: rgb(76/255, 175/255, 80/255),      // Verde dinheiro

  // Destaques
  highlight: rgb(255/255, 248/255, 225/255),   // Amarelo suave
  success: rgb(232/255, 245/255, 233/255)      // Verde suave
};

// Inicializa Firebase Admin
function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// Formata valor em BRL
function formatBRL(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

// Remove acentos para compatibilidade com Windows antigo
function removeAccents(str) {
  if (!str) return str;
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, ''); // Remove caracteres não-ASCII
}

// Retorna data atual no fuso horário de Brasília
function getBrasiliaDate() {
  const now = new Date();
  // Converte para horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utcOffset = now.getTimezoneOffset(); // offset local em minutos
  const brasiliaTime = new Date(now.getTime() + (utcOffset + brasiliaOffset) * 60000);
  return brasiliaTime;
}

// Formata data completa
function formatDate(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// Formata data curta
function formatShortDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Busca logo como bytes
async function fetchLogoBytes() {
  try {
    const logoUrl = 'https://camfor.vercel.app/images/logoCamfor.png';
    const response = await fetch(logoUrl);
    if (!response.ok) throw new Error('Logo not found');
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.log('Não foi possível carregar logo:', error.message);
    return null;
  }
}

// Gera PDF com pdf-lib - Design Premium
async function generatePDF(orders, date) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 Vertical
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Carrega logo
  let logoImage = null;
  try {
    const logoBytes = await fetchLogoBytes();
    if (logoBytes) {
      logoImage = await pdfDoc.embedPng(logoBytes);
    }
  } catch (e) {
    console.log('Erro ao carregar logo');
  }

  // Calcula totais
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const retiradas = orders.filter(o => o.tipo === 'retirada').length;
  const entregas = orders.filter(o => o.tipo === 'entrega').length;

  // Agrupa por forma de pagamento
  const paymentGroups = {
    'PIX': orders.filter(o => o.pagamento === 'PIX'),
    'Cartao': orders.filter(o => o.pagamento === 'Cartão' || o.pagamento === 'Cartao'),
    'Dinheiro': orders.filter(o => o.pagamento === 'Dinheiro'),
    'Retirada': orders.filter(o => o.pagamento === 'Retirada no local' || (!o.pagamento && o.tipo === 'retirada'))
  };

  // Calcula totais por forma de pagamento
  const paymentTotals = {};
  for (const [key, group] of Object.entries(paymentGroups)) {
    paymentTotals[key] = {
      count: group.length,
      value: group.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  }

  // Configurações
  const marginLeft = 40;
  const marginRight = 40;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight;

  // ========== HEADER COM FUNDO COLORIDO ==========
  const headerHeight = 85;

  // Fundo do header (gradiente simulado com retângulos)
  page.drawRectangle({
    x: 0,
    y: pageHeight - headerHeight,
    width: pageWidth,
    height: headerHeight,
    color: COLORS.primary
  });

  // Faixa accent no topo
  page.drawRectangle({
    x: 0,
    y: pageHeight - 4,
    width: pageWidth,
    height: 4,
    color: COLORS.accent
  });

  // Logo no header (branco sobre fundo colorido)
  if (logoImage) {
    // Círculo branco atrás do logo
    page.drawRectangle({
      x: marginLeft,
      y: pageHeight - 65,
      width: 50,
      height: 50,
      color: COLORS.white,
      borderRadius: 25
    });
    page.drawImage(logoImage, { x: marginLeft + 2, y: pageHeight - 63, width: 46, height: 46 });
  }

  // Título CAMFOR
  page.drawText('CAMFOR', {
    x: marginLeft + (logoImage ? 60 : 0),
    y: pageHeight - 35,
    size: 26,
    font: fontBold,
    color: COLORS.white
  });

  // Subtítulo
  page.drawText(removeAccents('Relatorio Diario de Pedidos'), {
    x: marginLeft + (logoImage ? 60 : 0),
    y: pageHeight - 52,
    size: 11,
    font: font,
    color: rgb(255/255, 255/255, 255/255, 0.85)
  });

  // Data (canto direito, sobre fundo colorido)
  const dateText = removeAccents(formatDate(date));
  const dateWidth = font.widthOfTextAtSize(dateText, 10);
  page.drawText(dateText, {
    x: pageWidth - marginRight - dateWidth,
    y: pageHeight - 35,
    size: 10,
    font: font,
    color: COLORS.white
  });

  // Hora de geração
  const horaText = removeAccents(`Gerado as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  const horaWidth = font.widthOfTextAtSize(horaText, 8);
  page.drawText(horaText, {
    x: pageWidth - marginRight - horaWidth,
    y: pageHeight - 50,
    size: 8,
    font: font,
    color: rgb(255/255, 255/255, 255/255, 0.7)
  });

  y = pageHeight - headerHeight - 25;

  // ========== CARDS DE ESTATÍSTICAS ==========
  const cardWidth = (contentWidth - 30) / 4; // 4 cards com 10px de gap
  const cardHeight = 60;
  const cardY = y - cardHeight;

  // Função auxiliar para desenhar card de estatística
  function drawStatCard(x, label, value, bgColor, textColor) {
    // Fundo do card
    page.drawRectangle({
      x: x,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      color: bgColor
    });

    // Borda esquerda colorida
    page.drawRectangle({
      x: x,
      y: cardY,
      width: 4,
      height: cardHeight,
      color: textColor
    });

    // Label
    page.drawText(removeAccents(label.toUpperCase()), {
      x: x + 14,
      y: cardY + cardHeight - 18,
      size: 7,
      font: fontBold,
      color: COLORS.gray
    });

    // Valor
    page.drawText(value, {
      x: x + 14,
      y: cardY + 15,
      size: 22,
      font: fontBold,
      color: textColor
    });
  }

  // Card 1: Total de Pedidos
  drawStatCard(marginLeft, 'Pedidos', String(totalOrders), COLORS.lightGray, COLORS.primary);

  // Card 2: Retiradas
  drawStatCard(marginLeft + cardWidth + 10, 'Retiradas', String(retiradas), COLORS.lightGray, COLORS.retirada);

  // Card 3: Entregas
  drawStatCard(marginLeft + (cardWidth + 10) * 2, 'Entregas', String(entregas), COLORS.lightGray, COLORS.entrega);

  // Card 4: Valor Total (destaque)
  page.drawRectangle({
    x: marginLeft + (cardWidth + 10) * 3,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: COLORS.primary
  });

  page.drawText('TOTAL', {
    x: marginLeft + (cardWidth + 10) * 3 + 14,
    y: cardY + cardHeight - 18,
    size: 7,
    font: fontBold,
    color: rgb(255/255, 255/255, 255/255, 0.8)
  });

  page.drawText(formatBRL(totalValue), {
    x: marginLeft + (cardWidth + 10) * 3 + 14,
    y: cardY + 15,
    size: 16,
    font: fontBold,
    color: COLORS.white
  });

  y = cardY - 25;

  // ========== RESUMO POR FORMA DE PAGAMENTO ==========
  // Título da seção
  page.drawText(removeAccents('RESUMO POR FORMA DE PAGAMENTO'), {
    x: marginLeft,
    y: y,
    size: 9,
    font: fontBold,
    color: COLORS.primary
  });

  y -= 18;

  // Mini cards para cada forma de pagamento
  const paymentLabels = {
    'PIX': { label: 'PIX', color: COLORS.pix },
    'Cartao': { label: 'Cartao', color: COLORS.cartao },
    'Dinheiro': { label: 'Dinheiro', color: COLORS.dinheiro },
    'Retirada': { label: 'Retirada', color: COLORS.retirada }
  };

  let paymentX = marginLeft;
  for (const [key, config] of Object.entries(paymentLabels)) {
    const data = paymentTotals[key];
    if (data.count > 0) {
      // Badge colorido
      const badgeText = `${config.label}: ${data.count}x = ${formatBRL(data.value)}`;
      const badgeWidth = font.widthOfTextAtSize(removeAccents(badgeText), 8) + 16;

      page.drawRectangle({
        x: paymentX,
        y: y - 4,
        width: badgeWidth,
        height: 18,
        color: COLORS.mediumGray
      });

      // Indicador de cor
      page.drawRectangle({
        x: paymentX,
        y: y - 4,
        width: 3,
        height: 18,
        color: config.color
      });

      page.drawText(removeAccents(badgeText), {
        x: paymentX + 10,
        y: y,
        size: 8,
        font: font,
        color: COLORS.darkText
      });

      paymentX += badgeWidth + 8;
    }
  }

  y -= 30;

  // Linha divisória elegante
  page.drawRectangle({
    x: marginLeft,
    y: y,
    width: contentWidth,
    height: 2,
    color: COLORS.primary
  });

  y -= 25;

  // ========== FUNÇÃO PARA QUEBRAR TEXTO EM LINHAS ==========
  function wrapText(text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // ========== FUNÇÃO PARA DESENHAR PEDIDO (DESIGN PREMIUM) ==========
  function drawOrder(order, index) {
    const isEntrega = order.tipo === 'entrega';
    const items = order.items || [];

    // Formata itens como lista compacta (sem acentos para compatibilidade)
    const itemsFormatted = removeAccents(items.map(item => {
      const qty = item.qty || 1;
      return qty > 1 ? `${item.nome || item.name} (${qty}x)` : (item.nome || item.name);
    }).join(', '));

    // Calcula altura necessária
    const itemsLines = wrapText(itemsFormatted, contentWidth - 30, 8);
    let blockHeight = 58 + (itemsLines.length * 11);
    if (isEntrega) blockHeight += 14;

    // Verifica se precisa de nova página
    if (y - blockHeight < 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;

      // Adiciona mini header na nova página
      page.drawRectangle({
        x: 0,
        y: pageHeight - 30,
        width: pageWidth,
        height: 30,
        color: COLORS.primary
      });
      page.drawText('CAMFOR - Continuacao', {
        x: marginLeft,
        y: pageHeight - 20,
        size: 10,
        font: fontBold,
        color: COLORS.white
      });
    }

    // Card do pedido com borda esquerda colorida
    const cardColor = index % 2 === 0 ? COLORS.white : COLORS.lightGray;
    const borderColor = isEntrega ? COLORS.entrega : COLORS.retirada;

    // Fundo do card
    page.drawRectangle({
      x: marginLeft,
      y: y - blockHeight,
      width: contentWidth,
      height: blockHeight,
      color: cardColor
    });

    // Borda esquerda colorida (indicador de tipo)
    page.drawRectangle({
      x: marginLeft,
      y: y - blockHeight,
      width: 4,
      height: blockHeight,
      color: borderColor
    });

    // Linha inferior sutil
    page.drawLine({
      start: { x: marginLeft + 4, y: y - blockHeight },
      end: { x: pageWidth - marginRight, y: y - blockHeight },
      thickness: 0.5,
      color: COLORS.border
    });

    let currentY = y - 18;

    // === LINHA 1: Badge + Cliente + Valor ===
    // Badge tipo (pill style)
    const tipoText = isEntrega ? 'ENTREGA' : 'RETIRADA';
    const badgeWidth = fontBold.widthOfTextAtSize(tipoText, 6) + 12;

    page.drawRectangle({
      x: marginLeft + 14,
      y: currentY - 5,
      width: badgeWidth,
      height: 14,
      color: borderColor
    });

    page.drawText(tipoText, {
      x: marginLeft + 20,
      y: currentY - 1,
      size: 6,
      font: fontBold,
      color: COLORS.white
    });

    // Nome do cliente
    const clienteText = removeAccents(order.nome || '-');
    page.drawText(clienteText, {
      x: marginLeft + badgeWidth + 22,
      y: currentY,
      size: 12,
      font: fontBold,
      color: COLORS.darkText
    });

    // Telefone
    const clienteWidth = fontBold.widthOfTextAtSize(clienteText, 12);
    page.drawText(order.telefone || '-', {
      x: marginLeft + badgeWidth + 22 + clienteWidth + 10,
      y: currentY,
      size: 9,
      font: font,
      color: COLORS.gray
    });

    // Valor (destaque no canto direito)
    const valorText = formatBRL(order.total);
    const valorWidth = fontBold.widthOfTextAtSize(valorText, 14);

    // Fundo do valor
    page.drawRectangle({
      x: pageWidth - marginRight - valorWidth - 20,
      y: currentY - 6,
      width: valorWidth + 16,
      height: 20,
      color: COLORS.highlight
    });

    page.drawText(valorText, {
      x: pageWidth - marginRight - valorWidth - 12,
      y: currentY - 1,
      size: 14,
      font: fontBold,
      color: COLORS.primary
    });

    currentY -= 20;

    // === LINHA 2: Endereço (se entrega) ===
    if (isEntrega) {
      const enderecoParts = [
        order.rua,
        order.numero ? `n ${order.numero}` : null,
        order.complemento,
        order.bairro,
        order.cidade
      ].filter(Boolean);
      const enderecoText = removeAccents(enderecoParts.join(', '));

      // Ícone de localização (simulado com texto)
      page.drawText('>', {
        x: marginLeft + 14,
        y: currentY,
        size: 8,
        font: fontBold,
        color: COLORS.entrega
      });

      page.drawText(enderecoText, {
        x: marginLeft + 26,
        y: currentY,
        size: 8,
        font: font,
        color: COLORS.gray
      });

      currentY -= 16;
    }

    // === LINHA 3: ITENS ===
    // Label
    page.drawText(`Itens (${items.length}):`, {
      x: marginLeft + 14,
      y: currentY,
      size: 8,
      font: fontBold,
      color: COLORS.darkText
    });

    currentY -= 12;

    // Lista de itens
    itemsLines.forEach(line => {
      page.drawText(line, {
        x: marginLeft + 14,
        y: currentY,
        size: 8,
        font: font,
        color: COLORS.gray
      });
      currentY -= 11;
    });

    y -= blockHeight + 8;
  }

  // ========== DESENHA PEDIDOS AGRUPADOS POR FORMA DE PAGAMENTO ==========
  const paymentOrder = ['PIX', 'Cartao', 'Dinheiro', 'Retirada'];
  const paymentConfig = {
    'PIX': { name: 'PIX', color: COLORS.pix },
    'Cartao': { name: 'CARTAO', color: COLORS.cartao },
    'Dinheiro': { name: 'DINHEIRO', color: COLORS.dinheiro },
    'Retirada': { name: 'RETIRADA NO LOCAL', color: COLORS.retirada }
  };

  let globalIndex = 0;

  for (const paymentKey of paymentOrder) {
    const groupOrders = paymentGroups[paymentKey];
    if (groupOrders.length === 0) continue;

    const config = paymentConfig[paymentKey];

    // Verifica se precisa de nova página para o título da seção
    if (y < 100) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;

      // Mini header na nova página
      page.drawRectangle({
        x: 0,
        y: pageHeight - 30,
        width: pageWidth,
        height: 30,
        color: COLORS.primary
      });
      page.drawText('CAMFOR - Continuacao', {
        x: marginLeft,
        y: pageHeight - 20,
        size: 10,
        font: fontBold,
        color: COLORS.white
      });
    }

    // ===== HEADER DA SEÇÃO COM FUNDO COLORIDO =====
    const sectionHeaderHeight = 28;

    // Fundo do header da seção
    page.drawRectangle({
      x: marginLeft,
      y: y - sectionHeaderHeight,
      width: contentWidth,
      height: sectionHeaderHeight,
      color: config.color
    });

    // Nome da forma de pagamento
    page.drawText(removeAccents(config.name), {
      x: marginLeft + 12,
      y: y - 18,
      size: 11,
      font: fontBold,
      color: COLORS.white
    });

    // Contagem e valor (lado direito)
    const statsText = removeAccents(`${groupOrders.length} pedido${groupOrders.length > 1 ? 's' : ''} | ${formatBRL(paymentTotals[paymentKey].value)}`);
    const statsWidth = font.widthOfTextAtSize(statsText, 9);
    page.drawText(statsText, {
      x: pageWidth - marginRight - statsWidth - 12,
      y: y - 18,
      size: 9,
      font: font,
      color: COLORS.white
    });

    y -= sectionHeaderHeight + 10;

    // Desenha os pedidos desta forma de pagamento
    groupOrders.forEach((order) => {
      drawOrder(order, globalIndex);
      globalIndex++;
    });

    y -= 15;
  }

  // ========== RODAPÉ FINAL ELEGANTE ==========
  // Verifica se precisa de espaço para o rodapé
  if (y < 80) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 50;
  }

  y -= 10;

  // Linha decorativa dupla
  page.drawRectangle({
    x: marginLeft,
    y: y,
    width: contentWidth,
    height: 3,
    color: COLORS.primary
  });

  y -= 25;

  // Card de total final
  const totalCardWidth = 180;
  const totalCardHeight = 45;

  page.drawRectangle({
    x: pageWidth - marginRight - totalCardWidth,
    y: y - totalCardHeight,
    width: totalCardWidth,
    height: totalCardHeight,
    color: COLORS.primary
  });

  page.drawText('TOTAL GERAL', {
    x: pageWidth - marginRight - totalCardWidth + 15,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: rgb(255/255, 255/255, 255/255, 0.8)
  });

  page.drawText(formatBRL(totalValue), {
    x: pageWidth - marginRight - totalCardWidth + 15,
    y: y - 38,
    size: 18,
    font: fontBold,
    color: COLORS.white
  });

  // Info de geração (lado esquerdo)
  page.drawText(removeAccents(`Relatorio gerado automaticamente`), {
    x: marginLeft,
    y: y - 18,
    size: 8,
    font: font,
    color: COLORS.gray
  });

  page.drawText(removeAccents(`${new Date().toLocaleString('pt-BR')}`), {
    x: marginLeft,
    y: y - 32,
    size: 9,
    font: fontBold,
    color: COLORS.darkText
  });

  // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
  const pages = pdfDoc.getPages();
  pages.forEach((p, i) => {
    // Barra de rodapé
    p.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: 35,
      color: COLORS.lightGray
    });

    // Linha accent no topo do rodapé
    p.drawRectangle({
      x: 0,
      y: 35,
      width: pageWidth,
      height: 2,
      color: COLORS.accent
    });

    // Nome da empresa
    p.drawText('CAMFOR - Agricultura Familiar', {
      x: marginLeft,
      y: 14,
      size: 8,
      font: fontBold,
      color: COLORS.primary
    });

    // Paginação
    const pageText = `Pagina ${i + 1} de ${pages.length}`;
    const pageTextWidth = font.widthOfTextAtSize(pageText, 8);
    p.drawText(pageText, {
      x: pageWidth - marginRight - pageTextWidth,
      y: 14,
      size: 8,
      font: font,
      color: COLORS.gray
    });
  });

  return pdfDoc;
}

// Handler principal
module.exports = async function handler(req, res) {
  // Verifica autorização
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}` && req.query.secret !== cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Não autorizado' });
    }
  }

  try {
    // Inicializa Firebase
    getFirebaseApp();
    const db = getFirestore();

    // Busca todos os pedidos (campo timestamp é string ISO)
    // Usa horário de Brasília para definir "hoje"
    const today = getBrasiliaDate();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.get();

    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();

      // Filtra por data (timestamp é string ISO em UTC)
      if (data.timestamp) {
        const orderDateUTC = new Date(data.timestamp);
        // Converte para horário de Brasília para comparar
        const brasiliaOffset = -3 * 60;
        const orderDateBrasilia = new Date(orderDateUTC.getTime() + (orderDateUTC.getTimezoneOffset() + brasiliaOffset) * 60000);

        if (orderDateBrasilia >= today && orderDateBrasilia < tomorrow) {
          // Descriptografa os dados do pedido antes de adicionar
          const decryptedData = decryptOrderData(data);
          orders.push({
            id: doc.id,
            ...decryptedData
          });
        }
      }
    });

    // Se não há pedidos, não envia email
    if (orders.length === 0) {
      console.log('Nenhum pedido hoje. Email não enviado.');
      return res.status(200).json({
        success: true,
        message: 'Nenhum pedido hoje - email não enviado',
        ordersCount: 0
      });
    }

    // Gera PDF
    const pdfDoc = await generatePDF(orders, today);
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const fileName = `relatorio-camfor-${formatShortDate(today).replace(/\//g, '-')}.pdf`;

    // Envia email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TO_EMAIL = process.env.REPORT_EMAIL || 'financeiro@camffor.com.br';

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY não configurada.');
      return res.status(200).json({
        success: true,
        message: 'PDF gerado (email não configurado)',
        ordersCount: orders.length
      });
    }

    // Calcula valores para o email
    const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const retiradas = orders.filter(o => o.tipo === 'retirada').length;
    const entregas = orders.filter(o => o.tipo === 'entrega').length;

    // Email profissional
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0a4d5c 0%, #0d6478 100%); padding: 35px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">CAMFOR</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Agricultura Familiar</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <h2 style="color: #0a4d5c; margin: 0; font-size: 22px; font-weight: 600;">Relatório Diário de Pedidos</h2>
              <p style="color: #666666; margin: 8px 0 0; font-size: 14px;">${formatDate(today)}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <p style="color: #333333; margin: 0; font-size: 15px; line-height: 1.6;">
                Olá,<br><br>
                Segue em anexo o relatório completo dos pedidos do dia. Confira abaixo um resumo das informações:
              </p>
            </td>
          </tr>

          <!-- Stats Cards -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Total Pedidos -->
                  <td width="25%" style="padding-right: 10px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                      <tr>
                        <td style="padding: 20px 10px;">
                          <p style="color: #666666; margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Pedidos</p>
                          <p style="color: #0a4d5c; margin: 0; font-size: 28px; font-weight: 700;">${orders.length}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Retiradas -->
                  <td width="25%" style="padding: 0 5px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                      <tr>
                        <td style="padding: 20px 10px;">
                          <p style="color: #666666; margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Retiradas</p>
                          <p style="color: #0a4d5c; margin: 0; font-size: 28px; font-weight: 700;">${retiradas}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Entregas -->
                  <td width="25%" style="padding: 0 5px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                      <tr>
                        <td style="padding: 20px 10px;">
                          <p style="color: #666666; margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Entregas</p>
                          <p style="color: #0a4d5c; margin: 0; font-size: 28px; font-weight: 700;">${entregas}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Valor Total -->
                  <td width="25%" style="padding-left: 10px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a4d5c; border-radius: 8px; text-align: center;">
                      <tr>
                        <td style="padding: 20px 10px;">
                          <p style="color: rgba(255,255,255,0.85); margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Total</p>
                          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">${formatBRL(totalValue)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attachment Notice -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f5f7; border-radius: 8px; border-left: 4px solid #0a4d5c;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="color: #0a4d5c; margin: 0; font-size: 14px;">
                      <strong>📎 Anexo:</strong> ${fileName}
                    </p>
                    <p style="color: #666666; margin: 8px 0 0; font-size: 13px;">
                      O relatório detalhado com todos os pedidos e itens está anexado a este email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; margin: 0; font-size: 12px;">
                Este é um email automático enviado pelo sistema CAMFOR.<br>
                Gerado em ${new Date().toLocaleString('pt-BR')}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CAMFOR <sistema@loja.camffor.com.br>',
        to: [TO_EMAIL],
        subject: `📊 Relatório CAMFOR - ${formatShortDate(today)}`,
        html: emailBody,
        attachments: [
          {
            filename: fileName,
            content: pdfBase64
          }
        ]
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || 'Erro ao enviar email');
    }

    return res.status(200).json({
      success: true,
      message: 'Relatório PDF enviado com sucesso',
      ordersCount: orders.length,
      totalValue: totalValue,
      emailId: emailResult.id
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
