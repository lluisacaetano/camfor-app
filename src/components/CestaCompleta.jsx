import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CestaCompleta.css';

import CestaDetalhes from './CestaDetalhes'; 

export default function CestaCompleta({ onBack }) {
  const [selectedSize, setSelectedSize] = useState(null);

  // Se um tamanho foi escolhido, mostrar a tela de detalhes
  if (selectedSize) {
    return (
      <CestaDetalhes
        size={selectedSize}
        onClose={() => setSelectedSize(null)} 
        onFinish={() => onBack()} 
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
              {/* Botão Voltar */}
              <button 
                className="cc-back" 
                onClick={onBack}
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
            <h2 className="ch-title">
              ESCOLHA UMA OPÇÃO
            </h2>

            {/* Opções de Cestas*/}
            <div className="d-grid gap-3 mb-4 ch-btn-group">
              <button className="ch-btn" onClick={() => setSelectedSize(10)}>CESTA DE 10 ITENS</button>
              <button className="ch-btn" onClick={() => setSelectedSize(15)}>CESTA DE 15 ITENS</button>
              <button className="ch-btn" onClick={() => setSelectedSize(18)}>CESTA DE 18 ITENS</button>
            </div>

          </div>
        </div>
      </div>

      {/* Logo Sicoob */}
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
