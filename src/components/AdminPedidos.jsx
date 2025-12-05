import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminPedidos.css';
import { getOrders, getOrderById, clearOrders } from '../utils/orderStorage';
import { handleImageError } from '../utils/imageUtils';

function cestaImgForSize(sz) {
  if (sz === 10) return '/images/cesta10itens.png';
  if (sz === 15) return '/images/cesta15itens.png';
  if (sz === 18) return '/images/cesta18itens.png';
  return '/images/cestaCompleta.jpg';
}

// nova função: determina imagem de preview para o card do pedido
function previewImgForOrder(order) {
  if (!order) return '/images/placeholder.png';
  if (order.source === 'montar') return '/images/cestaCompleta.jpg';
  if (Array.isArray(order.items) && order.items.length > 0) {
    const first = order.items[0];
    if (first && first.id && String(first.id).toLowerCase().startsWith('cesta')) {
      const m = String(first.id).match(/cesta(\d{2})/i);
      const sz = m ? Number(m[1]) : null;
      return cestaImgForSize(sz);
    }
    return first.img || '/images/placeholder.png';
  }
  return '/images/placeholder.png';
}

export default function AdminPedidos({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    // carregar inicialmente
    setOrders(getOrders());
    // poll simples para refletir novos pedidos salvos no mesmo tab
    const id = setInterval(() => {
      setOrders(getOrders());
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Auto-clear orders at midnight
    function scheduleAutoCleanup() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilMidnight = tomorrow - now;
      
      const timeoutId = setTimeout(() => {
        clearOrders();
        setOrders([]);
        scheduleAutoCleanup(); // reschedule for next day
      }, timeUntilMidnight);
      
      return timeoutId;
    }
    
    const timeoutId = scheduleAutoCleanup();
    return () => clearTimeout(timeoutId);
  }, []);

  function handleClearAll() {
    if (!window.confirm('Deseja realmente apagar TODOS os pedidos salvos? Esta ação não pode ser desfeita.')) return;
    const ok = clearOrders();
    if (ok) {
      setOrders([]);
      alert('Todos os pedidos foram removidos do localStorage.');
    } else {
      alert('Falha ao limpar pedidos. Veja console para detalhes.');
    }
  }

  const retiradaOrders = orders.filter(o => o.tipo === 'retirada');
  const entregaOrders = orders.filter(o => o.tipo === 'entrega');

  if (selectedOrderId !== null) {
    const selectedOrder = getOrderById(selectedOrderId);
    if (selectedOrder) {
      return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrderId(null)} />;
    }
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

            <h2 className="ch-title">PEDIDOS FINALIZADOS</h2>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#fff', margin: '24px 0' }}>
                Nenhum pedido realizado ainda.
              </div>
            ) : (
              <>
                {/* RETIRADA */}
                {retiradaOrders.length > 0 && (
                  <>
                    <h3 className="ap-section-title">RETIRADA</h3>
                    <div className="ap-orders-list">
                      {retiradaOrders.map(order => (
                        <div key={order.id} className="ap-order-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                            <img
                              src={previewImgForOrder(order)}
                              alt="preview"
                              style={{ width: 56, height: 48, objectFit: 'cover', borderRadius: 8, background: '#fff', flexShrink: 0 }}
                              onError={handleImageError}
                            />
                            <div className="ap-card-content" style={{ minWidth: 0 }}>
                              <div className="ap-order-name">{order.nome}</div>
                              <div className="ap-order-meta">
                                {order.items ? `${order.items.length} item(ns)` : '1 pedido'}
                              </div>
                            </div>
                          </div>
                          <button
                            className="ap-view-btn"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            Visualizar
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ENTREGA */}
                {entregaOrders.length > 0 && (
                  <>
                    <h3 className="ap-section-title" style={{ marginTop: '24px' }}>ENTREGA</h3>
                    <div className="ap-orders-list">
                      {entregaOrders.map(order => (
                        <div key={order.id} className="ap-order-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                            <img
                              src={previewImgForOrder(order)}
                              alt="preview"
                              style={{ width: 56, height: 48, objectFit: 'cover', borderRadius: 8, background: '#fff', flexShrink: 0 }}
                              onError={handleImageError}
                            />
                            <div className="ap-card-content" style={{ minWidth: 0 }}>
                              <div className="ap-order-name">{order.nome}</div>
                              <div className="ap-order-meta">
                                {order.items ? `${order.items.length} item(ns)` : '1 pedido'}
                              </div>
                            </div>
                          </div>
                          <button
                            className="ap-view-btn"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            Visualizar
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* CLEAR BUTTON - centered at bottom */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 12 }}>
                  <button
                    className="ap-view-btn"
                    onClick={handleClearAll}
                    title="Limpar todos os pedidos do localStorage"
                    style={{ background: '#ff6b6b', borderRadius: 8 }}
                  >
                    LIMPAR PEDIDOS
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}

function OrderDetail({ order, onBack }) {
  const formatBRL = v => {
    try { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    catch { return 'R$ 0,00'; }
  };

  // normalize name -> product id filename
  function imgFromName(name) {
    if (!name) return null;
    const id = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `/images/produtos/${id}.jpg`;
  }

  // Resolve itens a serem exibidos no detalhe (com fallbacks e merge)
  function getDisplayItems(order) {
    const tryLoadLastCart = () => {
      try {
        const raw = localStorage.getItem('camfor_last_cart');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        return parsed;
      } catch (e) { return null; }
    };

    // 1) se order.items existe, preferir e tentar enriquecer
    if (Array.isArray(order.items) && order.items.length > 0) {
      const lastCart = tryLoadLastCart();
      return order.items.map(it => {
        const id = it.id || (it.name ? it.name.toLowerCase().replace(/\s+/g,'-') : null);
        let name = it.name || null;
        let img = it.img || null;
        // se faltar nome/img, tentar buscar no lastCart por id ou nome
        if ((!name || !img) && lastCart) {
          const found = lastCart.find(l => (l.id && it.id && l.id === it.id) || (l.name && name && l.name.toLowerCase() === name.toLowerCase()));
          if (found) {
            name = name || found.name;
            img = img || found.img || imgFromName(found.name);
          }
        }
        // fallback img from name
        if (!img && name) img = imgFromName(name);
        return {
          id,
          name: name || id || 'Item',
          qty: it.qty || 1,
          price: Number(it.price || 0),
          img: img || null
        };
      });
    }

    // 2) se veio de "montar", tentar last_cart e mostrar produtos avulsos com suas imagens
    if (order.source === 'montar') {
      const last = tryLoadLastCart();
      if (last) {
        return last.map(it => ({
          id: it.id || (it.name ? it.name.toLowerCase().replace(/\s+/g,'-') : 'item'),
          name: it.name || it.id || 'Item',
          qty: it.qty || 1,
          price: Number(it.price || 0),
          img: it.img || imgFromName(it.name || it.id)
        }));
      }
      // fallback: single representational line
      return [{ id: 'cesta-completa', name: 'Cesta Completa (montagem)', qty: 1, price: Number(order.total || 0), img: '/images/cestaCompleta.jpg' }];
    }

    // 3) se pedido for de cesta (size)
    if (order.size) {
      const sz = Number(order.size);
      return [{ id: `cesta${sz}`, name: `Cesta ${sz} itens`, qty: 1, price: Number(order.total || 0), img: cestaImgForSize(sz) }];
    }

    return [];
  }

  const itemsToRender = getDisplayItems(order);

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

            <h2 className="ch-title">DETALHES DO PEDIDO</h2>

            {/* Dados do Cliente */}
            <div className="od-section">
              <h3 className="od-subtitle">Dados do Cliente</h3>
              <div className="od-info">
                <div className="od-info-row">
                  <span className="od-label">Nome:</span>
                  <span className="od-value">{order.nome}</span>
                </div>
                <div className="od-info-row">
                  <span className="od-label">Telefone:</span>
                  <span className="od-value">{order.telefone}</span>
                </div>
                {order.tipo === 'entrega' && (
                  <>
                    <div className="od-info-row">
                      <span className="od-label">Endereço:</span>
                      <span className="od-value">{order.rua}, {order.numero} - {order.bairro}</span>
                    </div>
                    <div className="od-info-row">
                      <span className="od-label">Cidade/UF:</span>
                      <span className="od-value">{order.cidade}, {order.uf}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="od-section">
              <h3 className="od-subtitle">Itens do Pedido</h3>
              <div className="od-items">
                {itemsToRender.length > 0 ? (
                  itemsToRender.map((item, idx) => {
                    const isCesta = item.id && String(item.id).toLowerCase().startsWith('cesta');
                    const imgSrc = item.img || (isCesta ? cestaImgForSize(Number((String(item.id||'').match(/cesta(\d{2})/i)||[])[1])) : '/images/placeholder.png');
                    return (
                      <div key={idx} className="od-item">
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="od-item-img"
                          onError={handleImageError}
                        />
                        <div className="od-item-info">
                          <div className="od-item-name">{item.name || 'Item'}</div>
                          <div className="od-item-qty">Quantidade: {item.qty || 1}</div>
                        </div>
                        {/* Só mostra valor unitário se não for pedido montado */}
                        {order.source !== 'montar' && item.price ? (
                          <div className="od-item-price">{formatBRL((item.qty || 1) * Number(item.price))}</div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#fff', opacity: 0.8 }}>Nenhum item registrado.</div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="od-section od-total">
              <div className="od-total-label">Total:</div>
              <div className="od-total-value">{formatBRL(order.total || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
