import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Entrega.css';
import { saveOrder } from '../services/firestoreService';

// Dados PIX do estabelecimento
const PIX_KEY = '33270327000132';
const PIX_NAME = 'Cooperativa Agrícola Mista de Formiga - CAMFOR';

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
  const [payment, setPayment] = useState('card'); 
  const [needChange, setNeedChange] = useState(false);
  const [changeForRaw, setChangeForRaw] = useState('');  
  const [changeForMask, setChangeForMask] = useState(''); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPixPopup, setShowPixPopup] = useState(false);
  const [pixTimer, setPixTimer] = useState(300); // 5 minutos em segundos
  const [pixWppLink, setPixWppLink] = useState('');
  const [pixTotal, setPixTotal] = useState(0);
  const timerRef = useRef(null);
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

  // Efeito para o contador regressivo do PIX
  useEffect(() => {
    if (showPixPopup && pixTimer > 0) {
      timerRef.current = setInterval(() => {
        setPixTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showPixPopup]);

  // Formata o tempo em MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Função para abrir WhatsApp do popup PIX
  function handlePixWhatsApp() {
    if (pixWppLink) {
      window.open(pixWppLink, '_blank');
    }
    // Fecha popup e mostra sucesso
    setShowPixPopup(false);
    setPixTimer(300);
    setShowSuccess(true);
  }

  // Função para cancelar popup PIX
  function handlePixCancel() {
    setShowPixPopup(false);
    setPixTimer(300);
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
      precisaTroco: payment === 'cash' && needChange && isChangeValid && changeForMask,
      valorTroco: payment === 'cash' && needChange && isChangeValid && changeForMask ? changeForMask : null
    };

    // Salva o pedido no backend
    saveOrder(pedido);

    // Gera mensagem e link WhatsApp
    const msg = encodeURIComponent(getResumoPedidoMsg({ ...pedido }));
    const wppLink = `https://wa.me/553733220800?text=${msg}`;

    // Se for PIX, mostra popup especial ao invés de abrir WhatsApp direto
    if (payment === 'pix') {
      setPixWppLink(wppLink);
      setPixTotal(total);
      setPixTimer(300); // Reset 5 minutos
      setShowPixPopup(true);
    } else {
      // Cartão ou Dinheiro: abre WhatsApp direto
      window.open(wppLink, '_blank');
      setShowSuccess(true);
    }
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
                    <span className="ent-pay-label">Cartão ou PIX via Maquininha</span>
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
                    <span className="ent-pay-label">PIX Online</span>
                  </label>
                </div>

                {payment === 'pix' && (
                  <div className="ent-pix-box">
                    <div className="ent-pix-title">Atenção:</div>
                    <div className="ent-pix-text">
                      Após a finalização do pedido, será apresentada a <strong>chave PIX</strong>.
                      <br />O comprovante deve ser enviado via <strong>WhatsApp</strong> sem falta!
                    </div>
                  </div>
                )}

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

            {/* Popup PIX */}
            {showPixPopup && (
              <div className="pix-popup-overlay">
                <div className="pix-popup-container">
                  {/* Header com ícone de sucesso */}
                  <div className="pix-popup-header">
                    <div className="pix-popup-icon-success">
                      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#4CAF50" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="pix-popup-success-title">Pedido realizado com sucesso!</h3>
                    <p className="pix-popup-subtitle">Realize o pagamento via PIX</p>
                  </div>

                  {/* Valor do pedido */}
                  <div className="pix-popup-value">
                    <span className="pix-value-label">Valor do Pedido</span>
                    <span className="pix-value-amount">
                      {Number(pixTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {/* Chave PIX */}
                  <div className="pix-popup-key-section">
                    <span className="pix-key-label">Chave PIX (CNPJ)</span>
                    <div className="pix-key-box">
                      <span className="pix-key-value">{PIX_KEY}</span>
                      <button
                        className="pix-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(PIX_KEY);
                        }}
                        title="Copiar chave"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                    </div>
                    <span className="pix-key-name">{PIX_NAME}</span>
                  </div>

                  {/* Contador */}
                  <div className="pix-popup-timer">
                    <div className={`pix-timer-circle ${pixTimer <= 60 ? 'warning' : ''}`}>
                      <svg className="pix-timer-svg" viewBox="0 0 100 100">
                        <circle className="pix-timer-bg" cx="50" cy="50" r="45"/>
                        <circle
                          className="pix-timer-progress"
                          cx="50"
                          cy="50"
                          r="45"
                          style={{
                            strokeDasharray: 283,
                            strokeDashoffset: 283 - (283 * pixTimer / 300)
                          }}
                        />
                      </svg>
                      <div className="pix-timer-text">
                        <span className="pix-timer-value">{formatTime(pixTimer)}</span>
                        <span className="pix-timer-label">restantes</span>
                      </div>
                    </div>
                  </div>

                  {/* Observação */}
                  <div className="pix-popup-obs">
                    <svg className="pix-obs-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <p>Envie o comprovante pelo WhatsApp para validarmos seu pagamento!</p>
                  </div>

                  {/* Botão WhatsApp */}
                  <button className="pix-whatsapp-btn" onClick={handlePixWhatsApp}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Enviar Comprovante ao Estabelecimento
                  </button>
                </div>
              </div>
            )}

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
      <footer className="ch-footer-bar"><div className="ch-footer-content"><span className="ch-copyright-text"><span className="ch-copyright-symbol">©</span><span className="ch-copyright-year"> 2026</span><span className="ch-copyright-divider">|</span><span className="ch-copyright-names">Desenvolvido por Luisa Caetano Araujo, Júlia Cristina Martins de Almeida Nakano, Maria Eduarda Siqueira Silva e Yasmin Stefane Faria</span></span></div></footer>
    </div>
  );
}