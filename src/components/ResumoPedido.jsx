import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ResumoPedido.css';
import Retirada from './Retirada';
import Entrega from './Entrega';
import { IoStorefrontOutline, IoArrowForward } from 'react-icons/io5';
import { MdDeliveryDining } from 'react-icons/md';

function cestaImgForSize(sz) {
  if (sz === 10) return '/images/cesta10itens.png';
  if (sz === 15) return '/images/cesta15itens.png';
  if (sz === 18) return '/images/cesta18itens.png';
  return '/images/cestaCompleta.jpg';
}

export default function ResumoPedido({
  order = {},
  cart = [],
  totalPrice = null,
  prices: propPrices = null,
  onBack,
  cartItems = [],
  isMontarCesta = false,
  size = null,
  onFinish
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const metodo = searchParams.get('metodo');

  const prices = useMemo(() => {
    // Usa os preços passados via prop primeiro
    if (propPrices && typeof propPrices === 'object') {
      return propPrices;
    }
    // Fallback para localStorage
    try {
      return JSON.parse(localStorage.getItem('camfor_prices')) || {10:0,15:0,18:0};
    } catch { return {10:0,15:0,18:0}; }
  }, [propPrices]);

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
            img: cestaImgForSize(sz)
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
        img: cestaImgForSize(sz)
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

  // grava o cart atual para fallback (para garantir que Retirada/Entrega consigam recuperar os itens
  // ao gerar a mensagem de WhatsApp, caso a prop items venha vazia)
  React.useEffect(() => {
    try {
      if (Array.isArray(cart) && cart.length > 0) {
        localStorage.setItem('camfor_last_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('camfor_last_cart');
      }
    } catch (e) {
      // ignore
    }
  }, [cart]);

  return (
    <div className="ch-root">
      <div className="cd-top">
        <div className="ch-cover-wrapper">
          <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
          <div className="ch-cover-inner">
            <img src="/images/capa.png" alt="Capa CAMFOR" className="ch-cover-img" />
          </div>
          <div className="ch-logo">
            <img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" />
          </div>
        </div>
        <div className="ch-content cd-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Resumo do pedido</h2>
          <div className="ch-rule" />
        </div>

        <div className="rp-grid">
          {/* Coluna esquerda — itens do pedido */}
          <div className="rp-main">
            <div className="rp-card">
              {orderLines.length > 0 ? (
                orderLines.map(line => (
                  <div key={line.key} className="rp-row">
                    <img
                      src={line.img}
                      alt={line.title}
                      className="rp-img"
                      onError={e => {
                        const cur = e.currentTarget;
                        const src = cur.src || '';
                        if (src.match(/\.jpg$/i)) {
                          cur.src = src.replace(/\.jpg$/i, '.png');
                        } else if (src.match(/\.jpeg$/i)) {
                          cur.src = src.replace(/\.jpeg$/i, '.png');
                        } else {
                          cur.src = '/images/placeholder.png';
                        }
                      }}
                    />
                    <div className="rp-info">
                      <div className="rp-name">{line.title}</div>
                      <div className="rp-meta">Quantidade: {line.qty}</div>
                    </div>
                    {/* Quando vier de MontarCesta (isCartCesta) não mostrar preço por item */}
                    {!isCartCesta && <div className="rp-val">{(line.total && line.total > 0) ? formatBRL(line.total) : '—'}</div>}
                  </div>
                ))
              ) : (
                <div className="rp-empty">Nenhum item selecionado.</div>
              )}
            </div>
          </div>

          {/* Coluna direita — total + como receber */}
          <div className="rp-aside">
            <div className="rp-panel">
              <div className="rp-total">
                <span className="rp-total-k">Total</span>
                <span className="rp-total-v">{formatBRL(displayTotal)}</span>
              </div>

              <div className="rp-eyebrow rp-eyebrow-method">Como quer receber?</div>

              <button className="rp-opt" onClick={() => setSearchParams({ metodo: 'entrega' })} disabled={displayTotal <= 0}>
                <span className="rp-opt-ic"><MdDeliveryDining size={24} /></span>
                <span className="rp-opt-body">
                  <span className="rp-opt-t">Entrega</span>
                  <span className="rp-opt-d">Receba no seu endereço</span>
                </span>
                <IoArrowForward className="rp-opt-arrow" />
              </button>

              <button className="rp-opt" onClick={() => setSearchParams({ metodo: 'retirada' })} disabled={displayTotal <= 0}>
                <span className="rp-opt-ic"><IoStorefrontOutline size={21} /></span>
                <span className="rp-opt-body">
                  <span className="rp-opt-t">Retirada</span>
                  <span className="rp-opt-d">Retire no ponto da cooperativa</span>
                </span>
                <IoArrowForward className="rp-opt-arrow" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ch-apoio-eyebrow">Apoio</div>
      <div className="ch-logos-bottom">
        <img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" />
        <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
      </div>

      {metodo === 'retirada' && (
        <Retirada
          cartItems={cartItems}
          totalPrice={displayTotal}
          isMontarCesta={isMontarCesta}
          size={size}
          onBack={() => setSearchParams({})}
          onFinish={onFinish}
        />
      )}

      {metodo === 'entrega' && (
        <Entrega
          cartItems={cartItems}
          totalPrice={displayTotal}
          isMontarCesta={isMontarCesta}
          size={size}
          onBack={() => setSearchParams({})}
          onFinish={onFinish}
        />
      )}
    </div>
  );
}
