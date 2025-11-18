import React, { useState, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ResumoPedido.css';

export default function ResumoPedido({
  order = {},
  cart = [],             
  totalPrice = null,     
  onBack,
  onConfirm,
  onFinalize
}) {
  const [payment, setPayment] = useState('pix');
  const [needChange, setNeedChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');

  const prices = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('camfor_prices')) || {10:0,15:0,18:0};
    } catch { return {10:0,15:0,18:0}; }
  }, []);

  const formatBRL = v => {
    try { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    catch { return 'R$ 0,00'; }
  };

  // Normaliza os itens do pedido em linhas para exibição
  const orderLines = useMemo(() => {
    const lines = [];

    // 1) itens avulsos do MontarCesta
    if (Array.isArray(cart) && cart.length) {
      for (let i = 0; i < cart.length; i++) {
        const it = cart[i];
        lines.push({
          key: `item${i}`,
          title: it.name || 'Item',
          qty: Number(it.qty || 1),
          unit: Number(it.price || 0),
          total: Number(it.qty || 1) * Number(it.price || 0),
          img: it.img || '/images/placeholder.png'
        });
      }
      return lines;
    }

    // a) Cesta por tamanhos
    if (order.basketCounts && typeof order.basketCounts === 'object') {
      for (const sz of [10, 15, 18]) {
        const qty = Number(order.basketCounts[sz] || 0);
        if (qty > 0) {
          lines.push({
            key: `sz${sz}`,
            title: `Cesta ${sz === 10 ? 'Pequena' : sz === 15 ? 'Média' : 'Grande'}`,
            qty,
            unit: Number(prices[sz] || 0),
            total: qty * Number(prices[sz] || 0),
            img: '/images/cestaCompleta.jpg'
          });
        }
      }
    }
    // b) Single size 
    else if (order.size && Number(order.size) > 0) {
      const sz = Number(order.size);
      const qty = Number(order.quantity || 1);
      lines.push({
        key: `sz${sz}`,
        title: `Cesta ${sz === 10 ? 'Pequena' : sz === 15 ? 'Média' : 'Grande'}`,
        qty,
        unit: Number(prices[sz] || 0),
        total: qty * Number(prices[sz] || 0),
        img: '/images/cestaCompleta.jpg'
      });
    }
    // c) Itens detalhados 
    else if (Array.isArray(order.items) && order.items.length) {
      for (let i = 0; i < order.items.length; i++) {
        const it = order.items[i];
        lines.push({
          key: `item${i}`,
          title: it.name || 'Item',
          qty: Number(it.qty || 1),
          unit: Number(it.price || 0),
          total: Number(it.qty || 1) * Number(it.price || 0),
          img: it.img || '/images/placeholder.png'
        });
      }
    }
    return lines;
  }, [order, prices, cart]);

  const computedTotal = useMemo(() => orderLines.reduce((s, l) => s + (l.total || 0), 0), [orderLines]);

  const displayTotal = totalPrice != null ? Number(totalPrice) : computedTotal;

  const isCartCesta = Array.isArray(cart) && cart.length && totalPrice != null;

  function handleFinalize() {
    if (onFinalize) {
      onFinalize();
      return;
    }
    if (payment === 'cash' && needChange && !changeFor) {
      return;
    }
    onConfirm && onConfirm({ total: computedTotal, payment, changeFor });
  }

  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logo.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">RESUMO DO PEDIDO</h2>

            <div className="rp-section">

              {/* Painel de Pedidos */}
              <div className="rp-order-panel">
                {orderLines.length > 0 ? (
                  <>
                    {orderLines.map(line => (
                      <div key={line.key} className="rp-order-row">
                        <img
                          src={line.img}
                          alt={line.title}
                          className="rp-order-img"
                          onError={e => {
                            const cur = e.currentTarget;
                            const src = cur.src || '';
                            if (src.match(/\.jpg$/i)) cur.src = src.replace(/\.jpg$/i, '.jpeg');
                            else if (src.match(/\.jpeg$/i)) cur.src = src.replace(/\.jpeg$/i, '.jpg');
                            else cur.src = '/images/placeholder.png';
                          }}
                        />
                        <div className="rp-order-info">
                          <div className="rp-order-title">{line.title}</div>
                          <div className="rp-order-meta">Quantidade: {line.qty}</div>
                        </div>
                        {/* Quando vier de MontarCesta (isCartCesta) não mostrar preço por item */}
                        {!isCartCesta && <div className="rp-order-value">{ (line.total && line.total>0) ? formatBRL(line.total) : '—' }</div>}
                      </div>
                    ))}
                    <div className="rp-divider" />
                    <div className="rp-order-total">
                      <div className="rp-order-total-label">Total</div>
                      <div className="rp-order-total-value">{formatBRL(displayTotal)}</div>
                    </div>
                  </>
                ) : (
                  <div className="rp-empty">Nenhum item selecionado.</div>
                )}
              </div>

              <div className="rp-actions">
                <button className="ch-btn mc-finalize-btn" onClick={handleFinalize} disabled={displayTotal <= 0}>FINALIZAR PEDIDO</button>
              </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
