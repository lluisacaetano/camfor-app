import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { IoSettingsSharp } from 'react-icons/io5';
import './CamforHome.css';

import CestaDetalhes from './CestaDetalhes';
import MontarCesta from './MontarCesta';
import AdminLogin from './AdminLogin';
import AdminHome from './AdminHome';
import AdminCesta from './AdminCesta';
import AdminPedidos from './AdminPedidos';

export default function CamforHome() {
  const [showCesta, setShowCesta] = useState(false);
  const [showMontar, setShowMontar] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminHome, setShowAdminHome] = useState(false);
  const [showAdminCesta, setShowAdminCesta] = useState(false);
  const [showAdminPedidos, setShowAdminPedidos] = useState(false);

  const [isOpenTime, setIsOpenTime] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);

  useEffect(() => {
    function clearAdminConfig() {
      localStorage.removeItem('camfor_selected_items');
      localStorage.removeItem('camfor_prices');
    }
    function performDailyResetIfNeeded() {
      try {
        const now = new Date();
        const today = now.toISOString().slice(0,10);
        const lastReset = localStorage.getItem('camfor_last_reset');
        // reset diário às 17:00 (fechamento)
        if (now.getHours() >= 17 && lastReset !== today) {
          clearAdminConfig();
          localStorage.setItem('camfor_last_reset', today);
        }
      } catch (e) { console.warn(e); }
    }
    function checkBusinessHours() {
      const h = new Date().getHours();
      return h < 17; // pedidos apenas até 17:00
    }
    function refreshMain() {
      performDailyResetIfNeeded();
      setIsOpenTime(checkBusinessHours());
      try {
        const rawItems = localStorage.getItem('camfor_selected_items');
        const rawPrices = localStorage.getItem('camfor_prices');
        const hasItems = rawItems ? (JSON.parse(rawItems).length > 0) : false;
        const prices = rawPrices ? JSON.parse(rawPrices) : {};
        const hasPrices = prices[10] > 0 || prices[15] > 0 || prices[18] > 0;
        setHasProducts(hasItems && hasPrices);
      } catch (e) {
        setHasProducts(false);
      }
    }
    refreshMain();
    const id = setInterval(refreshMain, 60*1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const setFavicon = (url) => {
      try {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.type = 'image/png';
        link.href = url;
      } catch (e) {
        console.warn('Erro ao definir favicon', e);
      }
    };
    setFavicon('/images/logoImagem.png');
  }, []);

  if (showCesta) {
    return <CestaDetalhes onClose={() => setShowCesta(false)} onFinish={() => setShowCesta(false)} />;
  }
  if (showMontar) {
    return <MontarCesta onBack={() => setShowMontar(false)} />;
  }
  if (showAdmin) {
    return <AdminLogin 
      onBack={() => setShowAdmin(false)} 
      onLoginSuccess={() => {
        setShowAdmin(false);
        setShowAdminHome(true);
      }} 
    />;
  }
  if (showAdminHome) {
    return <AdminHome 
      onBack={() => {
        setShowAdminHome(false);
        localStorage.removeItem('adminLogged');
      }}
      onSelectProducts={() => {
        setShowAdminHome(false);
        setShowAdminCesta(true);
      }}
      onViewOrders={() => {
        setShowAdminHome(false);
        setShowAdminPedidos(true);
      }}
    />;
  }
  if (showAdminCesta) {
    return <AdminCesta 
      onBack={() => {
        setShowAdminCesta(false);
        setShowAdminHome(true);
      }} 
    />;
  }
  if (showAdminPedidos) {
    return <AdminPedidos 
      onBack={() => {
        setShowAdminPedidos(false);
        setShowAdminHome(true);
      }} 
    />;
  }

  return (
    <div className="ch-root">
      {/* Administrador */}
      <button
        className="admin-gear"
        onClick={() => setShowAdmin(true)}
        aria-label="Admin"
        title="Configurações"
      >
        <IoSettingsSharp size={22} />
      </button>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            
            {/* Capa + Logo */}
            <div className="ch-cover-wrapper">
              <div className="ch-cover-inner">
                <img 
                  src="/images/capa.jpg" 
                  alt="Produtos Agricultura Familiar"
                  className="ch-cover-img"
                />
              </div>

              {/* Logo */}
              <div className="ch-logo">
                <img 
                  src="/images/logoImagem.png" 
                  alt="CAMFOR - Agricultura Familiar"
                  className="ch-logo-img"
                />
              </div>
            </div>

            {/* Título */}
            <h2 className="ch-title">
              ESCOLHA O TIPO DE PEDIDO
            </h2>

            {/* Botões*/}
            <div className="d-grid gap-3 mb-4 ch-btn-group">
              <button
                className="ch-btn"
                onClick={() => setShowCesta(true)}
                disabled={!isOpenTime || !hasProducts}
              >
                PEDIR CESTA COMPLETA
              </button>
              <button className="ch-btn" onClick={() => setShowMontar(true)} disabled={!isOpenTime || !hasProducts}>MONTAR MINHA CESTA</button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay LOJA FECHADA - mostra se passou das 17h OU se admin não configurou produtos */}
      {(!isOpenTime || !hasProducts) && (
        <div className="ch-closed-backdrop" role="dialog" aria-modal="true">
          <div className={`ch-closed-modal ${isOpenTime && !hasProducts ? 'ch-aguarde-modal' : ''}`}>
            {isOpenTime && !hasProducts && (
              <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
            )}
            <div className="ch-closed-title">
              {!isOpenTime ? 'LOJA FECHADA' : 'AGUARDE'}
            </div>
            {!isOpenTime ? (
              <>
                <div className="ch-closed-hours"><strong>Horário de Funcionamento:</strong></div>
                <div className="ch-closed-hours">08:00 às 18:00</div>
                <div className="ch-closed-hours" style={{ marginTop: 8 }}><strong>Pedidos Online:</strong> até 17:00</div>
                <div className="ch-closed-note">Por favor, retorne no horário de funcionamento.</div>
              </>
            ) : (
              <>
                <div className="ch-closed-hours">Os produtos do dia ainda não foram configurados.</div>
                <div className="ch-closed-hours" style={{ marginTop: 12 }}><strong>Horário de Funcionamento:</strong></div>
                <div className="ch-closed-hours">08:00 às 18:00</div>
                <div className="ch-closed-note">Por favor, aguarde o administrador liberar os pedidos.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Logo SICOOB */}
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}