// API Route para gerar e enviar relatório diário em PDF
// Executada automaticamente às 17h pelo Vercel Cron

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const PdfPrinter = require('pdfmake');

// Cores da CAMFOR
const COLORS = {
  primary: '#0a4d5c',      // Verde escuro principal
  secondary: '#0d6478',    // Verde médio
  accent: '#26c6da',       // Ciano/Turquesa
  light: '#e8f5f7',        // Verde claro para backgrounds
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#dddddd'
};

// Fontes para o PDF
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
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
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata data completa
function formatDate(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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

// Busca logo como base64
async function fetchLogoBase64() {
  try {
    const logoUrl = 'https://camfor.vercel.app/images/logoCamfor.png';
    const response = await fetch(logoUrl);
    if (!response.ok) throw new Error('Logo not found');
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.log('Não foi possível carregar logo:', error.message);
    return null;
  }
}

// Gera o documento PDF
function generatePdfDocument(orders, date, logoBase64) {
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const retiradaOrders = orders.filter(o => o.tipo === 'retirada');
  const entregaOrders = orders.filter(o => o.tipo === 'entrega');

  // Cabeçalho com logo e título
  const headerContent = [];

  if (logoBase64) {
    headerContent.push({
      columns: [
        {
          image: logoBase64,
          width: 70,
          margin: [0, 0, 15, 0]
        },
        {
          stack: [
            { text: 'CAMFOR', style: 'headerTitle' },
            { text: 'Agricultura Familiar', style: 'headerSubtitle' },
            { text: 'Relatório Diário de Pedidos', style: 'headerReport' }
          ],
          margin: [0, 5, 0, 0]
        }
      ],
      margin: [0, 0, 0, 20]
    });
  } else {
    headerContent.push({
      stack: [
        { text: 'CAMFOR', style: 'headerTitle' },
        { text: 'Agricultura Familiar', style: 'headerSubtitle' },
        { text: 'Relatório Diário de Pedidos', style: 'headerReport' }
      ],
      margin: [0, 0, 0, 20]
    });
  }

  // Data do relatório
  headerContent.push({
    columns: [
      { text: formatDate(date), style: 'dateText' },
      { text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, style: 'generatedText', alignment: 'right' }
    ],
    margin: [0, 0, 0, 20]
  });

  // Linha separadora
  headerContent.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: COLORS.primary }],
    margin: [0, 0, 0, 20]
  });

  // Cards de resumo
  const summaryTable = {
    table: {
      widths: ['*', '*', '*', '*'],
      body: [
        [
          { text: 'TOTAL DE PEDIDOS', style: 'summaryLabel', border: [false, false, false, false] },
          { text: 'VALOR TOTAL', style: 'summaryLabel', border: [false, false, false, false] },
          { text: 'RETIRADAS', style: 'summaryLabel', border: [false, false, false, false] },
          { text: 'ENTREGAS', style: 'summaryLabel', border: [false, false, false, false] }
        ],
        [
          { text: totalOrders.toString(), style: 'summaryValue', border: [false, false, false, false] },
          { text: formatBRL(totalValue), style: 'summaryValueMoney', border: [false, false, false, false] },
          { text: retiradaOrders.length.toString(), style: 'summaryValue', border: [false, false, false, false] },
          { text: entregaOrders.length.toString(), style: 'summaryValue', border: [false, false, false, false] }
        ]
      ]
    },
    layout: {
      fillColor: function(rowIndex) {
        return COLORS.light;
      },
      paddingLeft: () => 15,
      paddingRight: () => 15,
      paddingTop: () => 10,
      paddingBottom: () => 10
    },
    margin: [0, 0, 0, 30]
  };

  // Seção de Retiradas
  const retiradaSection = [];
  retiradaSection.push({
    text: `RETIRADAS (${retiradaOrders.length})`,
    style: 'sectionTitle',
    margin: [0, 0, 0, 10]
  });

  if (retiradaOrders.length === 0) {
    retiradaSection.push({
      text: 'Nenhum pedido de retirada neste dia.',
      style: 'noOrders',
      margin: [0, 0, 0, 20]
    });
  } else {
    // Tabela de retiradas
    const retiradaTableBody = [
      [
        { text: 'Cliente', style: 'tableHeader' },
        { text: 'Telefone', style: 'tableHeader' },
        { text: 'Itens', style: 'tableHeader' },
        { text: 'Valor', style: 'tableHeader', alignment: 'right' }
      ]
    ];

    retiradaOrders.forEach(order => {
      const itensText = order.items && order.items.length > 0
        ? order.items.map(i => `${i.name || i.id} (${i.qty || 1}x)`).join(', ')
        : '-';

      retiradaTableBody.push([
        { text: order.nome || 'Sem nome', style: 'tableCell' },
        { text: order.telefone || '-', style: 'tableCell' },
        { text: itensText, style: 'tableCellSmall' },
        { text: formatBRL(order.total), style: 'tableCell', alignment: 'right' }
      ]);
    });

    retiradaSection.push({
      table: {
        headerRows: 1,
        widths: ['20%', '18%', '*', '18%'],
        body: retiradaTableBody
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => COLORS.border,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8,
        paddingBottom: () => 8,
        fillColor: function(rowIndex) {
          if (rowIndex === 0) return COLORS.primary;
          return rowIndex % 2 === 0 ? COLORS.light : null;
        }
      },
      margin: [0, 0, 0, 25]
    });
  }

  // Seção de Entregas
  const entregaSection = [];
  entregaSection.push({
    text: `ENTREGAS (${entregaOrders.length})`,
    style: 'sectionTitle',
    margin: [0, 0, 0, 10]
  });

  if (entregaOrders.length === 0) {
    entregaSection.push({
      text: 'Nenhum pedido de entrega neste dia.',
      style: 'noOrders',
      margin: [0, 0, 0, 20]
    });
  } else {
    // Tabela de entregas
    const entregaTableBody = [
      [
        { text: 'Cliente', style: 'tableHeader' },
        { text: 'Endereço', style: 'tableHeader' },
        { text: 'Itens', style: 'tableHeader' },
        { text: 'Valor', style: 'tableHeader', alignment: 'right' }
      ]
    ];

    entregaOrders.forEach(order => {
      const endereco = [order.rua, order.numero, order.bairro, order.cidade]
        .filter(Boolean).join(', ') || '-';

      const itensText = order.items && order.items.length > 0
        ? order.items.map(i => `${i.name || i.id} (${i.qty || 1}x)`).join(', ')
        : '-';

      entregaTableBody.push([
        {
          stack: [
            { text: order.nome || 'Sem nome', style: 'tableCell' },
            { text: order.telefone || '', style: 'tableCellPhone' }
          ]
        },
        { text: endereco, style: 'tableCellSmall' },
        { text: itensText, style: 'tableCellSmall' },
        { text: formatBRL(order.total), style: 'tableCell', alignment: 'right' }
      ]);
    });

    entregaSection.push({
      table: {
        headerRows: 1,
        widths: ['22%', '30%', '*', '15%'],
        body: entregaTableBody
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => COLORS.border,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8,
        paddingBottom: () => 8,
        fillColor: function(rowIndex) {
          if (rowIndex === 0) return COLORS.primary;
          return rowIndex % 2 === 0 ? COLORS.light : null;
        }
      },
      margin: [0, 0, 0, 25]
    });
  }

  // Documento completo
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],

    content: [
      ...headerContent,
      summaryTable,
      ...retiradaSection,
      ...entregaSection
    ],

    footer: function(currentPage, pageCount) {
      return {
        columns: [
          {
            text: 'CAMFOR - Agricultura Familiar | Relatório gerado automaticamente',
            style: 'footer',
            alignment: 'left'
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            style: 'footer',
            alignment: 'right'
          }
        ],
        margin: [40, 20, 40, 0]
      };
    },

    styles: {
      headerTitle: {
        fontSize: 28,
        bold: true,
        color: COLORS.primary
      },
      headerSubtitle: {
        fontSize: 12,
        color: COLORS.secondary,
        margin: [0, 2, 0, 0]
      },
      headerReport: {
        fontSize: 14,
        bold: true,
        color: COLORS.text,
        margin: [0, 8, 0, 0]
      },
      dateText: {
        fontSize: 12,
        color: COLORS.text
      },
      generatedText: {
        fontSize: 9,
        color: COLORS.textLight
      },
      summaryLabel: {
        fontSize: 9,
        color: COLORS.textLight,
        alignment: 'center'
      },
      summaryValue: {
        fontSize: 22,
        bold: true,
        color: COLORS.primary,
        alignment: 'center'
      },
      summaryValueMoney: {
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        alignment: 'center'
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        color: COLORS.primary
      },
      noOrders: {
        fontSize: 11,
        color: COLORS.textLight,
        italics: true,
        alignment: 'center'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: COLORS.white
      },
      tableCell: {
        fontSize: 10,
        color: COLORS.text
      },
      tableCellSmall: {
        fontSize: 9,
        color: COLORS.text
      },
      tableCellPhone: {
        fontSize: 8,
        color: COLORS.textLight
      },
      footer: {
        fontSize: 8,
        color: COLORS.textLight
      }
    },

    defaultStyle: {
      font: 'Helvetica'
    }
  };

  return docDefinition;
}

