import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CestaDetalhes.css';
import FinalizarPedido from './FinalizarPedido';
import Retirada from './Retirada';
import Entrega from './Entrega'; 

export default function CestaDetalhes({ size, onClose, onFinish }) {
  const [showFinalize, setShowFinalize] = useState(false);
  const [showRetirada, setShowRetirada] = useState(false);
  const [showEntrega, setShowEntrega] = useState(false); 

  // Produtos
  const produtos = [
    'Tomate',
    'Cenoura',
    'Alface',
    'Batata',
    'Cebola'
  ];

  // Finalizar Pedido
  if (showRetirada) {
    return (
      <Retirada
        size={size}
        onBack={() => setShowRetirada(false)}
        onFinish={() => {
          alert('Finalizado com sucesso (Retirada). Obrigado.');
          onFinish && onFinish();
        }}
      />
    );
  }

  if (showEntrega) {
    return (
      <Entrega
        size={size}
        onBack={() => setShowEntrega(false)}
        onFinish={() => {
          alert('Finalizado com sucesso (Entrega). Obrigado.');
          onFinish && onFinish();
        }}
      />
    );
  }

  if (showFinalize) {
    return (
      <FinalizarPedido
        size={size}
        onBack={() => setShowFinalize(false)}
        onRetirada={() => setShowRetirada(true)}
        onEntrega={() => setShowEntrega(true)} 
      />
    );
  }

  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            {/* Capa + Logo */}
            <div className="ch-cover-wrapper">
              <button 
                className="cc-back" 
                onClick={onClose}
                aria-label="Voltar"
              >
                ←
              </button>

              <div className="ch-cover-inner">
                <img 
                  src="/images/capa.jpg" 
                  alt="Produtos Agricultura Familiar"
                  className="ch-cover-img"
                />
              </div>

              <div className="ch-logo">
                <img 
                  src="/images/logo.png" 
                  alt="CAMFOR - Agricultura Familiar"
                  className="ch-logo-img"
                />
              </div>
            </div>

            {/* Título */}
            <h2 className="ch-title">ITENS DISPONÍVEIS</h2>
            <div className="cd-subtitle">CESTA DE {size} ITENS</div>

            {/* Observação */}
            <p className="cd-note">
              Observação: os itens serão selecionados de forma aleatória conforme a quantidade escolhida ({size}) — a lista abaixo mostra todos os produtos possíveis.
            </p>

            {/* Listagem de Produtos*/}
            <ul className="cd-list">
              {produtos.map((p, idx) => {
                let triedJpeg = false;
                const imgId = p
                  .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
                  .toLowerCase().replace(/[^a-z0-9]/g, ''); 
                const imgSrc = `/images/produtos/${imgId}.jpg`;
                return (
                  <li key={idx} className="cd-item">
                    <img
                      src={imgSrc}
                      alt={p}
                      className="cd-prod-img"
                      onError={e => {
                        if (!triedJpeg) {
                          e.currentTarget.src = `/images/produtos/${imgId}.jpeg`;
                          triedJpeg = true;
                        } else {
                          e.currentTarget.src = '/images/placeholder.png';
                        }
                      }}
                    />
                    <span className="cd-prod-name">{p}</span>
                  </li>
                );
              })}
            </ul>

            {/* Nota sobre Quantidade */}
            <div className="cd-note" style={{ marginBottom: 8 }}>
              Obs: A quantidade de cada produto varia de 200g a 500g.
            </div>

            {/* Finalizar Pedido */}
            <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
              <button 
                className="ch-btn"
                onClick={() => setShowFinalize(true)}
              >
                FINALIZAR PEDIDO
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Logo Sicoob */}
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
