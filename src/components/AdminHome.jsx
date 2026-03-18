import React from 'react';
import './AdminHome.css';

export default function AdminHome({ onBack, onSelectProducts, onViewOrders, onManageProducts }) {
  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            {/* Capa + Logo */}
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
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
              PAINEL ADMINISTRATIVO
            </h2>

            {/* Botões */}
            <div className="d-grid gap-3 mb-4 ch-btn-group">
              <button
                className="ch-btn"
                onClick={onSelectProducts}
              >
                SELECIONAR PRODUTOS
              </button>
              <button
                className="ch-btn"
                onClick={onViewOrders}
              >
                VER PEDIDOS
              </button>
              <button
                className="ch-btn"
                onClick={onManageProducts}
              >
                GERENCIAR PRODUTOS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo SICOOB */}
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>
    </div>
  );
}
