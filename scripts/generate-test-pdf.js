// Script para gerar PDF de teste localmente
// Execute com: node scripts/generate-test-pdf.js

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Cores
const COLORS = {
  primary: rgb(10/255, 77/255, 92/255),
  secondary: rgb(13/255, 100/255, 120/255),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  gray: rgb(100/255, 100/255, 100/255),
  lightGray: rgb(245/255, 245/255, 245/255),
  border: rgb(200/255, 200/255, 200/255)
};

// Formata valor em BRL
function formatBRL(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

// Formata data
function formatDate(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// Dados de exemplo (simulando cestas montadas)
const mockOrders = [
  {
    id: '1',
    nome: 'Pablo',
    telefone: '(37) 99985-4512',
    tipo: 'entrega',
    total: 20.00,
    rua: 'Rua Alberto Soraggi',
    numero: '4',
    bairro: 'São Luiz',
    cidade: 'Formiga',
    complemento: 'Casa',
    items: [
      { nome: 'Repolho' },
      { nome: 'Rosquinha' },
      { nome: 'Mandioca Congelada' },
      { nome: 'Mexerica' },
      { nome: 'Manga' },
      { nome: 'Chuchu', qty: 3 },
      { nome: 'Maracujá', qty: 2 }
    ]
  },
  {
    id: '2',
    nome: 'Luisa',
    telefone: '(37) 99902-0017',
    tipo: 'entrega',
    total: 20.00,
    rua: 'Rua Valênça',
    numero: '90',
    bairro: 'Jardim América',
    cidade: 'Formiga',
    items: [
      { nome: 'Repolho' },
      { nome: 'Rosquinha' },
      { nome: 'Limão' },
      { nome: 'Mamão' },
      { nome: 'Manga' },
      { nome: 'Inhame Cabeça' },
      { nome: 'Couve Flor' },
      { nome: 'Espinafre', qty: 3 },
      { nome: 'Milho', qty: 3 },
      { nome: 'Vagem', qty: 2 },
      { nome: 'Alface', qty: 3 }
    ]
  },
  {
    id: '3',
    nome: 'Luisa',
    telefone: '(37) 99902-0017',
    tipo: 'retirada',
    total: 30.00,
    items: [
      { nome: 'Cesta 10 itens', price: 10.00 },
      { nome: 'Cesta 15 itens', price: 20.00 }
    ]
  }
];

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
    const logoPath = path.join(__dirname, '../public/images/logoCamfor.png');
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (e) {
    console.log('Logo não encontrada');
  }

  // Calcula totais
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const retiradas = orders.filter(o => o.tipo === 'retirada').length;
  const entregas = orders.filter(o => o.tipo === 'entrega').length;

  // Configurações
  const marginLeft = 35;
  const marginRight = 35;
  const marginTop = 40;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  // ========== CABEÇALHO ==========
  if (logoImage) {
    page.drawImage(logoImage, { x: marginLeft, y: y - 40, width: 45, height: 45 });
  }

  page.drawText('CAMFOR', {
    x: marginLeft + (logoImage ? 55 : 0),
    y: y - 12,
    size: 22,
    font: fontBold,
    color: COLORS.primary
  });

  page.drawText('Relatório Diário de Pedidos', {
    x: marginLeft + (logoImage ? 55 : 0),
    y: y - 28,
    size: 10,
    font: font,
    color: COLORS.gray
  });

  // Data (canto direito)
  const dateText = formatDate(date);
  const dateWidth = font.widthOfTextAtSize(dateText, 9);
  page.drawText(dateText, {
    x: pageWidth - marginRight - dateWidth,
    y: y - 12,
    size: 9,
    font: font,
    color: COLORS.black
  });

  y -= 55;

  // Resumo
  page.drawRectangle({
    x: marginLeft,
    y: y - 30,
    width: contentWidth,
    height: 30,
    color: COLORS.lightGray
  });

  const resumoText = `${totalOrders} pedidos  •  ${retiradas} retiradas  •  ${entregas} entregas  •  Total: ${formatBRL(totalValue)}`;
  page.drawText(resumoText, {
    x: marginLeft + 15,
    y: y - 20,
    size: 10,
    font: fontBold,
    color: COLORS.primary
  });

  y -= 45;

  // Linha divisória
  page.drawLine({
    start: { x: marginLeft, y: y },
    end: { x: pageWidth - marginRight, y: y },
    thickness: 1.5,
    color: COLORS.primary
  });

  y -= 20;

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

  // ========== FUNÇÃO PARA DESENHAR PEDIDO ==========
  function drawOrder(order, index) {
    const isEntrega = order.tipo === 'entrega';
    const items = order.items || [];

    // Formata itens como lista compacta
    const itemsFormatted = items.map(item => {
      const qty = item.qty || 1;
      return qty > 1 ? `${item.nome || item.name} (${qty}x)` : (item.nome || item.name);
    }).join(', ');

    // Calcula altura necessária
    const itemsLines = wrapText(itemsFormatted, contentWidth - 20, 8);
    let blockHeight = 50 + (itemsLines.length * 10);
    if (isEntrega) blockHeight += 12;

    // Verifica se precisa de nova página
    if (y - blockHeight < 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginTop;
    }

    // Fundo alternado
    if (index % 2 === 0) {
      page.drawRectangle({
        x: marginLeft,
        y: y - blockHeight,
        width: contentWidth,
        height: blockHeight,
        color: COLORS.lightGray
      });
    }

    // Borda inferior
    page.drawLine({
      start: { x: marginLeft, y: y - blockHeight },
      end: { x: pageWidth - marginRight, y: y - blockHeight },
      thickness: 0.5,
      color: COLORS.border
    });

    let currentY = y - 15;

    // === LINHA 1: Badge + Cliente + Telefone + Valor ===
    // Badge tipo
    const tipoText = isEntrega ? 'ENTREGA' : 'RETIRADA';
    const tipoColor = isEntrega ? rgb(13/255, 100/255, 120/255) : rgb(46/255, 125/255, 50/255);
    const badgeWidth = fontBold.widthOfTextAtSize(tipoText, 7) + 10;

    page.drawRectangle({
      x: marginLeft + 8,
      y: currentY - 4,
      width: badgeWidth,
      height: 12,
      color: tipoColor
    });

    page.drawText(tipoText, {
      x: marginLeft + 13,
      y: currentY - 1,
      size: 7,
      font: fontBold,
      color: COLORS.white
    });

    // Cliente
    const clienteText = order.nome || '-';
    page.drawText(clienteText, {
      x: marginLeft + badgeWidth + 15,
      y: currentY,
      size: 11,
      font: fontBold,
      color: COLORS.black
    });

    // Telefone (logo após o nome)
    const clienteWidth = fontBold.widthOfTextAtSize(clienteText, 11);
    page.drawText(order.telefone || '-', {
      x: marginLeft + badgeWidth + 15 + clienteWidth + 12,
      y: currentY,
      size: 9,
      font: font,
      color: COLORS.gray
    });

    // Valor (direita)
    const valorText = formatBRL(order.total);
    const valorWidth = fontBold.widthOfTextAtSize(valorText, 12);
    page.drawText(valorText, {
      x: pageWidth - marginRight - valorWidth - 8,
      y: currentY,
      size: 12,
      font: fontBold,
      color: COLORS.primary
    });

    currentY -= 16;

    // === LINHA 2: Endereço completo (se entrega) ===
    if (isEntrega) {
      const enderecoParts = [
        order.rua,
        order.numero ? `nº ${order.numero}` : null,
        order.complemento,
        order.bairro,
        order.cidade
      ].filter(Boolean);
      const enderecoText = enderecoParts.join(', ');

      page.drawText(enderecoText, {
        x: marginLeft + 8,
        y: currentY,
        size: 8,
        font: font,
        color: COLORS.gray
      });

      currentY -= 14;
    }

    // === ITENS ===
    page.drawText(`Itens (${items.length}):`, {
      x: marginLeft + 8,
      y: currentY,
      size: 8,
      font: fontBold,
      color: COLORS.black
    });

    currentY -= 11;

    // Desenha itens em linhas
    itemsLines.forEach(line => {
      page.drawText(line, {
        x: marginLeft + 8,
        y: currentY,
        size: 8,
        font: font,
        color: COLORS.black
      });
      currentY -= 10;
    });

    y -= blockHeight + 5;
  }

  // ========== DESENHA PEDIDOS ==========
  orders.forEach((order, index) => {
    drawOrder(order, index);
  });

  // ========== RODAPÉ FINAL ==========
  y -= 5;

  page.drawLine({
    start: { x: marginLeft, y: y },
    end: { x: pageWidth - marginRight, y: y },
    thickness: 1,
    color: COLORS.primary
  });

  y -= 18;

  page.drawText(`Total Geral: ${formatBRL(totalValue)}`, {
    x: pageWidth - marginRight - 120,
    y: y,
    size: 11,
    font: fontBold,
    color: COLORS.primary
  });

  page.drawText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
    x: marginLeft,
    y: y,
    size: 8,
    font: font,
    color: COLORS.gray
  });

  // Rodapé em todas as páginas
  const pages = pdfDoc.getPages();
  pages.forEach((p, i) => {
    p.drawText('CAMFOR - Agricultura Familiar', {
      x: marginLeft,
      y: 25,
      size: 7,
      font: font,
      color: COLORS.gray
    });
    p.drawText(`Página ${i + 1} de ${pages.length}`, {
      x: pageWidth - marginRight - 55,
      y: 25,
      size: 7,
      font: font,
      color: COLORS.gray
    });
  });

  return pdfDoc;
}

async function main() {
  console.log('📄 Gerando PDF (vertical, itens completos)...');
  console.log(`📦 ${mockOrders.length} pedidos de teste`);

  const today = new Date();
  const pdfDoc = await generatePDF(mockOrders, today);
  const pdfBytes = await pdfDoc.save();

  const outputPath = path.join(__dirname, '../relatorio-teste.pdf');
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`\n✅ PDF gerado!`);
  console.log(`📁 Arquivo: ${outputPath}`);
  console.log('\n🖥️  Abrindo...');

  require('child_process').exec(`open "${outputPath}"`);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
