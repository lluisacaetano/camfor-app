import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Entrega.css';

export default function Entrega({ size, onBack, onFinish }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  async function lookupCep(value) {
    const clean = value.replace(/\D/g, '');
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
            <div className="cd-subtitle">Cesta de {size} itens</div>
            <p className="fp-note">Preencha seus dados para entrega.</p>

            <form className="ent-form" onSubmit={(e) => {
              e.preventDefault();
              alert('Finalizado com sucesso. Obrigado!');
              onFinish && onFinish();
            }}>
              <label className="ent-label">Nome</label>
              <input className="ent-input" value={nome} onChange={(e) => setNome(e.target.value)} required />

              <label className="ent-label">Telefone</label>
              <input className="ent-input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />

              <label className="ent-label">CEP (opcional)</label>
              <input
                className="ent-input"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={(e) => lookupCep(e.target.value)}
                placeholder="Ex: 01001000"
              />

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

              <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
                <button type="submit" className="ch-btn">{loadingCep ? 'Carregando...' : 'Finalizar Entrega'}</button>
              </div>
            </form>

          </div>
        </div>
      </div>

      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
