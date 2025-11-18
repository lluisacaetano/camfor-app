import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CamforHome.css';

import CestaDetalhes from './CestaDetalhes';
import MontarCesta from './MontarCesta';
import AdminCesta from './AdminCesta';

export default function CamforHome() {
  const [showCesta, setShowCesta] = useState(false);
  const [showMontar, setShowMontar] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

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
      return h >= 7 && h < 24; // loja aberta 07:00 - 17:00
    }
    function refreshMain() {
      performDailyResetIfNeeded();
      setIsOpenTime(checkBusinessHours());
      try {
        const rawItems = localStorage.getItem('camfor_selected_items');
        setHasProducts(rawItems ? (JSON.parse(rawItems).length > 0) : false);
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
    setFavicon('/images/logo.png');
  }, []);

  if (showCesta) {
    return <CestaDetalhes onClose={() => setShowCesta(false)} onFinish={() => setShowCesta(false)} />;
  }
  if (showMontar) {
    return <MontarCesta onBack={() => setShowMontar(false)} />;
  }
  if (showAdmin) {
    return <AdminCesta onBack={() => setShowAdmin(false)} />;
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09c0-.65-.39-1.24-1-1.51a1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 112.27 16.9l.06-.06c.49-.49.55-1.2.33-1.82A1.65 1.65 0 002 13.5H2a2 2 0 110-4h.09c.65 0 1.24-.39 1.51-1a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 016.1 2.27l.06.06c.49.49 1.2.55 1.82.33.6-.26 1.2-.95 1-1.51V2a2 2 0 114 0v.09c0 .65.39 1.24 1 1.51.62.22 1.33.16 1.82-.33l.06-.06A2 2 0 1121.73 7.1l-.06.06c-.22.62-.16 1.33.33 1.82.62.62.95 1.5.33 1.82h-.01c-.6.26-1.2.95-1 1.51V12a2 2 0 110 4v-.01z" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
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
                  src="/images/logo.png" 
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

      {/* Overlay LOJA FECHADA (backdrop escuro + modal branco) */}
      {!isOpenTime && (
        <div className="ch-closed-backdrop" role="dialog" aria-modal="true">
          <div className="ch-closed-modal">
            <div className="ch-closed-title">LOJA FECHADA</div>
            <div className="ch-closed-hours"><strong>Horário de Funcionamento da Loja:</strong> </div>
            <div className="ch-closed-hours"> 07:00 às 17:00</div>
            <div className="ch-closed-hours"><strong>Horário de Entregas:</strong> 07:00 às 16:00</div>
            <div className="ch-closed-note">Por favor, retorne no horário de funcionamento.</div>
          </div>
        </div>
      )}

      {/* Logo SICOOB */}
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}