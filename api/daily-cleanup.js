// API Route para limpeza diária
// Executada automaticamente às 23h (horário de Brasília) pelo Vercel Cron

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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

// Retorna data/hora atual no fuso horário de Brasília
function getBrasiliaDateTime() {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcOffset = now.getTimezoneOffset();
  const brasiliaTime = new Date(now.getTime() + (utcOffset + brasiliaOffset) * 60000);
  return brasiliaTime;
}

// Limpa todos os pedidos
async function clearAllOrders(db) {
  const ordersRef = db.collection('orders');
  const snapshot = await ordersRef.get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

// Limpa configuração do admin (produtos selecionados e preços)
async function clearAdminConfig(db) {
  const configRef = db.collection('config').doc('admin');
  await configRef.set({
    selectedItems: [],
    prices: { 10: 0, 15: 0, 18: 0 },
    updatedAt: new Date()
  });
}

module.exports = async function handler(req, res) {
  // Verifica autorização do cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🧹 Iniciando limpeza diária...');

    // Inicializa Firebase
    getFirebaseApp();
    const db = getFirestore();

    const brasiliaTime = getBrasiliaDateTime();
    console.log(`📅 Data/hora Brasília: ${brasiliaTime.toLocaleString('pt-BR')}`);

    // Limpa pedidos
    const deletedOrders = await clearAllOrders(db);
    console.log(`✅ ${deletedOrders} pedidos removidos`);

    // Limpa configuração do admin
    await clearAdminConfig(db);
    console.log('✅ Configuração do admin resetada');

    return res.status(200).json({
      success: true,
      message: 'Limpeza diária concluída',
      deletedOrders,
      timestamp: brasiliaTime.toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na limpeza diária:', error);
    return res.status(500).json({
      error: 'Erro na limpeza diária',
      details: error.message
    });
  }
};
