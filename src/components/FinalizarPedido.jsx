import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './FinalizarPedido.css';

export default function FinalizarPedido({ size, onBack, onConfirm, onRetirada, onEntrega }) {
  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            {/* Capa*/}
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Produtos Agricultura Familiar" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logo.png" alt="CAMFOR - Agricultura Familiar" className="ch-logo-img" />
              </div>
            </div>

            {/* Título */}
            <h2 className="ch-title">FINALIZAR PEDIDO</h2>

            {/* Nota */}
            <p className="fp-note">Escolha como prefere receber seu pedido.</p>

            {/* Opções */}
            <div className="d-grid gap-3 mb-4 ch-btn-group fp-options" style={{ marginTop: '18px' }}>
              <button className="ch-btn" onClick={() => onRetirada && onRetirada()}>RETIRADA</button>
              <button className="ch-btn" onClick={() => onEntrega && onEntrega()}>ENTREGA</button>
            </div>

          </div>
        </div>
      </div>

      {/* Logo Sicoob */}
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
