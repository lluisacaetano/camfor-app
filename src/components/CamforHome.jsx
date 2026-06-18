import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { IoSettingsSharp } from 'react-icons/io5';
import './CamforHome.css';

import { subscribeToAdminConfig, clearAdminConfig } from '../services/firestoreService';
import { isStoreOpen, isWithinBusinessHours, isConfigValidForToday, shouldClearItems } from '../utils/storeHours';

export default function CamforHome() {
  const navigate = useNavigate();

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
  // Também limpa itens antigos automaticamente
  useEffect(() => {
    async function checkStoreStatus() {
      // Verifica se deve limpar itens antigos (do dia anterior durante horário comercial)
      if (shouldClearItems(adminConfig)) {
        console.log('Limpando itens antigos automaticamente...');
        try {
          await clearAdminConfig();
        } catch (e) {
          console.error('Erro ao limpar config antiga:', e);
        }
        return; // O useEffect será chamado novamente quando a config atualizar
      }

      const open = isStoreOpen(adminConfig);
      setStoreOpen(open);
      setIsOpenTime(isWithinBusinessHours());

      // Verifica se tem produtos configurados (válidos para hoje)
      const configOk = adminConfig &&
        adminConfig.selectedItems &&
        adminConfig.selectedItems.length > 0 &&
        isConfigValidForToday(adminConfig.updatedAt);
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

  return (
    <div className="ch-root">
      {/* Administrador */}
      <button
        className="admin-gear"
        onClick={() => navigate('/admin')}
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
                onClick={() => navigate('/cesta')}
                disabled={!storeOpen}
              >
                PEDIR CESTA COMPLETA
              </button>
              <button className="ch-btn" onClick={() => navigate('/montar')} disabled={!storeOpen}>MONTAR MINHA CESTA</button>
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
                <div className="ch-closed-hours"><strong>Horário para Pedidos Online:</strong></div>
                <div className="ch-closed-hours">Segunda a Quinta: 07:00 às 17:00</div>
                <div className="ch-closed-hours">Sexta-feira: 07:00 às 16:00</div>
                <div className="ch-closed-hours">Sábado e Domingo: Fechado</div>
                <div className="ch-closed-note" style={{ marginTop: 12 }}>Por favor, retorne no horário de funcionamento.</div>
              </>
            ) : (
              <>
                <div className="ch-closed-hours">Os produtos do dia ainda não foram configurados.</div>
                <div className="ch-closed-hours" style={{ marginTop: 12 }}><strong>Horário para Pedidos Online:</strong></div>
                <div className="ch-closed-hours">Segunda a Quinta: 07:00 às 17:00</div>
                <div className="ch-closed-hours">Sexta-feira: 07:00 às 16:00</div>
                <div className="ch-closed-hours">Sábado e Domingo: Fechado</div>
                <div className="ch-closed-note" style={{ marginTop: 12 }}>Por favor, aguarde o administrador liberar os pedidos.</div>
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

      {/* Footer com Copyright */}
      <footer className="ch-footer-bar">
        <div className="ch-footer-content">
          <span className="ch-copyright-text">
            <span className="ch-copyright-symbol">©</span>
            <span className="ch-copyright-year"> 2026</span>
            <span className="ch-copyright-divider">|</span>
            <span className="ch-copyright-names">Desenvolvido por Luisa Caetano Araujo, Júlia Cristina Martins de Almeida Nakano, Maria Eduarda Siqueira Silva e Yasmin Stefane Faria</span>
          </span>
        </div>
      </footer>
    </div>
  );
}