import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Retirada.css';
import { saveOrder } from '../services/firestoreService';

export default function Retirada({ size, onBack, onFinish, cartItems = [], isMontarCesta = false, totalPrice = 0 }) {
  const [nome, setNome] = useState('');
  const [, setTelefoneRaw] = useState('');
  const [telefoneMask, setTelefoneMask] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

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

    // Usa os itens do cartItems
    let itemsForOrder = Array.isArray(cartItems) && cartItems.length > 0 ? cartItems : [];

    // Usa o totalPrice que vem como prop (já calculado corretamente do Firebase)
    // Se não vier, calcula a partir dos items
    let total = Number(totalPrice) || 0;
    if (total === 0 && itemsForOrder.length > 0) {
      total = itemsForOrder.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0);
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
    const wppLink = `https://wa.me/553733220800?text=${msg}`;
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
                <img src="/images/logoImagem.png" alt="CAMFOR - Agricultura Familiar" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">RETIRADA</h2>

            <form className="ret-form" onSubmit={handleSubmit}>
              <label className="ret-label">Nome *</label>
              <input
                className={`ret-input ${errors.nome ? 'ret-input-error' : ''}`}
                value={nome}
                onChange={(e) => { setNome(e.target.value); setErrors(prev => ({ ...prev, nome: '' })); }}
              />
              {errors.nome && <span className="ret-error-msg">{errors.nome}</span>}

              <label className="ret-label">Telefone *</label>
              <input
                className={`ret-input ${errors.telefone ? 'ret-input-error' : ''}`}
                type="tel"
                inputMode="tel"
                placeholder="(99) 99999-9999"
                value={telefoneMask}
                onChange={(e) => { handlePhoneChange(e); setErrors(prev => ({ ...prev, telefone: '' })); }}
              />
              {errors.telefone && <span className="ret-error-msg">{errors.telefone}</span>}

              {/* Info de Retirada */}
              <div className="ret-info-box">
                <h3 className="ret-info-title">Local de Retirada</h3>
                <p className="ret-info-text">
                  <strong>Endereço:</strong><br />
                  Avenida Ébano, 340<br />
                  Jardim Califórnia - Formiga/MG<br />
                  CEP: 35572-126
                </p>
                <p className="ret-info-text">
                  <strong>Horário:</strong> até às 17h
                </p>

                {/* Mapa Google Maps */}
                <div className="ret-map-container">
                  <iframe
                    title="Mapa de localização CAMFOR"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3774.5!2d-45.4356!3d-20.4589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDI3JzMyLjAiUyA0NcKwMjYnMDguMiJX!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: 8 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Avenida+Ebano+340+Jardim+California+Formiga+MG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ret-map-link"
                >
                  Abrir no Google Maps
                </a>
              </div>

              <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
                <button type="submit" className="ch-btn">Finalizar Retirada</button>
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