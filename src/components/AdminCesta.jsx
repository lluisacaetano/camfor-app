import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminCesta.css';

const produtos = [
  'Tomate', 'Cenoura', 'Alface', 'Batata', 'Cebola'
];

function getImgSrc(nome) {
  const imgId = nome
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
  return `/images/produtos/${imgId}.jpg`;
}

export default function AdminCesta({ onBack }) {
  const [isLogged, setIsLogged] = useState(false);
  const [senha, setSenha] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [valor10, setValor10] = useState(''); 
  const [valor15, setValor15] = useState('');
  const [valor18, setValor18] = useState('');

  // Carrega configuração salva
  useEffect(() => {
    try {
      const rawItems = localStorage.getItem('camfor_selected_items');
      const rawPrices = localStorage.getItem('camfor_prices');
      if (rawItems) {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) setSelecionados(parsed);
      }
      if (rawPrices) {
        const parsed = JSON.parse(rawPrices);
        if (parsed && typeof parsed === 'object') {
          if (parsed[10]) setValor10(formatBRL(String(Math.round(parsed[10] * 100))));
          if (parsed[15]) setValor15(formatBRL(String(Math.round(parsed[15] * 100))));
          if (parsed[18]) setValor18(formatBRL(String(Math.round(parsed[18] * 100))));
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar configuração admin', e);
    }
  }, []);

  function formatBRL(input) {
    const digits = (input || '').replace(/\D/g, '');
    if (!digits) return '';
    const n = parseInt(digits, 10);
    return (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function parseBRL(formatted) {
    const digits = (formatted || '').replace(/\D/g, '');
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
  }

  // Validação para habilitar salvar: pelo menos 1 item selecionado e valores preenchidos
  const totalSelected = selecionados.length;
  const v10 = parseBRL(valor10);
  const v15 = parseBRL(valor15);
  const v18 = parseBRL(valor18);
  const canSave = totalSelected >= 1 && v10 > 0 && v15 > 0 && v18 > 0;

  function handleCheck(nome) {
    // Toggle com limite de 18 itens
    setSelecionados(sel => {
      if (sel.includes(nome)) {
        return sel.filter(n => n !== nome);
      }
      if (sel.length >= 18) {
        alert('Você já selecionou o máximo de 18 itens.');
        return sel; 
      }
      return [...sel, nome];
    });
  }

  function handleLogin(e) {
    e.preventDefault();
    if (senha === 'admin') setIsLogged(true);
    else alert('Senha inválida');
  }

  function handleSalvar() {
    if (selecionados.length < 1) {
      alert('Selecione pelo menos 1 item.');
      return;
    }
    const v10 = parseBRL(valor10);
    const v15 = parseBRL(valor15);
    const v18 = parseBRL(valor18);
    if (!v10 || !v15 || !v18) {
      alert('Preencha todos os valores das cestas (valores válidos maiores que 0).');
      return;
    }

    // Salva seleção e preços no localStorage
    try {
      localStorage.setItem('camfor_selected_items', JSON.stringify(selecionados));
      localStorage.setItem('camfor_prices', JSON.stringify({ 10: v10, 15: v15, 18: v18 }));
    } catch (e) {
      console.warn('Falha ao salvar configuração no localStorage', e);
    }

    alert('Configuração salva com sucesso!');
    onBack && onBack();
  }

  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logo.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>
            <h2 className="ch-title">ADMINISTRADOR</h2>
            {!isLogged ? (
              <form className="admin-login" onSubmit={handleLogin}>
                <label className="admin-label">Senha de administrador</label>
                <input
                  className="admin-input"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
                <button className="ch-btn" type="submit">Entrar</button>
              </form>
            ) : (
              <>
                {/* Contador de Itens */}
                <div className="admin-note" style={{ marginBottom: 8 }}>
                  <div className="admin-remaining" style={{ marginTop: 6 }}>
                    {totalSelected === 0
                      ? 'Selecione os itens que deseja incluir na cesta.'
                      : `Você selecionou ${totalSelected} item${totalSelected > 1 ? 's' : ''}.`}
                  </div>
                </div>

                <div className="admin-prod-list">
                  {produtos.map((nome, idx) => {
                    const imgJpg = getImgSrc(nome); 
                    return (
                      <label key={nome} className="admin-prod-item">
                        <input
                          type="checkbox"
                          checked={selecionados.includes(nome)}
                          onChange={() => handleCheck(nome)}
                          disabled={
                            !selecionados.includes(nome) && selecionados.length >= 18
                          }
                        />
                        <img
                          src={imgJpg}
                          alt={nome}
                          className="admin-prod-img"
                          onError={e => {
                            const cur = e.currentTarget;
                            const src = cur.src || '';
                            if (src.match(/\.jpg$/i)) {
                              cur.src = src.replace(/\.jpg$/i, '.jpeg');
                            } else if (src.match(/\.jpeg$/i)) {
                              cur.src = '/images/placeholder.png';
                            } else {
                              cur.src = '/images/placeholder.png';
                            }
                          }}
                        />
                        <span className="admin-prod-name">{nome}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="admin-values">
                  <label className="admin-label">Valor da Cesta Pequena (10 itens)</label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="R$ 0,00"
                    value={valor10}
                    onChange={e => setValor10(formatBRL(e.target.value))}
                  />
                  <label className="admin-label">Valor da Cesta Média (15 itens)</label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="R$ 0,00"
                    value={valor15}
                    onChange={e => setValor15(formatBRL(e.target.value))}
                  />
                  <label className="admin-label">Valor da Cesta Grande (18 itens)</label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="R$ 0,00"
                    value={valor18}
                    onChange={e => setValor18(formatBRL(e.target.value))}
                  />
                </div>
                <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
                  <button
                    className="ch-btn"
                    onClick={handleSalvar}
                    disabled={!canSave}
                    title={!canSave ? 'Selecione ao menos 1 item e preencha todos os valores' : 'Salvar configuração'}
                  >
                    SALVAR
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
