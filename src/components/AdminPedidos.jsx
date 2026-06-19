import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AdminPedidos.css';
import '../styles/admin.css';
import { IoTrashOutline, IoEyeOutline, IoStorefrontOutline } from 'react-icons/io5';
import { MdDeliveryDining } from 'react-icons/md';
import { subscribeToOrders, clearAllOrders, updateOrder, deleteOrder, subscribeToProducts } from '../services/firestoreService';
import { handleImageError } from '../utils/imageUtils';

function cestaImgForSize(sz) {
  if (sz === 10) return '/images/cesta10itens.png';
  if (sz === 15) return '/images/cesta15itens.png';
  if (sz === 18) return '/images/cesta18itens.png';
  return '/images/cestaCompleta.jpg';
}

function getOrderItemCount(order) {
  if (!order) return 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => sum + (item.qty || 1), 0);
  }
  if (order.basketCounts) {
    return (order.basketCounts[10] || 0) + (order.basketCounts[15] || 0) + (order.basketCounts[18] || 0);
  }
  if (order.size) return order.size;
  return 0;
}

function getElapsedTime(timestamp) {
  if (!timestamp) return '';
  const diffMins = Math.floor((new Date() - new Date(timestamp)) / 60000);
  if (diffMins < 1) return 'agora';
  if (diffMins === 1) return 'há 1 min';
  if (diffMins < 60) return `há ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return 'há 1 hora';
  if (diffHours < 24) return `há ${diffHours} horas`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
}

function getInitials(nome) {
  return (nome || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

const fmtBRL = v => {
  try { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  catch { return 'R$ 0,00'; }
};

// Classe da tag de pagamento (cor por método)
function pillClass(pagamento) {
  const s = (pagamento || '').toLowerCase();
  if (s.includes('pix')) return 'pix';
  if (s.includes('dinheiro')) return 'dinheiro';
  if (s.includes('art')) return 'cartao'; // cartão de crédito/débito
  return 'din';
}

// Rótulo curto da tag de pagamento
function pillLabel(pagamento) {
  if (!pagamento) return '—';
  const s = pagamento.toLowerCase();
  if (s.includes('art')) return 'Cartão';
  if (s.includes('retirada')) return 'Retirada';
  return pagamento;
}

export default function AdminPedidos({ onBack, onMount }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [tab, setTab] = useState('todos');
  const [, setTick] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { if (onMount) onMount(); }, [onMount]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersList) => setOrders(ordersList));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((prods) => setProducts(prods));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function scheduleAutoCleanup() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeoutId = setTimeout(async () => {
        await clearAllOrders();
        scheduleAutoCleanup();
      }, tomorrow - now);
      return timeoutId;
    }
    const timeoutId = scheduleAutoCleanup();
    return () => clearTimeout(timeoutId);
  }, []);

  async function confirmClearAll() {
    try { await clearAllOrders(); } catch (e) { console.error('Erro ao limpar pedidos:', e); }
    setShowClearConfirm(false);
  }
  async function handleToggleEntregue(orderId, docId) {
    const order = orders.find(o => o.id === orderId);
    if (order && docId) { try { await updateOrder(docId, { entregue: !order.entregue }); } catch (e) { console.error(e); } }
  }
  async function handleTogglePago(orderId, docId) {
    const order = orders.find(o => o.id === orderId);
    if (order && docId) { try { await updateOrder(docId, { pago: !order.pago }); } catch (e) { console.error(e); } }
  }
  async function handleToggleEmbalado(orderId, docId) {
    const order = orders.find(o => o.id === orderId);
    if (order && docId) { try { await updateOrder(docId, { embalado: !order.embalado }); } catch (e) { console.error(e); } }
  }
  async function confirmDeleteOrder() {
    if (showDeleteConfirm && showDeleteConfirm.docId) {
      try { await deleteOrder(showDeleteConfirm.docId); } catch (e) { console.error(e); }
    }
    setShowDeleteConfirm(null);
  }

  const retiradaOrders = orders.filter(o => o.tipo === 'retirada');
  const entregaOrders = orders.filter(o => o.tipo === 'entrega');

  // Detalhe derivado da URL (?pedido=<docId>) — assim o "voltar" do navegador
  // remove o parâmetro e retorna automaticamente para a lista.
  const pedidoDocId = searchParams.get('pedido');
  const selectedOrder = pedidoDocId ? orders.find(o => o.docId === pedidoDocId) : null;
  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} products={products} onBack={() => setSearchParams({})} />;
  }

  const lista = tab === 'todos' ? orders : tab === 'retirada' ? retiradaOrders : entregaOrders;

  function renderOrder(order) {
    const count = getOrderItemCount(order);
    return (
      <div key={order.id} className={`adm-ocard ${order.entregue ? 'done' : ''}`}>
        <div className="av">{getInitials(order.nome)}</div>
        <div className="info">
          <div className="nm">
            {order.nome}
            <span className={`adm-pill ${pillClass(order.pagamento)}`}>{pillLabel(order.pagamento)}</span>
          </div>
          <div className="meta">{count} {count === 1 ? 'item' : 'itens'} · {order.tipo === 'entrega' ? 'Entrega' : 'Retirada'} · {getElapsedTime(order.timestamp)}</div>
        </div>
        <div className="tot">{fmtBRL(order.total || 0)}</div>
        <div className="adm-oact">
          <button className="adm-mini ver" onClick={() => setSearchParams({ pedido: order.docId })}>Ver</button>
          <button className={`adm-mini pago ${order.pago ? 'on' : ''}`} onClick={() => handleTogglePago(order.id, order.docId)}>Pago</button>
          <button className={`adm-mini emb ${order.embalado ? 'on' : ''}`} onClick={() => handleToggleEmbalado(order.id, order.docId)}>Embalado</button>
          <button className={`adm-mini ent ${order.entregue ? 'on' : ''}`} onClick={() => handleToggleEntregue(order.id, order.docId)}>Entregue</button>
          <button className="adm-mini del" onClick={() => setShowDeleteConfirm(order)} title="Excluir pedido"><IoTrashOutline size={15} /></button>
        </div>
      </div>
    );
  }

  function renderRow(order) {
    const count = getOrderItemCount(order);
    return (
      <tr key={order.id} className={order.entregue ? 'done' : ''}>
        <td>
          <div className="otab-cli">
            <div className="av">{getInitials(order.nome)}</div>
            <div>
              <div className="nm">{order.nome}</div>
              <div className="ph">{getElapsedTime(order.timestamp)}</div>
            </div>
          </div>
        </td>
        <td><span className={`otab-tipo ${order.tipo === 'entrega' ? 'ent' : 'ret'}`}>{order.tipo === 'entrega' ? 'Entrega' : 'Retirada'}</span></td>
        <td className="otab-itens">{count} {count === 1 ? 'item' : 'itens'}</td>
        <td><span className={`adm-pill ${pillClass(order.pagamento)}`}>{pillLabel(order.pagamento)}</span></td>
        <td className="otab-tot">{fmtBRL(order.total || 0)}</td>
        <td>
          <div className="otab-acoes">
            <button className="adm-mini ver" onClick={() => setSearchParams({ pedido: order.docId })}>Ver</button>
            <button className={`adm-mini pago ${order.pago ? 'on' : ''}`} onClick={() => handleTogglePago(order.id, order.docId)}>Pago</button>
            <button className={`adm-mini emb ${order.embalado ? 'on' : ''}`} onClick={() => handleToggleEmbalado(order.id, order.docId)}>Embalado</button>
            <button className={`adm-mini ent ${order.entregue ? 'on' : ''}`} onClick={() => handleToggleEntregue(order.id, order.docId)}>Entregue</button>
            <button className="adm-mini del" onClick={() => setShowDeleteConfirm(order)} title="Excluir pedido"><IoTrashOutline size={14} /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="ch-root adm-root">
      <div className="adm-wrap">
        <div className="ch-cover-wrapper">
          <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
          <div className="ch-cover-inner"><img src="/images/capa.png" alt="Capa" className="ch-cover-img" /></div>
          <div className="ch-logo"><img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" /></div>
        </div>
        <div className="ch-content adm-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Pedidos diários</h2>
          <div className="ch-rule" />
        </div>

        {orders.length === 0 ? (
          <div className="adm-empty">Nenhum pedido realizado ainda.</div>
        ) : (
          <>
            <div className="adm-tabs">
              <button className={`adm-tab ${tab === 'todos' ? 'on' : ''}`} onClick={() => setTab('todos')}>Todos ({orders.length})</button>
              <button className={`adm-tab ${tab === 'entrega' ? 'on' : ''}`} onClick={() => setTab('entrega')} title="Entrega">
                <MdDeliveryDining className="adm-tab-ic" size={18} /><span className="ttxt">Entrega ({entregaOrders.length})</span>
              </button>
              <button className={`adm-tab ${tab === 'retirada' ? 'on' : ''}`} onClick={() => setTab('retirada')} title="Retirada">
                <IoStorefrontOutline className="adm-tab-ic" size={16} /><span className="ttxt">Retirada ({retiradaOrders.length})</span>
              </button>
              <button className="adm-tab-clear" onClick={() => setShowClearConfirm(true)} title="Limpar todos os pedidos">
                <IoTrashOutline size={15} /><span className="ttxt"> Limpar</span>
              </button>
            </div>

            {lista.length === 0 ? (
              <div className="adm-empty">Nenhum pedido nesta categoria.</div>
            ) : (
              <>
                {/* Tabela (desktop) */}
                <div className="adm-otable-wrap">
                  <table className="adm-otable">
                    <thead>
                      <tr><th>Cliente</th><th>Tipo</th><th>Itens</th><th>Pagamento</th><th>Total</th><th>Ações</th></tr>
                    </thead>
                    <tbody>{lista.map(renderRow)}</tbody>
                  </table>
                </div>
                {/* Cards (mobile) */}
                <div className="adm-ocards">{lista.map(renderOrder)}</div>
              </>
            )}

            <div className="adm-ped-total">Total de pedidos: <b>{orders.length}</b></div>
          </>
        )}
      </div>

      <div className="ch-apoio-eyebrow">Apoio</div>
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>

      {showClearConfirm && (
        <div className="adm-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-icon warn">!</div>
            <h3 className="adm-modal-title">Limpar todos os pedidos?</h3>
            <p className="adm-modal-text">Todos os pedidos serão apagados. Esta ação não pode ser desfeita.</p>
            <div className="adm-modal-actions">
              <button className="adm-modal-btn ghost" onClick={() => setShowClearConfirm(false)}>Cancelar</button>
              <button className="adm-modal-btn danger" onClick={confirmClearAll}>Limpar tudo</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="adm-modal-backdrop" onClick={() => setShowDeleteConfirm(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-icon warn">!</div>
            <h3 className="adm-modal-title">Excluir pedido?</h3>
            <p className="adm-modal-text">Deseja realmente excluir o pedido de <strong style={{ color: '#fff' }}>{showDeleteConfirm.nome}</strong>?</p>
            <div className="adm-modal-actions">
              <button className="adm-modal-btn ghost" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className="adm-modal-btn danger" onClick={confirmDeleteOrder}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetail({ order, products = [], onBack }) {
  function getUnitBadge(unidade) {
    if (unidade === 'un') return { text: '1 maço/unidade', className: 'od-badge-un' };
    if (unidade === 'pct') return { text: '1 bandeja', className: 'od-badge-pct' };
    if (unidade === 'g') return { text: 'Variação de 200g a 1kg', className: 'od-badge-g' };
    return null;
  }
  function getProductUnidade(itemName) {
    if (!itemName || !products || products.length === 0) return 'g';
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const product = products.find(p => p.nome && norm(p.nome) === norm(itemName));
    return product?.unidade || 'g';
  }
  function imgFromName(name) {
    if (!name) return null;
    const id = String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `/images/produtos/${id}.jpg`;
  }
  function getDisplayItems(order) {
    if (order.source === 'montar') {
      if (Array.isArray(order.items) && order.items.length > 0) {
        return order.items.map(it => ({
          id: it.id || (it.name ? it.name.toLowerCase().replace(/\s+/g, '-') : 'item'),
          name: it.name || it.id || 'Item', qty: it.qty || 1, price: Number(it.price || 0),
          img: it.img || imgFromName(it.name || it.id), unidade: it.unidade || null
        }));
      }
      return [];
    }
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map(it => {
        const id = it.id || (it.name ? it.name.toLowerCase().replace(/\s+/g, '-') : null);
        const name = it.name || it.id || 'Item';
        let img = it.img;
        if (id && String(id).toLowerCase().startsWith('cesta')) {
          const match = String(id).match(/cesta(\d{2})/i);
          img = cestaImgForSize(match ? Number(match[1]) : null);
        } else if (!img && name) { img = imgFromName(name); }
        return { id, name, qty: it.qty || 1, price: Number(it.price || 0), img: img || null, unidade: it.unidade || null };
      });
    }
    if (order.size) {
      const sz = Number(order.size);
      return [{ id: `cesta${sz}`, name: `Cesta ${sz} itens`, qty: 1, price: Number(order.total || 0), img: cestaImgForSize(sz), unidade: null }];
    }
    return [];
  }

  const itemsToRender = getDisplayItems(order);
  const isMontarCesta = order && order.source === 'montar';

  return (
    <div className="ch-root adm-root">
      <div className="adm-wrap">
        <div className="ch-cover-wrapper">
          <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
          <div className="ch-cover-inner"><img src="/images/capa.png" alt="Capa" className="ch-cover-img" /></div>
          <div className="ch-logo"><img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" /></div>
        </div>
        <div className="ch-content adm-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Detalhes do pedido</h2>
          <div className="ch-rule" />
        </div>

        <div className="odt-grid">
          <div className="odt-col">
            {/* Cliente */}
            <div className="odt-card">
              <div className="adm-eyebrow">Cliente</div>
              <div className="odt-cli">
                <div className="odt-av">{getInitials(order.nome)}</div>
                <div className="odt-cli-info">
                  <div className="odt-name">{order.nome}</div>
                  <a className="odt-phone" href={`tel:${String(order.telefone || '').replace(/\D/g, '')}`}>{order.telefone}</a>
                </div>
              </div>
              {order.tipo === 'entrega' && (
                <div className="odt-meta">
                  <div className="odt-addr-eyebrow">Endereço de entrega</div>
                  <div className="odt-addr-text">
                    {order.rua}, {order.numero}{order.complemento ? ` — ${order.complemento}` : ''}<br />
                    {order.bairro} · {order.cidade}/{order.uf}{order.cep ? ` · ${order.cep}` : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Pagamento */}
            <div className="odt-card">
              <div className="adm-eyebrow">Pagamento</div>
              <div className="odt-row">
                <span className="odt-row-k">Tipo</span>
                <span className="odt-row-v">{order.tipo === 'entrega' ? 'Entrega' : 'Retirada'}</span>
              </div>
              <div className="odt-row">
                <span className="odt-row-k">Forma de pagamento</span>
                <span className="odt-row-v">{pillLabel(order.pagamento)}</span>
              </div>
              {order.pagamento === 'Dinheiro' && (
                <div className="odt-row">
                  <span className="odt-row-k">Troco</span>
                  <span className="odt-row-v">
                    {order.precisaTroco && order.valorTroco && order.valorTroco !== 'R$ 0,00' ? `Para ${order.valorTroco}` : 'Não precisa'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="odt-col">
            {/* Itens */}
            <div className="odt-card">
              <div className="adm-eyebrow">Itens do pedido ({itemsToRender.reduce((s, i) => s + (i.qty || 1), 0)})</div>
              <div className="odt-items">
                {itemsToRender.length > 0 ? itemsToRender.map((item, idx) => {
                  const isCesta = item.id && String(item.id).toLowerCase().startsWith('cesta');
                  const imgSrc = item.img || (isCesta ? cestaImgForSize(Number((String(item.id || '').match(/cesta(\d{2})/i) || [])[1])) : '/images/placeholder.png');
                  const unidade = item.unidade || getProductUnidade(item.name);
                  const badge = !isCesta ? getUnitBadge(unidade) : null;
                  return (
                    <div key={idx} className="odt-item">
                      <img src={imgSrc} alt={item.name} onError={handleImageError} />
                      <div className="odt-item-info">
                        <div className="odt-item-name">{item.name || 'Item'}</div>
                        <div className="odt-item-meta">Qtd: {item.qty || 1}{badge ? ` · ${badge.text}` : ''}</div>
                      </div>
                      {!isMontarCesta && item.price ? <div className="odt-item-price">{fmtBRL((item.qty || 1) * Number(item.price))}</div> : null}
                    </div>
                  );
                }) : <div className="adm-empty">Nenhum item registrado.</div>}
              </div>
              <div className="odt-total">
                <span>Total</span>
                <span className="odt-total-v">{fmtBRL(order.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ch-apoio-eyebrow">Apoio</div>
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>
    </div>
  );
}
