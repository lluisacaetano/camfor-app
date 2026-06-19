import React, { useState, useEffect } from 'react';
import './CheckoutModal.css';
import { IoCloseOutline, IoLocationOutline } from 'react-icons/io5';
import { saveOrder } from '../services/firestoreService';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Avenida+Ebano+340+Jardim+California+Formiga+MG';
const MAP_EMBED = 'https://www.google.com/maps?q=Avenida+Ebano+340+Jardim+California+Formiga+MG&output=embed';

export default function Retirada({ size, onBack, onFinish, cartItems = [], isMontarCesta = false, totalPrice = 0 }) {
  const [nome, setNome] = useState('');
  const [, setTelefoneRaw] = useState('');
  const [telefoneMask, setTelefoneMask] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  // Carrega o mapa só depois que o modal abre (não trava a abertura)
  const [mountMap, setMountMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMountMap(true), 250);
    return () => clearTimeout(t);
  }, []);

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
    let msg = '';
    msg += '*CAMFOR*\n';
    msg += 'Conectando Agricultura e Tecnologia\n';
    msg += '--------------------------------\n\n';
    msg += '*PEDIDO - RETIRADA*\n\n';

    msg += '*Itens do Pedido:*\n';
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item) => {
        if (source === 'montar') {
          msg += `- ${item.qty}x ${item.name}\n`;
        } else {
          msg += `- ${item.qty}x ${item.name}${item.price ? ` (R$ ${Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits:2})})` : ''}\n`;
        }
      });
    }

    msg += '--------------------------------\n';
    msg += '*Cliente:*\n';
    msg += 'Nome: ' + nome + '\n';
    msg += 'Telefone: ' + telefone + '\n';

    msg += '--------------------------------\n';
    msg += '*Pagamento:*\n';
    msg += (pagamento || 'Retirada no local') + '\n';

    msg += '\n--------------------------------\n';
    msg += '*TOTAL: R$ ' + Number(total).toLocaleString('pt-BR', {minimumFractionDigits:2}) + '*\n';
    msg += '--------------------------------';

    return msg;
  }

  function validateFields() {
    const newErrors = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!telefoneMask.trim()) newErrors.telefone = 'Telefone é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateFields()) return;

    let itemsForOrder = Array.isArray(cartItems) && cartItems.length > 0 ? cartItems : [];

    let total = Number(totalPrice) || 0;
    if (total === 0 && itemsForOrder.length > 0) {
      total = itemsForOrder.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0);
    }

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

    saveOrder(pedido);

    const msg = encodeURIComponent(getResumoPedidoMsg({ ...pedido }));
    const wppLink = `https://wa.me/553733220800?text=${msg}`;
    window.open(wppLink, '_blank');

    setShowSuccess(true);
  }

  return (
    <>
      <div className="co-backdrop" role="dialog" aria-modal="true" onClick={onBack}>
        <div className="co-modal" onClick={(e) => e.stopPropagation()}>
          <button className="co-close" onClick={onBack} aria-label="Fechar"><IoCloseOutline /></button>

          <div className="co-head">
            <div className="co-medal"><img src="/images/logoEmblema.png" alt="CAMFOR" /></div>
            <div className="co-eyebrow">Agricultura Familiar</div>
            <h2 className="co-title">Retirada</h2>
            <p className="co-sub">Confirme seus dados. O pagamento é feito no local.</p>
          </div>

          <form className="co-form" onSubmit={handleSubmit}>
            <div className="co-body">
              <label className="co-label">Nome <span className="co-req">*</span></label>
              <input
                className={`co-input ${errors.nome ? 'co-input-error' : ''}`}
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setErrors(prev => ({ ...prev, nome: '' })); }}
              />
              {errors.nome && <span className="co-error-msg">{errors.nome}</span>}

              <label className="co-label">Telefone <span className="co-req">*</span></label>
              <input
                className={`co-input ${errors.telefone ? 'co-input-error' : ''}`}
                type="tel"
                inputMode="tel"
                placeholder="(99) 99999-9999"
                value={telefoneMask}
                onChange={(e) => { handlePhoneChange(e); setErrors(prev => ({ ...prev, telefone: '' })); }}
              />
              {errors.telefone && <span className="co-error-msg">{errors.telefone}</span>}

              <div className="co-info">
                <div className="co-info-title">Local de retirada</div>
                <p className="co-info-text">
                  <strong>Endereço</strong><br />
                  Avenida Ébano, 340 — Jardim Califórnia<br />
                  Formiga/MG · CEP 35572-126
                </p>

                <div className="co-map">
                  {!mapLoaded && <div className="co-map-ph">Carregando mapa…</div>}
                  {mountMap && (
                    <iframe
                      title="Mapa do ponto de retirada CAMFOR"
                      src={MAP_EMBED}
                      loading="lazy"
                      onLoad={() => setMapLoaded(true)}
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>

                <a className="co-map-link" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  <IoLocationOutline /> Abrir no Google Maps
                </a>
              </div>
            </div>

            <div className="co-foot">
              <button type="submit" className="co-btn">Finalizar retirada</button>
            </div>
          </form>
        </div>
      </div>

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
