import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminPedidos.css';
import { getOrders, getOrderById } from '../utils/orderStorage';
import { handleImageError } from '../utils/imageUtils';

function cestaImgForSize(sz) {
  if (sz === 10) return '/images/cesta10itens.png';
  if (sz === 15) return '/images/cesta15itens.png';
  if (sz === 18) return '/images/cesta18itens.png';
  return '/images/cestaCompleta.jpg';
}

// Determina imagem de preview para o card do pedido
function previewImgForOrder(order) {
  if (!order) return '/images/placeholder.png';
  // pedidos originados de Montar Cesta usam imagem da cesta completa
  if (order.source === 'montar') return '/images/cestaCompleta.jpg';
  // se houver items, preferir a primeira imagem / cesta por tamanho
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
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    // se o item for uma cesta (id 'cesta10' / 'cesta15' / 'cesta18')
                    let imgSrc;
                    if (item && item.id && String(item.id).toLowerCase().startsWith('cesta')) {
                      const match = String(item.id).match(/cesta(\d{2})/i);
                      const sz = match ? Number(match[1]) : null;
                      imgSrc = cestaImgForSize(sz);
                    } else if (order.source === 'montar') {
                      imgSrc = '/images/cestaCompleta.jpg';
                    } else {
                      imgSrc = item.img || '/images/placeholder.png';
                    }

                    return (
                      <div key={idx} className="od-item">
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="od-item-img"
                          onError={handleImageError}
                        />
                        <div className="od-item-info">
                          <div className="od-item-name">{item.name}</div>
                          <div className="od-item-qty">Quantidade: {item.qty}</div>
                        </div>
                        {item.price && (
                          <div className="od-item-price">{formatBRL(item.qty * item.price)}</div>
                        )}
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
