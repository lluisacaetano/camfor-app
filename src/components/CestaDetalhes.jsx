import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CestaDetalhes.css';
import FinalizarPedido from './FinalizarPedido';
import Retirada from './Retirada';
import Entrega from './Entrega';
import ResumoPedido from './ResumoPedido'; 

export default function CestaDetalhes({ onClose, onFinish }) {
  const [showFinalize, setShowFinalize] = useState(false);
  const [showRetirada, setShowRetirada] = useState(false);
  const [showEntrega, setShowEntrega] = useState(false);
  const [showResumo, setShowResumo] = useState(false);
  const [prevView, setPrevView] = useState(null);

  const [produtos, setProdutos] = useState([]);
  const [prices, setPrices] = useState({10:0,15:0,18:0});
  const [isOpenTime, setIsOpenTime] = useState(false);

  const [basketCounts, setBasketCounts] = useState({10:0,15:0,18:0});

  // Verifica horário (07:00-16:00) e reset diário às 16:00
  function checkBusinessHours() {
    const h = new Date().getHours();
    return h >= 7 && h < 16;
  }
  function clearAdminConfig() {
    localStorage.removeItem('camfor_selected_items');
    localStorage.removeItem('camfor_prices');
  }
  function performDailyResetIfNeeded() {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0,10);
      const lastReset = localStorage.getItem('camfor_last_reset');
      if (now.getHours() >= 16 && lastReset !== today) {
        clearAdminConfig();
        localStorage.setItem('camfor_last_reset', today);
      }
    } catch (e) { console.warn(e); }
  }

  // Carrega config/admin e agenda refresh periódico
  useEffect(() => {
    function refresh() {
      performDailyResetIfNeeded();
      try {
        const rawItems = localStorage.getItem('camfor_selected_items');
        const rawPrices = localStorage.getItem('camfor_prices');
        setProdutos(rawItems ? JSON.parse(rawItems) : []);
        setPrices(rawPrices ? JSON.parse(rawPrices) : {10:0,15:0,18:0});
      } catch (e) {
        setProdutos([]);
        setPrices({10:0,15:0,18:0});
      }
      setIsOpenTime(checkBusinessHours());
    }
    refresh();
    const id = setInterval(refresh, 60*1000);
    return () => clearInterval(id);
  }, []);

  function updateBasketCount(size, value) {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    setBasketCounts(b => ({ ...b, [size]: v }));
  }
  function removeBasket(size) {
    setBasketCounts(b => ({ ...b, [size]: 0 }));
  }

  const totalBaskets = (basketCounts[10]||0) + (basketCounts[15]||0) + (basketCounts[18]||0);
  const totalValue = (basketCounts[10]||0) * (prices[10]||0) + (basketCounts[15]||0) * (prices[15]||0) + (basketCounts[18]||0) * (prices[18]||0);

  // Pode finalizar se pelo menos 1 cesta e preços configurados para as selecionadas, e loja aberta
  function canFinalize() {
    if (!isOpenTime) return false;
    if (totalBaskets === 0) return false;
    for (const sz of [10,15,18]) {
      if ((basketCounts[sz]||0) > 0 && !(prices[sz] && prices[sz] > 0)) return false;
    }
    return true;
  }

  if (showRetirada) {
    return (
      <Retirada
        size={null}
        onBack={() => {
          setShowRetirada(false);
          if (prevView === 'finalize') setShowFinalize(true);
          else if (prevView === 'resumo') setShowResumo(true);
          setPrevView(null);
        }}
        onFinish={() => { onFinish && onFinish(); }}
      />
    );
  }
  if (showEntrega) {
    return (
      <Entrega
        size={null}
        onBack={() => {
          setShowEntrega(false);
          if (prevView === 'finalize') setShowFinalize(true);
          else if (prevView === 'resumo') setShowResumo(true);
          setPrevView(null);
        }}
        onFinish={() => { onFinish && onFinish(); }}
      />
    );
  }

  // Mostra o Resumo do Pedido antes de Finalizar Pedido
  if (showResumo) {
    return (
      <ResumoPedido
        order={{ basketCounts }}
        totalPrice={totalValue}
        onBack={() => setShowResumo(false)}
        onFinalize={() => { setShowResumo(false); setShowFinalize(true); }}
        onRetirada={() => { setPrevView('resumo'); setShowResumo(false); setShowRetirada(true); }}
        onEntrega={() => { setPrevView('resumo'); setShowResumo(false); setShowEntrega(true); }}
      />
    );
  }

  if (showFinalize) {
    return (
      <FinalizarPedido
        size={totalBaskets || 0}
        onBack={() => { setShowFinalize(false); setShowResumo(true); }}
        onRetirada={() => { setPrevView('finalize'); setShowFinalize(false); setShowRetirada(true); }}
        onEntrega={() => { setPrevView('finalize'); setShowFinalize(false); setShowEntrega(true); }}
      />
    );
  }

  const formatBRL = v => {
    try { return Number(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
    catch { return 'R$ 0,00'; }
  };

  const storeClosed = produtos.length === 0 || !isOpenTime;

  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            {/* Capa + Logo */}
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onClose} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logo.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">ITENS DISPONÍVEIS</h2>

            {/* Valores das cestas */}
            <div className="cd-prices" aria-hidden={storeClosed}>
              <div className="cd-price-item">
                <div className="cd-price-size">10 itens</div>
                <div className="cd-price-value">{prices[10] ? formatBRL(prices[10]) : '—'}</div>
              </div>
              <div className="cd-price-item">
                <div className="cd-price-size">15 itens</div>
                <div className="cd-price-value">{prices[15] ? formatBRL(prices[15]) : '—'}</div>
              </div>
              <div className="cd-price-item">
                <div className="cd-price-size">18 itens</div>
                <div className="cd-price-value">{prices[18] ? formatBRL(prices[18]) : '—'}</div>
              </div>
            </div>

            <p className="cd-note">
            Observação: os itens serão selecionados de forma aleatória conforme o tamanho de cesta escolhida — a lista abaixo mostra todos os produtos disponíveis. </p>

            {storeClosed ? (
              <div style={{ textAlign:'center', color:'#fff', margin:'18px 0' }}>Loja fechada</div>
            ) : (
              <ul className="cd-list">
                {produtos.map((p, idx) => {
                  const imgId = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const imgSrc = `/images/produtos/${imgId}.jpg`;
                  return (
                    <li key={idx} className="cd-item">
                      <img src={imgSrc} alt={p} className="cd-prod-img" onError={e => {
                        const cur = e.currentTarget;
                        if (cur.src.match(/\.jpg$/i)) cur.src = cur.src.replace(/\.jpg$/i, '.jpeg');
                        else cur.src = '/images/placeholder.png';
                      }} />
                      <span className="cd-prod-name">{p}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="cd-note" style={{ marginTop: 8 }}>
             Obs: A quantidade de cada produto varia de 200g a 500g.
            </div>

            {/* Carrinho */}
            <h3 className="mc-cart-title">Carrinho</h3>
            <div className="mc-cart" style={{ marginTop: 8 }}>
              {[10,15,18].map(sz => {
                const qty = basketCounts[sz] || 0;
                return (
                  <div className="mc-cart-item" key={sz} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      className="mc-cart-img"
                      src="/images/cestaCompleta.jpg"
                      alt={`Cesta ${sz}`}
                      onError={e => { e.currentTarget.src = '/images/placeholder.png'; }}
                    />
                    <div className="mc-cart-name">Cesta de {sz} itens</div>

                    <div className="mc-qty-wrap" style={{ marginLeft: 8 }}>
                      <button
                        type="button"
                        className="mc-plus-btn"
                        onClick={() => updateBasketCount(sz, Math.max(0, qty - 1))}
                        disabled={storeClosed}
                        aria-label={`Diminuir cestas ${sz}`}
                      >
                        -
                      </button>
                      <div className="mc-qty-display" aria-live="polite">{qty}</div>
                      <button
                        type="button"
                        className="mc-plus-btn"
                        onClick={() => updateBasketCount(sz, Math.min(99, qty + 1))}
                        disabled={storeClosed}
                        aria-label={`Aumentar cestas ${sz}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="mc-remove-btn"
                      onClick={() => removeBasket(sz)}
                      style={{ marginLeft: 5 }}
                      aria-label={`Remover cesta ${sz}`}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cd-note" style={{ marginTop: 8 }}>
              Total: <strong>{formatBRL(totalValue)}</strong>
            </div>

            <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: 18 }}>
              <button className="ch-btn" onClick={() => setShowResumo(true)} disabled={!canFinalize() || storeClosed}>
                RESUMO DO PEDIDO
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
