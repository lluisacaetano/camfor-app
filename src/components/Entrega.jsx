import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Entrega.css';
import { saveOrder } from '../services/firestoreService';

// Bairros de Formiga-MG
const BAIRROS_FORMIGA = [
  'Água Vermelha',
  'Alvorada',
  'Bela Vista',
  'Bom Jesus',
  'Bosque',
  'Centenário',
  'Centro',
  'Cinco Estrelas',
  'Cidade Nova',
  'Concreto',
  'Engenho de Serra',
  'Fonte Nova',
  'Grã Duquesa',
  'Imperatriz',
  'Industrial',
  'Itatiaia',
  'Jardim Alvorada',
  'Jardim América',
  'Jardim Bela Vista',
  'Jardim Califórnia',
  'Lagoa',
  'Lourdes',
  'Mangabeiras',
  'Nossa Senhora de Lourdes',
  'Nova Esperança',
  'Novo Horizonte',
  'Paiol',
  'Parque das Palmeiras',
  'Pinheiros',
  'Porto das Vinhas',
  'Porto Real',
  'Primavera',
  'Quinzinho',
  'Rosário',
  'Santa Luzia',
  'Santa Rita',
  'Santa Teresa',
  'Santo Antônio',
  'São Cristóvão',
  'São Geraldo',
  'São José',
  'São Judas Tadeu',
  'São Luiz',
  'São Paulo',
  'São Pedro',
  'São Vicente',
  'Sion',
  'Solar dos Lagos',
  'Souza e Silva',
  'Triângulo',
  'Vale do Sol',
  'Vila Didi',
  'Vila Formosa',
  'Vila Rica',
  'Outro'
];

