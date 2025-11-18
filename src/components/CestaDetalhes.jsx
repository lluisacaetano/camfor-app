import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CestaDetalhes.css';

export default function CestaDetalhes({ size, onClose, onFinish }) {
  // exemplo de produtos disponíveis — substitua por dados reais quando tiver
  const produtos = [
    'Tomate',
    'Cenoura',
    'Alface',
    'Batata',
    'Cebola',
    'Ovo (dúzia)',
    'Queijo',
    'Pão caseiro',
    'Mel',
    'Abóbora',
    'Maçã',
    'Banana',
    'Pepino',
    'Feijão',
    'Arroz',
    'Farinha',
    'Leite',
    'Manteiga'
  ];

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

            {/* Listagem de produtos */}
            <ul className="cd-list">
              {produtos.map((p, idx) => (
                <li key={idx} className="cd-item">{p}</li>
              ))}
            </ul>

            {/* Finalizar pedido */}
            <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
              <button 
                className="ch-btn"
                onClick={() => {
                  // ação mínima: notificar e voltar (ajuste conforme fluxo real)
                  alert('Pedido finalizado! Obrigado.');
                  onFinish && onFinish();
                }}
              >
                FINALIZAR PEDIDO
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* logo sicoob no final (mantém estética) */}
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
