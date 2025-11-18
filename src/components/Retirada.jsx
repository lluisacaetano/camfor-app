import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Retirada.css';

export default function Retirada({ size, onBack, onFinish }) {
  const [nome, setNome] = useState('');
  const [telefoneRaw, setTelefoneRaw] = useState('');   
  const [telefoneMask, setTelefoneMask] = useState('');  
  // sucesso modal
  const [showSuccess, setShowSuccess] = useState(false);

  // Formata telefone
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
            <div className="cd-subtitle">Cesta de {size} itens</div>

            <form className="ret-form" onSubmit={(e) => {
              e.preventDefault();
              // abrir modal de sucesso; onFinish será chamado quando o usuário confirmar
              setShowSuccess(true);
            }}>
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

            {/* Modal simples de sucesso */}
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
