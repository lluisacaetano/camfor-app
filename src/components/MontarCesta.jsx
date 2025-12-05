import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MontarCesta.css';
import FinalizarPedido from './FinalizarPedido';
import Retirada from './Retirada';
import Entrega from './Entrega';
import ResumoPedido from './ResumoPedido';

export default function MontarCesta({ onBack }) {
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [prices, setPrices] = useState({10:0,15:0,18:0});

  useEffect(() => {
    function clearAdminConfig() {
      localStorage.removeItem('camfor_selected_items');
      localStorage.removeItem('camfor_prices');
    }
    function performDailyResetIfNeeded() {
      try {
        const now = new Date();
        const today = now.toISOString().slice(0,10);
        const lastReset = localStorage.getItem('camfor_last_reset');
        // reset diário às 17:00 (fechamento centralizado na home)
        if (now.getHours() >= 17 && lastReset !== today) {
          clearAdminConfig();
          localStorage.setItem('camfor_last_reset', today);
        }
      } catch (e) { console.warn(e); }
    }
    function refresh() {
      performDailyResetIfNeeded();
      try {
        const rawItems = localStorage.getItem('camfor_selected_items');
        const rawPrices = localStorage.getItem('camfor_prices');
        if (rawItems) {
          const items = JSON.parse(rawItems);
          const mapped = items.map(name => {
            const id = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return { id, name, img: `/images/produtos/${id}.jpg` };
          });
          if (mapped.length) setProdutosDisponiveis(mapped);
        }
        if (rawPrices) setPrices(JSON.parse(rawPrices));
      } catch (e) { console.warn(e); }
    }
    refresh();
    const id = setInterval(refresh, 60*1000);
    return () => clearInterval(id);
  }, []);

  // Quantidades começam vazias
  const [quantidades, setQuantidades] = useState({});

  useEffect(() => {
    if (!produtosDisponiveis || produtosDisponiveis.length === 0) {
      setQuantidades({});
      return;
    }
    setQuantidades(prev => {
      const map = produtosDisponiveis.reduce((acc, p) => ({ ...acc, [p.id]: prev[p.id] || 0 }), {});
      return map;
    });
  }, [produtosDisponiveis]);

  const [cart, setCart] = useState([]);

  const [prevView, setPrevView] = useState(null);

  const [showFinalize, setShowFinalize] = useState(false);
  const [showRetirada, setShowRetirada] = useState(false);
  const [showEntrega, setShowEntrega] = useState(false);
  const [showResumo, setShowResumo] = useState(false); 

  const totalCount = cart.reduce((sum, it) => sum + (it.qty || 0), 0);
  const allowedTotals = [10, 15, 18];
  const finalPrice = allowedTotals.includes(totalCount) ? (prices[totalCount] || 0) : null;

  const storeClosed = produtosDisponiveis.length === 0;

  // Incrementa quantidade e atualiza carrinho automaticamente
  function handleIncrement(prod) {
    setQuantidades(q => {
      const current = q[prod.id] || 0;
      if (current >= 3) return q; // Limita a 3 
      const nextQty = current + 1;
      // Atualiza o carrinho
      setCart(prev => {
        const exists = prev.find(i => i.id === prod.id);
        if (exists) {
          return prev.map(i => i.id === prod.id ? { ...i, qty: nextQty } : i);
        }
        return [...prev, { ...prod, qty: nextQty }];
      });
      return { ...q, [prod.id]: nextQty };
    });
  }

  // Decrementa e remove do carrinho se chegar a 0
  function handleDecrement(prod) {
    setQuantidades(q => {
      const current = q[prod.id] || 0;
      const nextQty = Math.max(0, current - 1);
      setCart(prev => {
        const exists = prev.find(i => i.id === prod.id);
        if (!exists) return prev;
        if (nextQty === 0) {
          return prev.filter(i => i.id !== prod.id);
        }
        return prev.map(i => i.id === prod.id ? { ...i, qty: nextQty } : i);
      });
      return { ...q, [prod.id]: nextQty };
    });
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
    setQuantidades(q => ({ ...q, [id]: 0 }));
  }

  function updateCartQty(id, value) {
    const num = Number(value);
    const v = Number.isNaN(num) ? 0 : Math.min(3, Math.max(0, Math.floor(num)));
    if (v <= 0) {
      // Remove do carrinho e zera quantidade
      setCart(prev => prev.filter(i => i.id !== id));
      setQuantidades(q => ({ ...q, [id]: 0 }));
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: v } : i));
    setQuantidades(q => ({ ...q, [id]: v }));
  }

  if (showRetirada) {
    return (
      <Retirada
        size={totalCount}
        onBack={() => {
          setShowRetirada(false);
          // restaura para a view anterior (resumo ou finalize)
          if (prevView === 'finalize') setShowFinalize(true);
          else if (prevView === 'resumo') setShowResumo(true);
          setPrevView(null);
        }}
        onFinish={() => {
          // finalizar => volta ao home
          onBack && onBack();
        }}
      />
    );
  }

  if (showEntrega) {
    return (
      <Entrega
        size={totalCount}
        totalPrice={finalPrice || 0}
        onBack={() => {
          setShowEntrega(false);
          if (prevView === 'finalize') setShowFinalize(true);
          else if (prevView === 'resumo') setShowResumo(true);
          setPrevView(null);
        }}
        onFinish={() => {
          onBack && onBack();
        }}
      />
    );
  }

  // Renderizar ResumoPedido antes de FinalizarPedido
  if (showResumo) {
    return (
      <ResumoPedido
        cart={cart}
        size={totalCount}
        totalPrice={finalPrice}
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
        size={totalCount}
        // voltar de Finalizar -> mostrar Resumo
        onBack={() => { setShowFinalize(false); setShowResumo(true); }}
        onRetirada={() => { setPrevView('finalize'); setShowFinalize(false); setShowRetirada(true); }}
        onEntrega={() => { setPrevView('finalize'); setShowFinalize(false); setShowEntrega(true); }}
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
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logo.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">MONTAR MINHA CESTA</h2>

            {/* Lista de Produtos */}
            <div className="mc-list">
              {produtosDisponiveis.map(prod => (
                <div className="mc-item" key={prod.id}>
                  <img
                    className="mc-prod-img"
                    src={prod.img}
                    alt={prod.name}
                    onError={e => {
                      const cur = e.currentTarget;
                      const src = cur.src || '';
                      if (src.match(/\.jpg$/i)) {
                        cur.src = src.replace(/\.jpg$/i, '.png');
                      } else if (src.match(/\.jpeg$/i)) {
                        cur.src = src.replace(/\.jpeg$/i, '.png');
                      } else if (src.match(/\.png$/i)) {
                        cur.src = '/images/placeholder.png';
                      } else {
                        cur.src = '/images/placeholder.png';
                      }
                    }}
                  />
                  <div className="mc-prod-info">
                    <div className="mc-prod-name">{prod.name}</div>
                    <div className="mc-controls">
                      <div className="mc-qty-wrap">
                        <button className="mc-plus-btn" onClick={() => handleDecrement(prod)}>-</button>
                        <div className="mc-qty-display">{quantidades[prod.id] || 0}</div>
                        <button
                          className="mc-plus-btn"
                          onClick={() => handleIncrement(prod)}
                          disabled={(quantidades[prod.id] || 0) >= 3}
                          title={(quantidades[prod.id] || 0) >= 3 ? 'Máximo 3 unidades' : ''}
                        >
                          +
                        </button>
                      </div>
                       {/* Remover */}
                       <button className="mc-remove-btn" onClick={() => removeFromCart(prod.id)} aria-label="Remover">🗑️</button>
                     </div>
                   </div>
                </div>
              ))}
            </div>

            {/* Nota sobre Quantidade */}
            <div className="cd-note">
              Obs: A quantidade de cada produto varia de 200g a 500g.
            </div>

            {/* Carrinho */}
            <h3 className="mc-cart-title">Carrinho</h3>
            <div className="mc-cart">
              {cart.length === 0 && <div className="mc-empty">Carrinho vazio</div>}
              {cart.map(item => (
                <div className="mc-cart-item" key={item.id}>
                  <img
                    className="mc-cart-img"
                    src={item.img}
                    alt={item.name}
                    onError={e => {
                      const cur = e.currentTarget;
                      const src = cur.src || '';
                      if (src.match(/\.jpg$/i)) {
                        cur.src = src.replace(/\.jpg$/i, '.png');
                      } else if (src.match(/\.jpeg$/i)) {
                        cur.src = src.replace(/\.jpeg$/i, '.png');
                      } else if (src.match(/\.png$/i)) {
                        cur.src = '/images/placeholder.png';
                      } else {
                        cur.src = '/images/placeholder.png';
                      }
                    }}
                  />
                  <div className="mc-cart-name">{item.name}</div>
                  <input
                    className="mc-cart-qty"
                    type="number"
                    min="0"
                    max="3"
                    value={item.qty}
                    onChange={(e) => updateCartQty(item.id, e.target.value)}
                  />
                  <button className="mc-remove-btn" onClick={() => removeFromCart(item.id)}>🗑️</button>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="mc-cart-summary" style={{ marginTop: '14px', textAlign: 'center', color: 'rgba(255,255,255,0.95)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Total: {totalCount} itens</div>
              {storeClosed ? (
                <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>Loja fechada</div>
              ) : finalPrice !== null ? (
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Valor final: {Number(finalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              ) : (
                <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  Para finalizar, a quantidade deve ser exatamente 10, 15 ou 18 itens.
                </div>
              )}
            </div>

            {/* Botão finalizar pedido */}
            <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '10px' }}>
              <button
                className="ch-btn mc-finalize-btn"
                disabled={storeClosed || !allowedTotals.includes(totalCount)}
                onClick={() => {
                  if (storeClosed || !allowedTotals.includes(totalCount)) return;
                  setShowResumo(true); // abre ResumoPedido
                }}
              >
                RESUMO DO PEDIDO
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
