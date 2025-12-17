import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../supabaseCliente'; // <--- Import Supabase
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
  const [hasProducts, setHasProducts] = useState(false); // <--- Controlado pelo Supabase agora

  useEffect(() => {
    // Verifica horário de funcionamento (07:00 - 23:59 para teste, ajuste conforme necessidade)
    function checkBusinessHours() {
      const h = new Date().getHours();
      return h >= 0 && h < 24;
    }

    // --- NOVA LÓGICA: Verificar no Supabase se tem produtos ---
    async function checkStoreStatus() {
      setIsOpenTime(checkBusinessHours());

      try {
        const { data, error } = await supabase
            .from('store_config')
            .select('active_products')
            .eq('id', 1)
            .single();

        if (error) throw error;

        // Se o array de produtos existir e tiver itens, libera a loja
        if (data && data.active_products && data.active_products.length > 0) {
          setHasProducts(true);
        } else {
          setHasProducts(false);
        }
      } catch (e) {
        console.warn('Erro ao verificar status da loja:', e);
        // Em caso de erro de conexão, assume fechado ou mantém estado anterior
        setHasProducts(false);
      }
    }

    checkStoreStatus();

    // Atualiza a cada 60s para refletir mudanças do admin sem refresh
    const id = setInterval(checkStoreStatus, 60000);
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
        {/* Botão Admin (Engrenagem) */}
        <button
            className="admin-gear"
            onClick={() => setShowAdmin(true)}
            aria-label="Admin"
            title="Configurações"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09c0-.65-.39-1.24-1-1.51a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 112.27 16.9l.06-.06c.49-.49.55-1.2.33-1.82A1.65 1.65 0 002 13.5H2a2 2 0 110-4h.09c.65 0 1.24-.39 1.51-1a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 016.1 2.27l.06.06c.49.49 1.2.55 1.82.33.6-.26 1.2-.95 1-1.51V2a2 2 0 114 0v.09c0 .65.39 1.24 1 1.51.62.22 1.33.16 1.82-.33l.06-.06A2 2 0 1121.73 7.1l-.06.06c-.22.62-.16 1.33.33 1.82.62.62.95 1.5.33 1.82h-.01c-.6.26-1.2.95-1 1.51V12a2 2 0 110 4v-.01z" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">

              <div className="ch-cover-wrapper">
                <div className="ch-cover-inner">
                  <img src="/images/capa.jpg" alt="Produtos Agricultura Familiar" className="ch-cover-img" />
                </div>
                <div className="ch-logo">
                  <img src="/images/logo.png" alt="CAMFOR - Agricultura Familiar" className="ch-logo-img" />
                </div>
              </div>

              <h2 className="ch-title">ESCOLHA O TIPO DE PEDIDO</h2>

              <div className="d-grid gap-3 mb-4 ch-btn-group">
                <button
                    className="ch-btn"
                    onClick={() => setShowCesta(true)}
                    disabled={!isOpenTime || !hasProducts}
                >
                  PEDIR CESTA COMPLETA
                </button>
                <button
                    className="ch-btn"
                    onClick={() => setShowMontar(true)}
                    disabled={!isOpenTime || !hasProducts}
                >
                  MONTAR MINHA CESTA
                </button>
              </div>
            </div>
          </div>
        </div>

        {!isOpenTime && (
            <div className="ch-closed-backdrop">
              <div className="ch-closed-modal">
                <div className="ch-closed-title">LOJA FECHADA</div>
                <div className="ch-closed-hours">07:00 às 17:00</div>
              </div>
            </div>
        )}

        <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
      </div>
  );
}