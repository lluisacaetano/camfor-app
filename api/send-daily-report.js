// API Route para gerar e enviar relatório diário em PDF
// Executada automaticamente às 17h pelo Vercel Cron

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Cores
const COLORS = {
  primary: rgb(10/255, 77/255, 92/255),
  secondary: rgb(13/255, 100/255, 120/255),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  gray: rgb(100/255, 100/255, 100/255),
  lightGray: rgb(240/255, 240/255, 240/255),
  border: rgb(180/255, 180/255, 180/255)
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

// Gera PDF com pdf-lib
async function generatePDF(orders, date) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 Paisagem
  const pageWidth = 841.89;
  const pageHeight = 595.28;

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

  // Cria linhas da tabela (cada item = uma linha)
  const tableRows = [];
  orders.forEach(order => {
    const items = order.items || [];
    if (items.length === 0) {
      // Pedido sem itens
      tableRows.push({
        tipo: order.tipo === 'retirada' ? 'Retirada' : 'Entrega',
        cliente: order.nome || '-',
        telefone: order.telefone || '-',
        endereco: order.tipo === 'entrega'
          ? `${order.rua || ''}, ${order.numero || ''} - ${order.bairro || ''}`
          : '-',
        item: 'Sem itens',
        qtd: 1,
        valorUnit: order.total || 0,
        subtotal: order.total || 0,
        isFirstItem: true
      });
    } else {
      items.forEach((item, idx) => {
        tableRows.push({
          tipo: order.tipo === 'retirada' ? 'Retirada' : 'Entrega',
          cliente: order.nome || '-',
          telefone: order.telefone || '-',
          endereco: order.tipo === 'entrega'
            ? `${order.rua || ''}, ${order.numero || ''} - ${order.bairro || ''}`
            : '-',
          item: item.name || item.id || '-',
          qtd: item.qty || 1,
          valorUnit: item.price || 0,
          subtotal: (item.qty || 1) * (item.price || 0),
          isFirstItem: idx === 0
        });
      });
    }
  });

  // Configurações da tabela
  const marginLeft = 30;
  const marginRight = 30;
  const marginTop = 40;
  const tableWidth = pageWidth - marginLeft - marginRight;

  // Colunas
  const cols = [
    { label: 'Tipo', width: 55 },
    { label: 'Cliente', width: 130 },
    { label: 'Telefone', width: 90 },
    { label: 'Endereço', width: 160 },
    { label: 'Produto', width: 150 },
    { label: 'Qtd', width: 35 },
    { label: 'V. Unit', width: 65 },
    { label: 'Subtotal', width: 70 }
  ];

  const rowHeight = 18;
  const headerHeight = 22;
  const fontSize = 8;
  const headerFontSize = 9;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  // ========== CABEÇALHO ==========
  if (logoImage) {
    page.drawImage(logoImage, { x: marginLeft, y: y - 35, width: 40, height: 40 });
  }

  page.drawText('CAMFOR', {
    x: marginLeft + (logoImage ? 48 : 0),
    y: y - 10,
    size: 20,
    font: fontBold,
    color: COLORS.primary
  });

  page.drawText('Relatório Diário de Pedidos', {
    x: marginLeft + (logoImage ? 48 : 0),
    y: y - 26,
    size: 10,
    font: font,
    color: COLORS.gray
  });

  // Data e resumo no canto direito
  page.drawText(formatDate(date), {
    x: pageWidth - marginRight - 200,
    y: y - 10,
    size: 9,
    font: font,
    color: COLORS.black
  });

  page.drawText(`${totalOrders} pedidos | ${retiradas} retiradas | ${entregas} entregas | Total: ${formatBRL(totalValue)}`, {
    x: pageWidth - marginRight - 290,
    y: y - 26,
    size: 9,
    font: fontBold,
    color: COLORS.primary
  });

  y -= 55;

  // Linha divisória
  page.drawLine({
    start: { x: marginLeft, y: y },
    end: { x: pageWidth - marginRight, y: y },
    thickness: 1,
    color: COLORS.primary
  });

  y -= 15;

  // Função para desenhar cabeçalho da tabela
  function drawTableHeader() {
    page.drawRectangle({
      x: marginLeft,
      y: y - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: COLORS.primary
    });

    let x = marginLeft + 5;
    cols.forEach(col => {
      page.drawText(col.label, {
        x: x,
        y: y - 15,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.white
      });
      x += col.width;
    });

    y -= headerHeight;
  }

  // Função para desenhar uma linha da tabela
  function drawTableRow(row, isAlternate) {
    if (isAlternate) {
      page.drawRectangle({
        x: marginLeft,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: COLORS.lightGray
      });
    }

    page.drawLine({
      start: { x: marginLeft, y: y - rowHeight },
      end: { x: pageWidth - marginRight, y: y - rowHeight },
      thickness: 0.3,
      color: COLORS.border
    });

    let x = marginLeft + 5;
    const textY = y - 13;

    if (row.isFirstItem) {
      page.drawText(row.tipo, { x: x, y: textY, size: fontSize, font: fontBold, color: COLORS.black });
    }
    x += cols[0].width;

    if (row.isFirstItem) {
      const clienteText = row.cliente.length > 20 ? row.cliente.substring(0, 18) + '...' : row.cliente;
      page.drawText(clienteText, { x: x, y: textY, size: fontSize, font: font, color: COLORS.black });
    }
    x += cols[1].width;

    if (row.isFirstItem) {
      page.drawText(row.telefone, { x: x, y: textY, size: fontSize, font: font, color: COLORS.gray });
    }
    x += cols[2].width;

    if (row.isFirstItem) {
      const endText = row.endereco.length > 28 ? row.endereco.substring(0, 26) + '...' : row.endereco;
      page.drawText(endText, { x: x, y: textY, size: fontSize, font: font, color: COLORS.gray });
    }
    x += cols[3].width;

    const prodText = row.item.length > 24 ? row.item.substring(0, 22) + '...' : row.item;
    page.drawText(prodText, { x: x, y: textY, size: fontSize, font: font, color: COLORS.black });
    x += cols[4].width;

    page.drawText(row.qtd.toString(), { x: x + 10, y: textY, size: fontSize, font: font, color: COLORS.black });
    x += cols[5].width;

    page.drawText(formatBRL(row.valorUnit), { x: x, y: textY, size: fontSize, font: font, color: COLORS.black });
    x += cols[6].width;

    page.drawText(formatBRL(row.subtotal), { x: x, y: textY, size: fontSize, font: fontBold, color: COLORS.primary });

    y -= rowHeight;
  }

  // Desenha cabeçalho inicial
  drawTableHeader();

  // Desenha linhas
  let currentOrderIdx = -1;
  let isAlternate = false;

  tableRows.forEach((row) => {
    if (y - rowHeight < 50) {
      page.drawText('CAMFOR - Agricultura Familiar', {
        x: marginLeft,
        y: 25,
        size: 7,
        font: font,
        color: COLORS.gray
      });
      page.drawText(`Página ${pdfDoc.getPageCount()}`, {
        x: pageWidth - marginRight - 50,
        y: 25,
        size: 7,
        font: font,
        color: COLORS.gray
      });

      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginTop;
      drawTableHeader();
    }

    if (row.isFirstItem) {
      currentOrderIdx++;
      isAlternate = currentOrderIdx % 2 === 1;
    }

    drawTableRow(row, isAlternate);
  });

  // Rodapé final
  page.drawLine({
    start: { x: marginLeft, y: y - 5 },
    end: { x: pageWidth - marginRight, y: y - 5 },
    thickness: 1,
    color: COLORS.primary
  });

  y -= 20;

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
      y: 20,
      size: 7,
      font: font,
      color: COLORS.gray
    });
    p.drawText(`Página ${i + 1} de ${pages.length}`, {
      x: pageWidth - marginRight - 60,
      y: 20,
      size: 7,
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

    // Busca pedidos de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef
      .where('createdAt', '>=', today)
      .where('createdAt', '<', tomorrow)
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      });
    });

    // Gera PDF
    const pdfDoc = await generatePDF(orders, today);
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const fileName = `relatorio-camfor-${formatShortDate(today).replace(/\//g, '-')}.pdf`;

    // Envia email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TO_EMAIL = process.env.REPORT_EMAIL || 'lluisacaetanoaraujo@gmail.com';

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
        from: 'CAMFOR <onboarding@resend.dev>',
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
