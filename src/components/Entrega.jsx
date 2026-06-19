import React, { useState, useEffect, useRef } from 'react';
import './CheckoutModal.css';
import { IoCloseOutline, IoCardOutline, IoCashOutline, IoQrCodeOutline, IoCheckmark, IoCopyOutline, IoLogoWhatsapp } from 'react-icons/io5';
import { saveOrder } from '../services/firestoreService';

// Dados PIX do estabelecimento
const PIX_KEY = '33270327000132';
const PIX_NAME = 'Cooperativa Agrícola Mista de Formiga - CAMFOR';

// Bairros de Formiga-MG
const BAIRROS_FORMIGA = [
  'Água Vermelha', 'Alvorada', 'Bela Vista', 'Bom Jesus', 'Bosque', 'Centenário',
  'Centro', 'Cinco Estrelas', 'Cidade Nova', 'Concreto', 'Engenho de Serra', 'Fonte Nova',
  'Grã Duquesa', 'Imperatriz', 'Industrial', 'Itatiaia', 'Jardim Alvorada', 'Jardim América',
  'Jardim Bela Vista', 'Jardim Califórnia', 'Lagoa', 'Lourdes', 'Mangabeiras',
  'Nossa Senhora de Lourdes', 'Nova Esperança', 'Novo Horizonte', 'Paiol', 'Parque das Palmeiras',
  'Pinheiros', 'Porto das Vinhas', 'Porto Real', 'Primavera', 'Quinzinho', 'Rosário',
  'Santa Luzia', 'Santa Rita', 'Santa Teresa', 'Santo Antônio', 'São Cristóvão', 'São Geraldo',
  'São José', 'São Judas Tadeu', 'São Luiz', 'São Paulo', 'São Pedro', 'São Vicente',
  'Sion', 'Solar dos Lagos', 'Souza e Silva', 'Triângulo', 'Vale do Sol', 'Vila Didi',
  'Vila Formosa', 'Vila Rica', 'Outro'
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
  const [step, setStep] = useState(1); // 1=dados, 2=endereço, 3=pagamento

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

  // Contador regressivo do PIX
  useEffect(() => {
    if (showPixPopup && pixTimer > 0) {
      timerRef.current = setInterval(() => {
        setPixTimer(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [showPixPopup]);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function handlePixWhatsApp() {
    if (pixWppLink) window.open(pixWppLink, '_blank');
    setShowPixPopup(false);
    setPixTimer(300);
    setShowSuccess(true);
  }

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

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!nome.trim()) e.nome = 'Nome é obrigatório';
      if (!telefoneMask.trim()) e.telefone = 'Telefone é obrigatório';
    } else if (s === 2) {
      if (!rua.trim()) e.rua = 'Rua é obrigatória';
      if (!numero.trim()) e.numero = 'Número é obrigatório';
      if (!bairro) e.bairro = 'Bairro é obrigatório';
      if (bairro === 'Outro' && !bairroOutro.trim()) e.bairroOutro = 'Digite o nome do bairro';
    } else if (s === 3) {
      if (payment === 'cash' && needChange && (!changeForRaw || !isChangeValid)) {
        e.troco = 'Valor do troco inválido';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function clearError(field) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  // Avança/volta entre as etapas; só finaliza na última.
  function handleFormSubmit(e) {
    e.preventDefault();
    if (step === 1) { if (validateStep(1)) setStep(2); return; }
    if (step === 2) { if (validateStep(2)) setStep(3); return; }
    if (!validateStep(3)) return;
    submitOrder();
  }

  function submitOrder() {
    let itemsForOrder = Array.isArray(cartItems) && cartItems.length > 0 ? cartItems : [];
    let total = Number(totalPrice) || 0;
    const source = isMontarCesta || (itemsForOrder.length > 0 && [10,15,18].includes(itemsForOrder.length)) ? 'montar' : 'cesta';
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

    saveOrder(pedido);

    const msg = encodeURIComponent(getResumoPedidoMsg({ ...pedido }));
    const wppLink = `https://wa.me/553733220800?text=${msg}`;

    if (payment === 'pix') {
      setPixWppLink(wppLink);
      setPixTotal(total);
      setPixTimer(300);
      setShowPixPopup(true);
    } else {
      window.open(wppLink, '_blank');
      setShowSuccess(true);
    }
  }

  return (
    <>
      <div className="co-backdrop" role="dialog" aria-modal="true" onClick={onBack}>
        <div className="co-modal co-modal-entrega" onClick={(e) => e.stopPropagation()}>
          <button className="co-close" onClick={onBack} aria-label="Fechar"><IoCloseOutline /></button>

          <div className="co-head">
            <div className="co-medal"><img src="/images/logoEmblema.png" alt="CAMFOR" /></div>
            <div className="co-eyebrow">Agricultura Familiar</div>
            <h2 className="co-title">Entrega</h2>
            <div className="co-steps">
              <span className={`co-step ${step >= 1 ? 'on' : ''} ${step === 1 ? 'active' : ''}`}>Dados</span>
              <span className={`co-step ${step >= 2 ? 'on' : ''} ${step === 2 ? 'active' : ''}`}>Endereço</span>
              <span className={`co-step ${step >= 3 ? 'on' : ''} ${step === 3 ? 'active' : ''}`}>Pagamento</span>
            </div>
          </div>

          <form className="co-form" onSubmit={handleFormSubmit}>
            <div className="co-body">
              {step === 1 && (
              <>
              <label className="co-label">Nome <span className="co-req">*</span></label>
              <input
                className={`co-input ${errors.nome ? 'co-input-error' : ''}`}
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => { setNome(e.target.value); clearError('nome'); }}
              />
              {errors.nome && <span className="co-error-msg">{errors.nome}</span>}

              <label className="co-label">Telefone <span className="co-req">*</span></label>
              <input
                className={`co-input ${errors.telefone ? 'co-input-error' : ''}`}
                type="tel"
                inputMode="tel"
                placeholder="(99) 99999-9999"
                value={telefoneMask}
                onChange={(e) => { handlePhoneChange(e); clearError('telefone'); }}
              />
              {errors.telefone && <span className="co-error-msg">{errors.telefone}</span>}
              </>
              )}

              {step === 2 && (
              <>
              <label className="co-label">CEP (opcional)</label>
              <div className="co-cep">
                <input
                  className="co-input"
                  value={cepMask}
                  onChange={handleCepChange}
                  onBlur={() => lookupCep(cepRaw)}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
                <button type="button" className="co-cep-btn" onClick={() => lookupCep(cepRaw)}>
                  {loadingCep ? 'Buscando…' : 'Buscar'}
                </button>
              </div>

              <label className="co-label">Rua <span className="co-req">*</span></label>
              <input
                className={`co-input ${errors.rua ? 'co-input-error' : ''}`}
                placeholder="Nome da rua"
                value={rua}
                onChange={(e) => { setRua(e.target.value); clearError('rua'); }}
              />
              {errors.rua && <span className="co-error-msg">{errors.rua}</span>}

              <div className="co-row">
                <div style={{ flex: '0 0 110px' }}>
                  <label className="co-label">Número <span className="co-req">*</span></label>
                  <input
                    className={`co-input ${errors.numero ? 'co-input-error' : ''}`}
                    placeholder="Nº"
                    value={numero}
                    onChange={(e) => { setNumero(e.target.value); clearError('numero'); }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="co-label">Complemento</label>
                  <input
                    className="co-input"
                    placeholder="Apto, bloco…"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                  />
                </div>
              </div>
              {errors.numero && <span className="co-error-msg">{errors.numero}</span>}

              <label className="co-label">Bairro <span className="co-req">*</span></label>
              <select
                className={`co-select ${errors.bairro ? 'co-input-error' : ''}`}
                value={bairro}
                onChange={(e) => {
                  setBairro(e.target.value);
                  clearError('bairro');
                  if (e.target.value !== 'Outro') setBairroOutro('');
                }}
              >
                <option value="">Selecione o bairro</option>
                {BAIRROS_FORMIGA.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.bairro && <span className="co-error-msg">{errors.bairro}</span>}
              {bairro === 'Outro' && (
                <>
                  <input
                    className={`co-input ${errors.bairroOutro ? 'co-input-error' : ''}`}
                    value={bairroOutro}
                    onChange={(e) => { setBairroOutro(e.target.value); clearError('bairroOutro'); }}
                    placeholder="Digite o nome do bairro"
                    style={{ marginTop: 8 }}
                  />
                  {errors.bairroOutro && <span className="co-error-msg">{errors.bairroOutro}</span>}
                </>
              )}

              <label className="co-label">Cidade / UF</label>
              <div className="co-row">
                <input className="co-input co-input-readonly" value={cidade} readOnly style={{ flex: 1 }} />
                <input className="co-input co-input-readonly" value={uf} readOnly style={{ width: 70 }} />
              </div>
              </>
              )}

              {step === 3 && (
              <>
              <div className="co-pay-options">
                <label className={`co-pay ${payment === 'card' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="card" checked={payment === 'card'} onChange={() => setPayment('card')} />
                  <span className="co-pay-ic"><IoCardOutline size={20} /></span>
                  <span className="co-pay-body">
                    <span className="co-pay-t">Cartão ou PIX</span>
                    <span className="co-pay-d">Na maquininha, no momento da entrega</span>
                  </span>
                </label>
                <label className={`co-pay ${payment === 'cash' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="cash" checked={payment === 'cash'} onChange={() => setPayment('cash')} />
                  <span className="co-pay-ic"><IoCashOutline size={20} /></span>
                  <span className="co-pay-body">
                    <span className="co-pay-t">Dinheiro</span>
                    <span className="co-pay-d">Pague em espécie na entrega</span>
                  </span>
                </label>
                <label className={`co-pay ${payment === 'pix' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="pix" checked={payment === 'pix'} onChange={() => setPayment('pix')} />
                  <span className="co-pay-ic"><IoQrCodeOutline size={20} /></span>
                  <span className="co-pay-body">
                    <span className="co-pay-t">PIX</span>
                    <span className="co-pay-d">Pague agora pelo app do banco</span>
                  </span>
                </label>
              </div>

              {payment === 'pix' && (
                <div className="co-pix-box">
                  <div className="co-pix-title">Atenção</div>
                  <div className="co-pix-text">
                    Após finalizar, mostramos a <strong>chave PIX</strong>. O comprovante deve ser
                    enviado pelo <strong>WhatsApp</strong>.
                  </div>
                </div>
              )}

              {payment === 'cash' && (
                <div className="co-cash">
                  <div className="co-cash-q">Precisa de troco?</div>
                  <div className="co-cash-choices">
                    <button type="button" className={`co-choice ${!needChange ? 'on' : ''}`} onClick={() => setNeedChange(false)}>Não</button>
                    <button type="button" className={`co-choice ${needChange ? 'on' : ''}`} onClick={() => setNeedChange(true)}>Sim</button>
                  </div>
                  {needChange && (
                    <>
                      <input
                        className="co-input co-change-input"
                        placeholder="Troco para quanto?"
                        value={changeForMask}
                        onChange={handleChangeForInput}
                        inputMode="numeric"
                      />
                      {!isChangeValid && changeForRaw && (
                        <div className="co-hint">
                          O valor deve ser maior que {Number(totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              </>
              )}
            </div>

            <div className="co-foot">
              {step === 1 ? (
                <button type="submit" className="co-btn">Continuar</button>
              ) : (
                <div className="co-foot-row">
                  <button type="button" className="co-btn co-btn-ghost" onClick={() => setStep(step - 1)}>Voltar</button>
                  <button type="submit" className="co-btn">{step === 3 ? (loadingCep ? 'Carregando…' : 'Finalizar pedido') : 'Continuar'}</button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Popup PIX */}
      {showPixPopup && (
        <div className="co-success-overlay">
          <div className="co-pixcard">
            <div className="co-pix-badge"><IoCheckmark /></div>
            <h3 className="co-success-title">Pedido realizado!</h3>
            <p className="co-success-text">Pague via PIX e envie o comprovante pelo WhatsApp.</p>

            <div className="co-pix-amount">
              <span className="k">Valor do pedido</span>
              <span className="v">{Number(pixTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>

            <div className="co-pix-keybox">
              <span className="co-pix-keylbl">Chave PIX · CNPJ</span>
              <div className="co-pix-keyrow">
                <span className="co-pix-keyval">{PIX_KEY}</span>
                <button type="button" className="co-pix-copy" onClick={() => navigator.clipboard.writeText(PIX_KEY)} title="Copiar chave">
                  <IoCopyOutline />
                </button>
              </div>
              <span className="co-pix-keyname">{PIX_NAME}</span>
            </div>

            <div className="co-pix-countdown">
              <span className={`co-pix-clock ${pixTimer <= 60 ? 'warn' : ''}`}>{formatTime(pixTimer)}</span>
              <span className="co-pix-clocklbl">para concluir o pagamento</span>
            </div>

            <button className="co-btn co-btn-wpp" onClick={handlePixWhatsApp}>
              <IoLogoWhatsapp size={20} /> Enviar comprovante
            </button>
            <button type="button" className="co-back-link" onClick={handlePixCancel}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Sucesso */}
      {showSuccess && (
        <div className="co-success-overlay">
          <div className="co-success-card">
            <div className="co-success-medal"><img src="/images/logoEmblema.png" alt="CAMFOR" /></div>
            <h3 className="co-success-title">Pedido realizado</h3>
            <p className="co-success-text">Seu pedido foi enviado com sucesso.<br />Obrigado pela preferência!</p>
            <button className="co-btn" onClick={() => { setShowSuccess(false); onFinish && onFinish(); }}>OK</button>
          </div>
        </div>
      )}
    </>
  );
}
