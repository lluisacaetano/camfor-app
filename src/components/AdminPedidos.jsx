import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminPedidos.css';
import { getOrders, getOrderById, clearOrders, updateOrder } from '../utils/orderStorage';
import { handleImageError } from '../utils/imageUtils';

function cestaImgForSize(sz) {
  if (sz === 10) return '/images/cesta10itens.png';
  if (sz === 15) return '/images/cesta15itens.png';
  if (sz === 18) return '/images/cesta18itens.png';
  return '/images/cestaCompleta.jpg';
}

// nova função: determina imagem de preview para o card do pedido
function previewImgForOrder(order) {
  // Sempre retorna a imagem da cesta completa
  return '/images/cestaCompleta.jpg';
}

function getMontarCestaCount(order) {
  // Retorna a quantidade de itens selecionados na montagem da cesta
  if (order && order.source === 'montar') {
    if (Array.isArray(order.items) && order.items.length > 0) {
      const len = order.items.length;
      if ([10, 15, 18].includes(len)) return len;
    }
  }
  return null;
}

export default function AdminPedidos({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    setShowClearConfirm(true);
  }

  function confirmClearAll() {
    const ok = clearOrders();
    if (ok) {
      setOrders([]);
    }
    setShowClearConfirm(false);
  }

  function handleToggleEntregue(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updated = updateOrder(orderId, { entregue: !order.entregue });
      if (updated) {
        setOrders(getOrders());
      }
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
                <img src="/images/logoImagem.png" alt="CAMFOR" className="ch-logo-img" />
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
                        <div key={order.id} className={`ap-order-card ${order.entregue ? 'ap-order-entregue' : ''}`}>
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
                                {order.source === 'montar'
                                  ? `${getMontarCestaCount(order) || 0} itens`
                                  : (order.items ? `${order.items.length} item(ns)` : '1 pedido')}
                              </div>
                            </div>
                          </div>
                          <div className="ap-btn-group">
                            <button
                              className="ap-view-btn"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              Visualizar
                            </button>
                            <button
                              className={`ap-entregue-btn ${order.entregue ? 'ap-entregue-ativo' : ''}`}
                              onClick={() => handleToggleEntregue(order.id)}
                            >
                              {order.entregue ? '✓ Entregue' : 'Entregue'}
                            </button>
                          </div>
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
                        <div key={order.id} className={`ap-order-card ${order.entregue ? 'ap-order-entregue' : ''}`}>
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
                                {order.source === 'montar'
                                  ? `${getMontarCestaCount(order) || 0} itens`
                                  : (order.items ? `${order.items.length} item(ns)` : '1 pedido')}
                              </div>
                            </div>
                          </div>
                          <div className="ap-btn-group">
                            <button
                              className="ap-view-btn"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              Visualizar
                            </button>
                            <button
                              className={`ap-entregue-btn ${order.entregue ? 'ap-entregue-ativo' : ''}`}
                              onClick={() => handleToggleEntregue(order.id)}
                            >
                              {order.entregue ? '✓ Entregue' : 'Entregue'}
                            </button>
                          </div>
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

      {/* Popup de confirmação para limpar pedidos */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10, 77, 92, 0.85)', zIndex: 9999
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0a4d5c 0%, #0d6478 100%)',
            color: '#fff',
            padding: '30px 24px',
            borderRadius: 16,
            width: '90%',
            maxWidth: 380,
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: 70,
              height: 70,
              margin: '0 auto 16px',
              background: 'rgba(255, 107, 107, 0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #ff6b6b'
            }}>
              <span style={{ fontSize: 32 }}>⚠️</span>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '1px' }}>LIMPAR PEDIDOS</h3>
            <p style={{ margin: '0 0 24px', opacity: 0.95, fontSize: '0.95rem', lineHeight: 1.5 }}>
              Deseja realmente apagar TODOS os pedidos?<br/>Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.3)',
                  padding: '12px 24px',
                  borderRadius: 50,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={confirmClearAll}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 50,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
                }}
              >
                LIMPAR
              </button>
            </div>
          </div>
        </div>
      )}
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

  // Resolve itens a serem exibidos no detalhe
  function getDisplayItems(order) {
    // Se for montar cesta, SEMPRE mostrar os itens detalhados
    if (order.source === 'montar') {
      if (Array.isArray(order.items) && order.items.length > 0) {
        return order.items.map(it => ({
          id: it.id || (it.name ? it.name.toLowerCase().replace(/\s+/g,'-') : 'item'),
          name: it.name || it.id || 'Item',
          qty: it.qty || 1,
          price: Number(it.price || 0),
          img: it.img || imgFromName(it.name || it.id)
        }));
      }
      // Se não tiver items, não exibir nada ou mostrar mensagem
      return [];
    }

    // Para outros tipos de pedidos (cestas fechadas)
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map(it => {
        const id = it.id || (it.name ? it.name.toLowerCase().replace(/\s+/g,'-') : null);
        const name = it.name || it.id || 'Item';
        let img = it.img;
        
        // Se for uma cesta fechada (cesta10, cesta15, cesta18), usar a imagem correta
        if (id && String(id).toLowerCase().startsWith('cesta')) {
          const match = String(id).match(/cesta(\d{2})/i);
          const sz = match ? Number(match[1]) : null;
          img = cestaImgForSize(sz);
        } else if (!img && name) {
          img = imgFromName(name);
        }
        
        return {
          id,
          name,
          qty: it.qty || 1,
          price: Number(it.price || 0),
          img: img || null
        };
      });
    }

    if (order.size) {
      const sz = Number(order.size);
      return [{ id: `cesta${sz}`, name: `Cesta ${sz} itens`, qty: 1, price: Number(order.total || 0), img: cestaImgForSize(sz) }];
    }

    return [];
  }

  const itemsToRender = getDisplayItems(order);
  const isMontarCesta = order && order.source === 'montar';

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
                <img src="/images/logoImagem.png" alt="CAMFOR" className="ch-logo-img" />
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
                        {/* NÃO mostra preço por item se for MontarCesta */}
                        {!isMontarCesta && item.price ? (
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