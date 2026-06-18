import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate, useOutletContext } from 'react-router-dom';

import CamforHome from './components/CamforHome';
import CestaDetalhes from './components/CestaDetalhes';
import MontarCesta from './components/MontarCesta';
import AdminLogin from './components/AdminLogin';
import AdminHome from './components/AdminHome';
import AdminCesta from './components/AdminCesta';
import AdminPedidos from './components/AdminPedidos';
import AdminProdutos from './components/AdminProdutos';
import OrderNotificationToast from './components/OrderNotificationToast';
import Loading from './components/Loading';
import useOrderNotifications from './hooks/useOrderNotifications';
import { subscribeToAuthChanges, logoutAdmin } from './services/authService';

// Layout das telas administrativas: toast de notificações, guarda de
// autenticação e contexto compartilhado (markAsRead) para as telas filhas.
function AdminLayout() {
  const navigate = useNavigate();
  const { notifications, dismissNotification, markAsRead } = useOrderNotifications(true);
  const [authed, setAuthed] = useState(null); // null = ainda verificando

  // Aguarda o Firebase restaurar a sessão. Se não houver admin logado,
  // volta para a tela de login.
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAuthed(!!user);
      if (!user) navigate('/admin', { replace: true });
    });
    return () => unsubscribe();
  }, [navigate]);

  // Enquanto verifica a sessão (ou já saiu, antes do redirect concluir),
  // mostra o carregando para não piscar a tela administrativa.
  if (!authed) {
    return <Loading message="Verificando acesso..." />;
  }

  return (
    <>
      <OrderNotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onViewOrders={() => {
          markAsRead();
          navigate('/admin/pedidos');
        }}
      />
      <Outlet context={{ markAsRead }} />
    </>
  );
}

function AdminHomePage() {
  const navigate = useNavigate();
  const { markAsRead } = useOutletContext();
  return (
    <AdminHome
      onBack={async () => {
        await logoutAdmin();
        navigate('/');
      }}
      onSelectProducts={() => navigate('/admin/cesta')}
      onViewOrders={() => {
        markAsRead();
        navigate('/admin/pedidos');
      }}
      onManageProducts={() => navigate('/admin/produtos')}
    />
  );
}

function AdminCestaPage() {
  const navigate = useNavigate();
  return <AdminCesta onBack={() => navigate('/admin/painel')} />;
}

function AdminPedidosPage() {
  const navigate = useNavigate();
  const { markAsRead } = useOutletContext();
  return <AdminPedidos onBack={() => navigate('/admin/painel')} onMount={markAsRead} />;
}

function AdminProdutosPage() {
  const navigate = useNavigate();
  return <AdminProdutos onBack={() => navigate('/admin/painel')} />;
}

function AdminLoginPage() {
  const navigate = useNavigate();
  return (
    <AdminLogin
      onBack={() => navigate('/')}
      onLoginSuccess={() => navigate('/admin/painel')}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CamforHome />} />
        <Route path="/cesta/*" element={<CestaDetalhes />} />
        <Route path="/montar/*" element={<MontarCesta />} />

        <Route path="/admin" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/painel" element={<AdminHomePage />} />
          <Route path="/admin/cesta" element={<AdminCestaPage />} />
          <Route path="/admin/pedidos" element={<AdminPedidosPage />} />
          <Route path="/admin/produtos" element={<AdminProdutosPage />} />
        </Route>

        {/* Qualquer rota desconhecida volta para a home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
