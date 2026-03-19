// API Route para gerar e enviar relatório diário
// Executada automaticamente às 17h pelo Vercel Cron

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa Firebase Admin (usa variáveis de ambiente)
function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Credenciais do Firebase Admin via variáveis de ambiente
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

// Formata data
function formatDate(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Gera o conteúdo HTML do relatório (será convertido em PDF ou enviado como HTML)
function generateReportHTML(orders, date) {
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const retiradaOrders = orders.filter(o => o.tipo === 'retirada');
  const entregaOrders = orders.filter(o => o.tipo === 'entrega');

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { background: linear-gradient(135deg, #0a4d5c, #0d6478); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .summary { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .summary-card { background: #f5f5f5; padding: 15px 20px; border-radius: 8px; flex: 1; min-width: 150px; }
        .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #0a4d5c; }
        .section { margin-top: 25px; }
        .section h2 { font-size: 18px; color: #0a4d5c; border-bottom: 2px solid #0a4d5c; padding-bottom: 5px; }
        .order { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #26c6da; }
        .order-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .order-name { font-weight: bold; font-size: 16px; }
        .order-value { color: #0a4d5c; font-weight: bold; }
        .order-details { font-size: 14px; color: #666; }
        .order-items { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ddd; font-size: 13px; }
        .no-orders { text-align: center; color: #999; padding: 30px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CAMFOR - Relatório Diário</h1>
        <p>${formatDate(date)}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <div class="label">Total de Pedidos</div>
          <div class="value">${totalOrders}</div>
        </div>
        <div class="summary-card">
          <div class="label">Valor Total</div>
          <div class="value">${formatBRL(totalValue)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Retiradas</div>
          <div class="value">${retiradaOrders.length}</div>
        </div>
        <div class="summary-card">
          <div class="label">Entregas</div>
          <div class="value">${entregaOrders.length}</div>
        </div>
      </div>
  `;

  // Seção Retiradas
  html += `<div class="section"><h2>Retiradas (${retiradaOrders.length})</h2>`;
  if (retiradaOrders.length === 0) {
    html += `<div class="no-orders">Nenhum pedido de retirada hoje</div>`;
  } else {
    for (const order of retiradaOrders) {
      html += `
        <div class="order">
          <div class="order-header">
            <span class="order-name">${order.nome || 'Sem nome'}</span>
            <span class="order-value">${formatBRL(order.total)}</span>
          </div>
          <div class="order-details">
            <strong>Telefone:</strong> ${order.telefone || '-'}
          </div>
          ${order.items && order.items.length > 0 ? `
            <div class="order-items">
              <strong>Itens:</strong> ${order.items.map(i => `${i.name || i.id} (${i.qty || 1}x)`).join(', ')}
            </div>
          ` : ''}
        </div>
      `;
    }
  }
  html += `</div>`;

  // Seção Entregas
  html += `<div class="section"><h2>Entregas (${entregaOrders.length})</h2>`;
  if (entregaOrders.length === 0) {
    html += `<div class="no-orders">Nenhum pedido de entrega hoje</div>`;
  } else {
    for (const order of entregaOrders) {
      const endereco = [order.rua, order.numero, order.bairro, order.cidade, order.uf]
        .filter(Boolean).join(', ');
      html += `
        <div class="order">
          <div class="order-header">
            <span class="order-name">${order.nome || 'Sem nome'}</span>
            <span class="order-value">${formatBRL(order.total)}</span>
          </div>
          <div class="order-details">
            <strong>Telefone:</strong> ${order.telefone || '-'}<br>
            <strong>Endereço:</strong> ${endereco || '-'}
          </div>
          ${order.items && order.items.length > 0 ? `
            <div class="order-items">
              <strong>Itens:</strong> ${order.items.map(i => `${i.name || i.id} (${i.qty || 1}x)`).join(', ')}
            </div>
          ` : ''}
        </div>
      `;
    }
  }
  html += `</div>`;

  html += `
      <div class="footer">
        <p>Relatório gerado automaticamente pelo sistema CAMFOR</p>
        <p>© ${new Date().getFullYear()} CAMFOR - Agricultura Familiar</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// Handler principal
module.exports = async function handler(req, res) {
  // Verifica autorização (Vercel Cron envia um header especial)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Permite execução via cron ou com secret manual
  if (authHeader !== `Bearer ${cronSecret}` && req.query.secret !== cronSecret) {
    // Em desenvolvimento, permite sem autenticação
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

    // Se não tiver pedidos, ainda envia relatório informando
    const reportHTML = generateReportHTML(orders, today);

    // Envia email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TO_EMAIL = process.env.REPORT_EMAIL || 'lluisacaetanoaraujo@gmail.com';

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY não configurada. Relatório gerado mas não enviado.');
      return res.status(200).json({
        success: true,
        message: 'Relatório gerado (email não configurado)',
        ordersCount: orders.length,
        html: reportHTML
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CAMFOR <onboarding@resend.dev>',
        to: [TO_EMAIL],
        subject: `Relatório CAMFOR - ${formatDate(today)}`,
        html: reportHTML,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || 'Erro ao enviar email');
    }

    return res.status(200).json({
      success: true,
      message: 'Relatório enviado com sucesso',
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
