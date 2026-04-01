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
  lightGray: rgb(245/255, 245/255, 245/255),
  border: rgb(200/255, 200/255, 200/255)
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

// Gera PDF com pdf-lib
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
          orders.push({
            id: doc.id,
            ...data
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
