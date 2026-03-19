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
import AdminProdutos from './AdminProdutos';
import { subscribeToAdminConfig } from '../services/firestoreService';
import { isStoreOpen, isWithinBusinessHours, wasConfigUpdatedToday } from '../utils/storeHours';

export default function CamforHome() {
  const [showCesta, setShowCesta] = useState(false);
  const [showMontar, setShowMontar] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminHome, setShowAdminHome] = useState(false);
  const [showAdminCesta, setShowAdminCesta] = useState(false);
  const [showAdminPedidos, setShowAdminPedidos] = useState(false);
  const [showAdminProdutos, setShowAdminProdutos] = useState(false);

  const [adminConfig, setAdminConfig] = useState(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [isOpenTime, setIsOpenTime] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);

  // Escuta configuração do admin em tempo real do Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAdminConfig((config) => {
      try {
        setAdminConfig(config);
      } catch (e) {
        setAdminConfig(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Verifica se a loja está aberta (atualiza a cada minuto)
  useEffect(() => {
    function checkStoreStatus() {
      const open = isStoreOpen(adminConfig);
      setStoreOpen(open);
      setIsOpenTime(isWithinBusinessHours());

      // Verifica se tem produtos configurados hoje
      const configOk = adminConfig &&
        adminConfig.selectedItems &&
        adminConfig.selectedItems.length > 0 &&
        wasConfigUpdatedToday(adminConfig.updatedAt);
      setHasProducts(configOk);
    }

    checkStoreStatus();
    const id = setInterval(checkStoreStatus, 60 * 1000);
    return () => clearInterval(id);
  }, [adminConfig]);

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
      onManageProducts={() => {
        setShowAdminHome(false);
        setShowAdminProdutos(true);
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
  if (showAdminProdutos) {
    return <AdminProdutos
      onBack={() => {
        setShowAdminProdutos(false);
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
                disabled={!storeOpen}
              >
                PEDIR CESTA COMPLETA
              </button>
              <button className="ch-btn" onClick={() => setShowMontar(true)} disabled={!storeOpen}>MONTAR MINHA CESTA</button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay LOJA FECHADA - mostra se fora do horário OU se admin não configurou produtos */}
      {!storeOpen && (
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

      {/* Logos SICOOB e IFMG */}
      <div className="ch-logos-bottom">
        <img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" />
        <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
      </div>
    </div>
  );
}