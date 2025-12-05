import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Entrega.css';
import { saveOrder } from '../utils/orderStorage';

export default function Entrega({ size, onBack, onFinish, totalPrice = 0, cartItems = [] }) {
  const [nome, setNome] = useState('');
  const [telefoneRaw, setTelefoneRaw] = useState(''); 
  const [telefoneMask, setTelefoneMask] = useState(''); 

  const [cepRaw, setCepRaw] = useState('');   
  const [cepMask, setCepMask] = useState(''); 
  const [cep, setCep] = useState('');        
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  // formata CEP 00000-000
  function formatCep(value) {
    const d = String(value || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length <= 5) return d;
    return `${d.slice(0,5)}-${d.slice(5,8)}`;
  }

  function handleCepChange(e) {
    const raw = String(e.target.value || '').replace(/\D/g, '');
    setCepRaw(raw);
    setCepMask(formatCep(raw));
    setCep(raw); 
  }

  // formata telefone BR: (99) 9999-9999 ou (99) 99999-9999
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

  // pagamento local (Entrega)
  const [payment, setPayment] = useState('pix'); 
  const [needChange, setNeedChange] = useState(false);
  const [changeForRaw, setChangeForRaw] = useState('');  
  const [changeForMask, setChangeForMask] = useState(''); 
  const [showSuccess, setShowSuccess] = useState(false);
  const totalPriceCents = Math.round((Number(totalPrice) || 0) * 100);
  const changeForCents = Number(String(changeForRaw || '').replace(/\D/g, '')) || 0;
  const isChangeValid = !needChange || (changeForCents > totalPriceCents);

  // formata número de centavos para "R$ 1.234,56"
  function formatCurrencyFromRaw(raw) {
    const d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    const num = parseInt(d, 10);
    const reais = (num / 100).toFixed(2);
    return Number(reais).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function handleChangeForInput(e) {
    const raw = String(e.target.value || '').replace(/\D/g, '');
    setChangeForRaw(raw);
    setChangeForMask(formatCurrencyFromRaw(raw));
  }

  async function lookupCep(value) {
    const clean = String(value || '').replace(/\D/g, '');
    if (!clean || clean.length < 8) return;
    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setUf(data.uf || '');
      }
    } catch (e) {
      console.warn('CEP lookup failed', e);
    } finally {
      setLoadingCep(false);
    }
  }

  function getResumoPedidoMsg({ nome, telefone, rua, numero, bairro, cidade, uf, items, total, pagamento, size }) {
    const allowed = [10,15,18];
    let msg = `-----------------------------\n`;
    msg += `▶️ RESUMO DO PEDIDO\n\n`;
    msg += `Pedido CAMFOR\n\n`;

    msg += `Itens:\n`;
    if (Array.isArray(items) && items.length > 0 && items.some(it => it && (it.name || it.id))) {
      items.forEach((item, idx) => {
        const name = item.name || item.id || 'Item';
        const qty = Number(item.qty || 0);
        const unit = Number(item.price || 0);
        msg += `${qty}x ${name}${unit ? ` (R$ ${unit.toLocaleString('pt-BR',{minimumFractionDigits:2})})` : ''}\n`;
      });
    } else if (allowed.includes(Number(size))) {
      msg += `1x Cesta de ${size} itens (R$ ${Number(total).toLocaleString('pt-BR',{minimumFractionDigits:2})})\n`;
    } else if (total && Number(total) > 0) {
      msg += `Pedido não detalhado — Valor: R$ ${Number(total).toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`;
    } else {
      msg += `Nenhum item registrado.\n`;
    }

    msg += `\n-----------------------------\n`;
    msg += `SUBTOTAL: R$ ${Number(total).toLocaleString('pt-BR', {minimumFractionDigits:2})}\n`;
    msg += `-----------------------------\n`;
    msg += `▶️ Dados para entrega\n\n`;
    msg += `Nome: ${nome}\n`;
    msg += `Endereço: ${rua}, nº: ${numero}\n`;
    msg += `Bairro: ${bairro}\n`;
    msg += `Cidade/UF: ${cidade} - ${uf}\n`;
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

    const total = Array.isArray(cartItems) && cartItems.length > 0
      ? cartItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0)
      : Number(totalPrice);

    const pedido = {
      tipo: 'entrega',
      nome,
      telefone: telefoneMask,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      uf,
      items: cartItems,
      total,
      size: size || 0,
      source: Array.isArray(cartItems) && cartItems.length > 0 ? 'montar' : 'cesta',
      pagamento: payment === 'pix' ? 'PIX' : payment === 'card' ? 'Cartão' : payment === 'cash' ? 'Dinheiro' : 'Não informado'
    };

    saveOrder(pedido);

    // fallback para items na mensagem
    let itemsForMsg = pedido.items;
    if ((!Array.isArray(itemsForMsg) || itemsForMsg.length === 0)) {
      try {
        const raw = localStorage.getItem('camfor_last_cart');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) itemsForMsg = parsed;
        }
      } catch (e) { /* ignore */ }
    }

    // Gera mensagem e link WhatsApp
    const msg = encodeURIComponent(getResumoPedidoMsg({ ...pedido, items: itemsForMsg }));
    const wppLink = `https://wa.me/5537991927076?text=${msg}`;
    window.open(wppLink, '_blank');

    setShowSuccess(true);
  }

  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            {/* Capa */}
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Produtos Agricultura Familiar" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logo.png" alt="CAMFOR - Agricultura Familiar" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">ENTREGA</h2>
            <p className="fp-note">Preencha seus dados para entrega.</p>

            <form className="ent-form" onSubmit={handleSubmit}>
              <label className="ent-label">Nome</label>
              <input className="ent-input" value={nome} onChange={(e) => setNome(e.target.value)} required />

              <label className="ent-label">Telefone</label>
              <input
                className="ent-input"
                type="tel"
                inputMode="tel"
                placeholder="(99) 99999-9999"
                value={telefoneMask}
                onChange={handlePhoneChange}
                required
              />

              {/* Título Endereço*/}
              <h3 className="ent-label">Endereço</h3>

              <label className="ent-label">CEP (opcional)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="ent-input"
                  value={cepMask}
                  onChange={handleCepChange}
                  onBlur={() => lookupCep(cepRaw)}
                  placeholder="Ex: 01001-000"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="ch-btn ent-cep-btn"
                  onClick={() => lookupCep(cepRaw)}
                >
                  Buscar CEP
                </button>
              </div>

              <label className="ent-label">Rua</label>
              <input className="ent-input" value={rua} onChange={(e) => setRua(e.target.value)} />

              <label className="ent-label">Número</label>
              <input className="ent-input" value={numero} onChange={(e) => setNumero(e.target.value)} required />

              <label className="ent-label">Bairro</label>
              <input className="ent-input" value={bairro} onChange={(e) => setBairro(e.target.value)} />

              <label className="ent-label">Cidade / UF</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="ent-input" value={cidade} onChange={(e) => setCidade(e.target.value)} style={{ flex: 1 }} />
                <input className="ent-input" value={uf} onChange={(e) => setUf(e.target.value)} style={{ width: '80px' }} />
              </div>

              {/* Forma de pagamento */}
              <div className="ent-payments">
                <h3 className="ent-label">Forma de Pagamento</h3>
                <div className="ent-pay-options">
                  {/* Ordem alfabética: Cartão, Dinheiro, PIX */}
                  <label className={`ent-pay-option ${payment === 'card' ? 'active' : ''}`}>
                    <input type="radio" name="payment" value="card" checked={payment==='card'} onChange={()=>setPayment('card')} />
                    <span className="ent-pay-icon" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="#111" strokeWidth="1.2" /><circle cx="8" cy="12" r="1.2" fill="#111" /></svg>
                    </span>
                    <span className="ent-pay-label">Cartão</span>
                  </label>

                  <label className={`ent-pay-option ${payment === 'cash' ? 'active' : ''}`}>
                    <input type="radio" name="payment" value="cash" checked={payment==='cash'} onChange={()=>setPayment('cash')} />
                    <span className="ent-pay-icon" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="10" rx="2" stroke="#111" strokeWidth="1.2" /><path d="M8 11h8" stroke="#111" strokeWidth="1.2" /></svg>
                    </span>
                    <span className="ent-pay-label">Dinheiro</span>
                  </label>

                  <label className={`ent-pay-option ${payment === 'pix' ? 'active' : ''}`}>
                    <input type="radio" name="payment" value="pix" checked={payment==='pix'} onChange={()=>setPayment('pix')} />
                    <span className="ent-pay-icon" aria-hidden>
                      {/* simple card-like icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="#111" strokeWidth="1.2" /><rect x="3.5" y="10" width="6" height="2" fill="#111" /></svg>
                    </span>
                    <span className="ent-pay-label">PIX (maquininha)</span>
                  </label>
                </div>

                {payment === 'cash' && (
                  <div className="ent-cash-row ent-cash-centered">
                    <label className="ent-cash-checkbox"><input type="checkbox" checked={needChange} onChange={e => setNeedChange(e.target.checked)} /> Precisa de troco?</label>
                    {needChange && (
                      <>
                        <input
                          className="ent-input ent-change-input"
                          placeholder="R$ 0,00"
                          value={changeForMask}
                          onChange={handleChangeForInput}
                          inputMode="numeric"
                        />
                        {!isChangeValid && changeForRaw && (
                          <div style={{ color: '#ffffffff', fontSize: '0.9rem', marginTop: 6 }}>
                            Obs: O valor informado deve ser maior que o valor do pedido ({Number(totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="d-grid gap-3 ch-btn-group" style={{ marginTop: '18px' }}>
                <button
                  type="submit"
                  className="ch-btn"
                  disabled={!nome || !numero || (payment==='cash' && needChange && (!changeForRaw || !isChangeValid))}
                >
                  {loadingCep ? 'Carregando...' : 'Finalizar Pedido'}
                </button>
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