export default function Entrega({ size, onBack, onFinish, totalPrice = 0, cartItems = [], isMontarCesta = false }) {
  const [nome, setNome] = useState('');
  const [, setTelefoneRaw] = useState('');
  const [telefoneMask, setTelefoneMask] = useState('');

  const [cepRaw, setCepRaw] = useState('');
  const [cepMask, setCepMask] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [bairroOutro, setBairroOutro] = useState('');
  const cidade = 'Formiga'; // Fixo
  const uf = 'MG'; // Fixo
  const [loadingCep, setLoadingCep] = useState(false);
  const [errors, setErrors] = useState({});

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
        // Verifica se o bairro retornado existe na lista
        const bairroRetornado = data.bairro || '';
        if (BAIRROS_FORMIGA.includes(bairroRetornado)) {
          setBairro(bairroRetornado);
          setBairroOutro('');
        } else if (bairroRetornado) {
          setBairro('Outro');
          setBairroOutro(bairroRetornado);
        }
      }
    } catch (e) {
      console.warn('CEP lookup failed', e);
    } finally {
      setLoadingCep(false);
    }
  }

  function getResumoPedidoMsg({ nome, telefone, rua, numero, complemento, bairro, cidade, uf, items, total, pagamento, size, source, precisaTroco, valorTroco }) {
    const allowed = [10,15,18];
    let msg = '';
    msg += '*CAMFOR*\n';
    msg += 'Conectando Agricultura e Tecnologia\n';
    msg += '--------------------------------\n\n';
    msg += '*PEDIDO - ENTREGA*\n\n';

    msg += '*Itens do Pedido:*\n';
    if (Array.isArray(items) && items.length > 0 && items.some(it => it && (it.name || it.id))) {
      items.forEach((item) => {
        const name = item.name || item.id || 'Item';
        const qty = Number(item.qty || 0);
        const unit = Number(item.price || 0);
        if (source === 'montar') {
          msg += `- ${qty}x ${name}\n`;
        } else {
          msg += `- ${qty}x ${name}${unit ? ` (R$ ${unit.toLocaleString('pt-BR',{minimumFractionDigits:2})})` : ''}\n`;
        }
      });
    } else if (allowed.includes(Number(size))) {
      msg += `- 1x Cesta de ${size} itens (R$ ${Number(total).toLocaleString('pt-BR',{minimumFractionDigits:2})})\n`;
    } else if (total && Number(total) > 0) {
      msg += `- Pedido (R$ ${Number(total).toLocaleString('pt-BR',{minimumFractionDigits:2})})\n`;
    } else {
      msg += '- Nenhum item registrado\n';
    }

    msg += '--------------------------------\n';
    msg += '*Cliente:*\n';
    msg += 'Nome: ' + nome + '\n';
    msg += 'Telefone: ' + telefone + '\n';

    msg += '--------------------------------\n';
    msg += '*Endereco de Entrega:*\n';
    msg += `${rua}, ${numero}${complemento ? ` - ${complemento}` : ''}\n`;
    msg += `${bairro}\n`;
    msg += `${cidade} - ${uf}\n`;

    msg += '--------------------------------\n';
    msg += '*Pagamento:*\n';
    msg += (pagamento || 'Nao informado') + '\n';
    if (precisaTroco && valorTroco) {
      msg += 'Troco para: ' + valorTroco + '\n';
    }

    msg += '\n--------------------------------\n';
    msg += '*TOTAL: R$ ' + Number(total).toLocaleString('pt-BR', {minimumFractionDigits:2}) + '*\n';
    msg += '--------------------------------';
    return msg;
  }

  function validateFields() {
    const newErrors = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!telefoneMask.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (!rua.trim()) newErrors.rua = 'Rua é obrigatória';
    if (!numero.trim()) newErrors.numero = 'Número é obrigatório';
    if (!bairro) newErrors.bairro = 'Bairro é obrigatório';
    if (bairro === 'Outro' && !bairroOutro.trim()) newErrors.bairroOutro = 'Digite o nome do bairro';
    if (payment === 'cash' && needChange && (!changeForRaw || !isChangeValid)) {
      newErrors.troco = 'Valor do troco inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function clearError(field) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateFields()) return;

    // Usa os itens do cartItems
    let itemsForOrder = Array.isArray(cartItems) && cartItems.length > 0 ? cartItems : [];

    // Usa o totalPrice que vem como prop (já calculado corretamente do Firebase)
    let total = Number(totalPrice) || 0;

    // Define source baseado em isMontarCesta ou se tem items válidos
    const source = isMontarCesta || (itemsForOrder.length > 0 && [10,15,18].includes(itemsForOrder.length)) ? 'montar' : 'cesta';

    // Usa bairroOutro se selecionou "Outro"
    const bairroFinal = bairro === 'Outro' ? bairroOutro : bairro;

    const pedido = {
      tipo: 'entrega',
      nome,
      telefone: telefoneMask,
      cep,
      rua,
      numero,
      complemento,
      bairro: bairroFinal,
      cidade,
      uf,
      items: itemsForOrder,
      total,
      size: itemsForOrder.length || size || 0,
      source: source,
      pagamento: payment === 'pix' ? 'PIX' : payment === 'card' ? 'Cartão' : payment === 'cash' ? 'Dinheiro' : 'Não informado',
      precisaTroco: payment === 'cash' && needChange,
      valorTroco: payment === 'cash' && needChange ? changeForMask : null
    };

    console.log('🔍 DEBUG ENTREGA - Pedido sendo salvo:', pedido);
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

            {/* Capa */}
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Produtos Agricultura Familiar" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logoImagem.png" alt="CAMFOR - Agricultura Familiar" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">ENTREGA</h2>
            <p className="fp-note">Preencha seus dados para entrega.</p>

            <form className="ent-form" onSubmit={handleSubmit}>
              <label className="ent-label">Nome *</label>
              <input
                className={`ent-input ${errors.nome ? 'ent-input-error' : ''}`}
                value={nome}
                onChange={(e) => { setNome(e.target.value); clearError('nome'); }}
              />
              {errors.nome && <span className="ent-error-msg">{errors.nome}</span>}

              <label className="ent-label">Telefone *</label>
              <input
                className={`ent-input ${errors.telefone ? 'ent-input-error' : ''}`}
                type="tel"
                inputMode="tel"
                placeholder="(99) 99999-9999"
                value={telefoneMask}
                onChange={(e) => { handlePhoneChange(e); clearError('telefone'); }}
              />
              {errors.telefone && <span className="ent-error-msg">{errors.telefone}</span>}

              {/* Título Endereço*/}
              <h3 className="ent-label">Endereço</h3>

              <label className="ent-label">CEP (opcional)</label>
              <div className="ent-cep-container">
                <input
                  className="ent-input"
                  value={cepMask}
                  onChange={handleCepChange}
                  onBlur={() => lookupCep(cepRaw)}
                  placeholder="Ex: 01001-000"
                />
                <button
                  type="button"
                  className="ent-cep-btn"
                  onClick={() => lookupCep(cepRaw)}
                >
                  BUSCAR CEP
                </button>
              </div>

              <label className="ent-label">Rua *</label>
              <input
                className={`ent-input ${errors.rua ? 'ent-input-error' : ''}`}
                value={rua}
                onChange={(e) => { setRua(e.target.value); clearError('rua'); }}
              />
              {errors.rua && <span className="ent-error-msg">{errors.rua}</span>}

              <label className="ent-label">Número *</label>
              <input
                className={`ent-input ${errors.numero ? 'ent-input-error' : ''}`}
                value={numero}
                onChange={(e) => { setNumero(e.target.value); clearError('numero'); }}
              />
              {errors.numero && <span className="ent-error-msg">{errors.numero}</span>}

              <label className="ent-label">Complemento</label>
              <input className="ent-input" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco, referência..." />
              <span className="ent-optional-note">Este campo não é obrigatório</span>

              <label className="ent-label">Bairro *</label>
              <select
                className={`ent-input ent-select ${errors.bairro ? 'ent-input-error' : ''}`}
                value={bairro}
                onChange={(e) => {
                  setBairro(e.target.value);
                  clearError('bairro');
                  if (e.target.value !== 'Outro') setBairroOutro('');
                }}
              >
                <option value="">Selecione o bairro</option>
                {BAIRROS_FORMIGA.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.bairro && <span className="ent-error-msg">{errors.bairro}</span>}
              {bairro === 'Outro' && (
                <>
                  <input
                    className={`ent-input ${errors.bairroOutro ? 'ent-input-error' : ''}`}
                    value={bairroOutro}
                    onChange={(e) => { setBairroOutro(e.target.value); clearError('bairroOutro'); }}
                    placeholder="Digite o nome do bairro"
                    style={{ marginTop: 8 }}
                  />
                  {errors.bairroOutro && <span className="ent-error-msg">{errors.bairroOutro}</span>}
                </>
              )}

              <label className="ent-label">Cidade / UF</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="ent-input ent-input-readonly" value={cidade} readOnly style={{ flex: 1 }} />
                <input className="ent-input ent-input-readonly" value={uf} readOnly style={{ width: '80px' }} />
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
                  <div className="ent-cash-row">
                    <div
                      className="ent-toggle-container"
                      onClick={() => setNeedChange(!needChange)}
                    >
                      <div className={`ent-toggle ${needChange ? 'active' : ''}`}></div>
                      <span className="ent-toggle-label">Precisa de troco?</span>
                    </div>
                    {needChange && (
                      <>
                        <input
                          className="ent-change-input"
                          placeholder="R$ 0,00"
                          value={changeForMask}
                          onChange={handleChangeForInput}
                          inputMode="numeric"
                        />
                        {!isChangeValid && changeForRaw && (
                          <div style={{ color: '#ffcccc', fontSize: '0.85rem', marginTop: 4, textAlign: 'center' }}>
                            O valor deve ser maior que {Number(totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="d-grid gap-3 ch-btn-group" style={{ marginTop: '18px' }}>
                <button type="submit" className="ch-btn">
                  {loadingCep ? 'Carregando...' : 'Finalizar Pedido'}
                </button>
              </div>
            </form>

            {showSuccess && (
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
                    width: 80,
                    height: 80,
                    margin: '0 auto 16px',
                    background: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    <img src="/images/logoImagem.png" alt="CAMFOR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '1px' }}>PEDIDO REALIZADO</h3>
                  <p style={{ margin: '0 0 20px', opacity: 0.95, fontSize: '1rem', lineHeight: 1.5 }}>
                    Seu pedido foi finalizado com sucesso.<br/>Obrigado pela preferência!
                  </p>
                  <button
                    className="ch-btn"
                    onClick={() => { setShowSuccess(false); onFinish && onFinish(); }}
                    style={{ minWidth: 120 }}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>
    </div>
  );
}