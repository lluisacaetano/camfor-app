import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MontarCesta.css';
import FinalizarPedido from './FinalizarPedido'; 
import Retirada from './Retirada';               
import Entrega from './Entrega';                 

export default function MontarCesta({ onBack }) {
  // Produtos de Exemplos
  const produtosDisponiveis = [
    { id: 'tomate', name: 'Tomate', img: '/images/produtos/tomate.jpg' },
    { id: 'cenoura', name: 'Cenoura', img: '/images/produtos/cenoura.jpg' },
    { id: 'batata', name: 'Batata', img: '/images/produtos/batata.jpg' },
    { id: 'alface', name: 'Alface', img: '/images/produtos/alface.jpeg' },
    { id: 'cebola', name: 'Cebola', img: '/images/produtos/cebola.jpg' },
  ];

  // Quantidades começam em 0
  const [quantidades, setQuantidades] = useState(() =>
    produtosDisponiveis.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  );
  const [cart, setCart] = useState([]);

  const [showFinalize, setShowFinalize] = useState(false);
  const [showRetirada, setShowRetirada] = useState(false);
  const [showEntrega, setShowEntrega] = useState(false);

  const totalCount = cart.reduce((sum, it) => sum + (it.qty || 0), 0);
  const allowedTotals = [10, 15, 18];
  const canFinalize = allowedTotals.includes(totalCount);

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

  // Fluxo: se usuário já escolheu finalizar, renderiza as telas correspondentes
  if (showRetirada) {
    return (
      <Retirada
        size={totalCount}
        onBack={() => setShowRetirada(false)}
        onFinish={() => {
          alert('Finalizado com sucesso (Retirada). Obrigado.');
          onBack && onBack();
        }}
      />
    );
  }

  if (showEntrega) {
    return (
      <Entrega
        size={totalCount}
        onBack={() => setShowEntrega(false)}
        onFinish={() => {
          alert('Finalizado com sucesso (Entrega). Obrigado.');
          onBack && onBack();
        }}
      />
    );
  }

  if (showFinalize) {
    return (
      <FinalizarPedido
        size={totalCount}
        onBack={() => setShowFinalize(false)}
        onRetirada={() => { setShowFinalize(false); setShowRetirada(true); }}
        onEntrega={() => { setShowFinalize(false); setShowEntrega(true); }}
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
                  <img className="mc-prod-img" src={prod.img} alt={prod.name} onError={(e)=>{e.currentTarget.src='/images/placeholder.png'}} />
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

            {/* Carrinho */}
            <h3 className="mc-cart-title">Carrinho</h3>
            <div className="mc-cart">
              {cart.length === 0 && <div className="mc-empty">Carrinho vazio</div>}
              {cart.map(item => (
                <div className="mc-cart-item" key={item.id}>
                  <img className="mc-cart-img" src={item.img} alt={item.name} onError={(e)=>{e.currentTarget.src='/images/placeholder.png'}} />
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
              <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                Pedidos só podem ser finalizados com exatamente {allowedTotals.join(', ')} itens.
              </div>
            </div>
+
            {/* Botão */}
            <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '10px' }}>
              <button
                className="ch-btn mc-finalize-btn"
                disabled={!canFinalize}
                onClick={() => {
                  if (!canFinalize) return;
                  setShowFinalize(true);
                }}
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
