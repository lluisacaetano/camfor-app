import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Retirada.css';

export default function Retirada({ size, onBack, onFinish }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

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
              alert('Finalizado com sucesso. Obrigado!');
              onFinish && onFinish();
            }}>
              <label className="ret-label">Nome</label>
              <input className="ret-input" value={nome} onChange={(e) => setNome(e.target.value)} required />
              
              <label className="ret-label">Telefone</label>
              <input className="ret-input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />

              <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
                <button type="submit" className="ch-btn">Finalizar Retirada</button>
              </div>
            </form>

          </div>
        </div>
      </div>

      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
