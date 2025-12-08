import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Retirada.css';
import { saveOrder } from '../utils/orderStorage';

export default function Retirada({ size, onBack, onFinish, cartItems = [], isMontarCesta = false }) {
  const [nome, setNome] = useState('');
  const [telefoneRaw, setTelefoneRaw] = useState('');   
  const [telefoneMask, setTelefoneMask] = useState('');  
  const [showSuccess, setShowSuccess] = useState(false);

  function formatPhone(value) {
    const d = String(value || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`; 
  }

  function handlePhoneChange(e) {
    const raw = String(e.target.value || '').replace(/\D/g, '');
    setTelefoneRaw(raw);
    setTelefoneMask(formatPhone(raw));
  }

  function getResumoPedidoMsg({ nome, telefone, items, total, pagamento, source }) {
    let msg = `-----------------------------\n`;
    msg += `▶️ RESUMO DO PEDIDO\n\n`;
    msg += `Pedido CAMFOR\n\n`;

    msg += `Itens:\n`;
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item, idx) => {
        // Se for pedido montado, não mostra valor unitário
        if (source === 'montar') {
          msg += `${item.qty}x ${item.name}\n`;
        } else {
          msg += `${item.qty}x ${item.name}${item.price ? ` (R$ ${Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits:2})})` : ''}\n`;
        }
      });
    }
    msg += `\n-----------------------------\n`;
    msg += `SUBTOTAL: R$ ${Number(total).toLocaleString('pt-BR', {minimumFractionDigits:2})}\n`;
    msg += `-----------------------------\n`;
    msg += `▶️ Dados para retirada\n\n`;
    msg += `Nome: ${nome}\n`;
    msg += `Telefone: ${telefone}\n`;
    msg += `-----------------------------\n`;
    msg += `▶️ TOTAL = R$ ${Number(total).toLocaleString('pt-BR', {minimumFractionDigits:2})}\n`;
    msg += `-----------------------------\n`;
    msg += `▶️ PAGAMENTO\n\n`;
    msg += `Pagamento: ${pagamento ? pagamento : 'Não informado'}\n`;
    msg += `-----------------------------\n`;
    return msg;
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Tenta recuperar itens do cartItems ou do localStorage
    let itemsForOrder = Array.isArray(cartItems) && cartItems.length > 0 ? cartItems : [];
    if (itemsForOrder.length === 0) {
      try {
        const raw = localStorage.getItem('camfor_last_cart');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) itemsForOrder = parsed;
        }
      } catch (e) { /* ignore */ }
    }

    // Recupera preços das cestas
    let prices = {10:0,15:0,18:0};
    try {
      const rawPrices = localStorage.getItem('camfor_prices');
      if (rawPrices) prices = JSON.parse(rawPrices);
    } catch (e) {}

    // Calcula o total: se todos os itens têm price zerado, usa o preço da cesta pelo tamanho
    let total = 0;
    if (itemsForOrder.length > 0) {
      const allZero = itemsForOrder.every(item => !item.price || Number(item.price) === 0);
      if (allZero) {
        const count = itemsForOrder.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        total = prices[count] || 0;
      } else {
        total = itemsForOrder.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0);
      }
    }

    // Define source baseado em isMontarCesta ou se tem items válidos
    const source = isMontarCesta || (itemsForOrder.length > 0 && [10,15,18].includes(itemsForOrder.length)) ? 'montar' : 'cesta';

    const pedido = {
      tipo: 'retirada',
      nome,
      telefone: telefoneMask,
      items: itemsForOrder,
      total,
      size: itemsForOrder.length || size || 0,
      source: source,
      pagamento: 'Retirada no local'
    };

    console.log('🔍 DEBUG RETIRADA - Pedido sendo salvo:', pedido);
    saveOrder(pedido);

    // Gera mensagem e link WhatsApp
    const msg = encodeURIComponent(getResumoPedidoMsg({ ...pedido }));
    const wppLink = `https://wa.me/5537991927076?text=${msg}`;
    window.open(wppLink, '_blank');

    setShowSuccess(true);
  }

  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Produtos Agricultura Familiar" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logo.png" alt="CAMFOR - Agricultura Familiar" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">RETIRADA</h2>

            <form className="ret-form" onSubmit={handleSubmit}>
              <label className="ret-label">Nome</label>
              <input className="ret-input" value={nome} onChange={(e) => setNome(e.target.value)} required />
              
              <label className="ret-label">Telefone</label>
              <input
                className="ret-input"
                type="tel"
                inputMode="tel"
                placeholder="(99) 99999-9999"
                value={telefoneMask}
                onChange={handlePhoneChange}
                required
              />

              <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
                <button type="submit" className="ch-btn">Finalizar Retirada</button>
              </div>
            </form>

            {showSuccess && (
              <div style={{
                position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)', zIndex: 9999
              }}>
                <div style={{ background:'#fff', color:'#111', padding: 20, borderRadius: 10, width: '90%', maxWidth: 420, textAlign: 'center' }}>
                  <h3 style={{ marginTop: 0 }}>PEDIDO REALIZADO</h3>
                  <p>Seu pedido foi finalizado com sucesso. Obrigado!</p>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <button className="ch-btn" onClick={() => { setShowSuccess(false); onFinish && onFinish(); }}>OK</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}