// Gera PDF como buffer
async function generatePdfBuffer(orders, date) {
  const logoBase64 = await fetchLogoBase64();
  const docDefinition = generatePdfDocument(orders, date, logoBase64);

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
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
    const pdfBuffer = await generatePdfBuffer(orders, today);
    const pdfBase64 = pdfBuffer.toString('base64');
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

    // Email com PDF anexado
    const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0a4d5c 0%, #0d6478 100%); padding: 25px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CAMFOR - Relatório Diário</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">${formatDate(today)}</p>
        </div>
        <div style="background: #f5f5f5; padding: 25px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 15px; color: #333;">Olá!</p>
          <p style="margin: 0 0 15px; color: #333;">
            Segue em anexo o relatório diário de pedidos da CAMFOR.
          </p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; color: #666;">
              <strong style="color: #0a4d5c;">Total de pedidos:</strong> ${orders.length}<br>
              <strong style="color: #0a4d5c;">Valor total:</strong> ${formatBRL(totalValue)}
            </p>
          </div>
          <p style="margin: 0; color: #666; font-size: 14px;">
            📎 <strong>${fileName}</strong> anexado a este email.
          </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          Relatório gerado automaticamente pelo sistema CAMFOR
        </p>
      </div>
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
        subject: `📊 Relatório CAMFOR - ${formatDate(today)}`,
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
