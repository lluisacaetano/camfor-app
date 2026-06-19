import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { IoSettingsSharp, IoBasketOutline, IoTimeOutline, IoStorefrontOutline } from 'react-icons/io5';
import './CamforHome.css';
import Loading from './Loading';
import LoginModal from './LoginModal';

import { subscribeToAdminConfig, clearAdminConfig } from '../services/firestoreService';
import { isStoreOpen, isWithinBusinessHours, isConfigValidForToday, shouldClearItems, getClosingHourForToday } from '../utils/storeHours';

export default function CamforHome() {
  const navigate = useNavigate();

  const [adminConfig, setAdminConfig] = useState(null);
  // Só decide o que mostrar (loja aberta/fechada) depois da 1ª verificação,
  // evitando o "flash" do modal de loja fechada ao abrir o site.
  const [ready, setReady] = useState(false);
  // Contador para reavaliar o status (horário) a cada minuto.
  const [, setTick] = useState(0);
  // Modal de login (admin) — abre por cima em vez de navegar.
  const [showLogin, setShowLogin] = useState(false);

  // Escuta configuração do admin em tempo real do Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAdminConfig((config) => {
      try {
        setAdminConfig(config);
      } catch (e) {
        setAdminConfig(null);
      }
      setReady(true);
    });
    // Fallback: nunca trava no carregando por mais de 4s
    const t = setTimeout(() => setReady(true), 4000);
    return () => { unsubscribe(); clearTimeout(t); };
  }, []);

  // Limpa itens antigos (config do dia anterior) quando necessário
  useEffect(() => {
    if (shouldClearItems(adminConfig)) {
      clearAdminConfig().catch((e) => console.error('Erro ao limpar config antiga:', e));
    }
  }, [adminConfig]);

  // Reavalia o status (horário) a cada minuto
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Status derivado SINCRONAMENTE no render (sem lag de efeito) — assim,
  // assim que a config chega, já sabemos se a loja está aberta, sem flash.
  const storeOpen = ready && isStoreOpen(adminConfig);
  const isOpenTime = isWithinBusinessHours();
  const hasProducts = !!(
    adminConfig &&
    adminConfig.selectedItems &&
    adminConfig.selectedItems.length > 0 &&
    isConfigValidForToday(adminConfig.updatedAt)
  );

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
    setFavicon('/images/logoEmblema.png');
  }, []);

  // Enquanto verifica a configuração da loja, mostra o carregando
  if (!ready) {
    return <Loading message="Carregando..." />;
  }

  return (
    <div className="ch-root">
      {/* Administrador */}
      <button
        className="admin-gear"
        onClick={() => setShowLogin(true)}
        aria-label="Admin"
        title="Configurações"
      >
        <IoSettingsSharp size={22} />
      </button>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setShowLogin(false); navigate('/admin/painel'); }}
        />
      )}

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            {/* Capa + Logo */}
            <div className="ch-cover-wrapper">
              <div className="ch-cover-inner">
                <img
                  src="/images/capa.png"
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

            {/* Conteúdo */}
            <div className="ch-content">
              <div className="ch-eyebrow">Agricultura Familiar</div>
              <h1 className="ch-title">Escolha o seu tipo de pedido</h1>
              <div className="ch-rule" />

              {storeOpen && (
                <div className="ch-status">
                  <span className="ch-dot" /> Loja aberta · atende até {getClosingHourForToday()}h
                </div>
              )}

              <p className="ch-lead">
                Produtos frescos, colhidos por produtores da cooperativa.
                Monte do seu jeito ou peça a cesta completa da semana.
              </p>

              <div className="ch-cta-group">
                <button
                  className="ch-btn ch-btn-primary"
                  onClick={() => navigate('/cesta')}
                  disabled={!storeOpen}
                >
                  <IoBasketOutline size={20} /> Pedir cesta completa
                </button>
                <button
                  className="ch-btn ch-btn-primary"
                  onClick={() => navigate('/montar')}
                  disabled={!storeOpen}
                >
                  <IoBasketOutline size={20} /> Montar minha cesta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay LOJA FECHADA - mostra se fora do horário OU se admin não configurou produtos */}
      {!storeOpen && (
        <div className="ch-closed-backdrop" role="dialog" aria-modal="true">
          <div className="ch-closed-modal">
            <div className="ch-closed-icon">
              {isOpenTime && !hasProducts ? <IoTimeOutline /> : <IoStorefrontOutline />}
            </div>

            <div className="ch-closed-title">
              {!isOpenTime ? 'Loja fechada' : 'Aguarde'}
            </div>

            <p className="ch-closed-sub">
              {!isOpenTime
                ? 'Estamos fora do horário de pedidos online.'
                : 'Os produtos do dia ainda não foram configurados.'}
            </p>

            <div className="ch-hours-card">
              <div className="ch-hours-eyebrow">Horário para pedidos online</div>
              <div className="ch-hours-row"><span>Segunda a quinta</span><span>07:00 – 17:00</span></div>
              <div className="ch-hours-row"><span>Sexta-feira</span><span>07:00 – 16:00</span></div>
              <div className="ch-hours-row"><span>Sábado e domingo</span><span className="ch-hours-closed">Fechado</span></div>
            </div>

            <p className="ch-closed-note">
              {!isOpenTime
                ? 'Por favor, retorne no horário de funcionamento.'
                : 'Por favor, aguarde o administrador liberar os pedidos.'}
            </p>
          </div>
        </div>
      )}

      {/* Logos SICOOB e IFMG */}
      <div className="ch-apoio-eyebrow">Apoio</div>
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