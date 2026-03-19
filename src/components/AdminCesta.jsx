import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminCesta.css';
import { handleImageError } from '../utils/imageUtils';
import { saveAdminConfig, getAdminConfig, getProducts, seedProducts } from '../services/firestoreService';

export default function AdminCesta({ onBack }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionados, setSelecionados] = useState([]);
  const [valor10, setValor10] = useState('');
  const [valor15, setValor15] = useState('');
  const [valor18, setValor18] = useState('');

  // Carrega produtos do Firebase
  useEffect(() => {
    async function loadProducts() {
      try {
        let prods = await getProducts();
        // Se não existem produtos, popula com os iniciais
        if (prods.length === 0) {
          await seedProducts();
          prods = await getProducts();
        }
        setProdutos(prods);
      } catch (e) {
        console.warn('Erro ao carregar produtos', e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Carrega configuração salva do Firestore
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getAdminConfig();
        if (config.selectedItems && Array.isArray(config.selectedItems)) {
          setSelecionados(config.selectedItems);
        }
        if (config.prices && typeof config.prices === 'object') {
          if (config.prices[10]) setValor10(formatBRL(String(Math.round(config.prices[10] * 100))));
          if (config.prices[15]) setValor15(formatBRL(String(Math.round(config.prices[15] * 100))));
          if (config.prices[18]) setValor18(formatBRL(String(Math.round(config.prices[18] * 100))));
        }
      } catch (e) {
        console.warn('Erro ao carregar configuração admin', e);
      }
    }
    loadConfig();
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

  async function handleSalvar() {
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

    // Salva seleção e preços no Firestore
    try {
      await saveAdminConfig(selecionados, { 10: v10, 15: v15, 18: v18 });
      alert('Configuração salva com sucesso!');
      onBack && onBack();
    } catch (e) {
      console.error('Falha ao salvar configuração no Firestore', e);
      alert('Erro ao salvar. Tente novamente.');
    }
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
                <img src="/images/logoImagem.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>
            <h2 className="ch-title">SELECIONAR PRODUTOS</h2>

            {/* Contador de Itens */}
            <div className="admin-note" style={{ marginBottom: 8, marginTop: -10 }}>
              <div className="admin-remaining" style={{ marginTop: 6 }}>
                {totalSelected === 0
                  ? 'Selecione os itens que deseja incluir na cesta.'
                  : `Você selecionou ${totalSelected} item${totalSelected > 1 ? 's' : ''}.`}
              </div>
            </div>

            <div className="admin-prod-list">
              {loading ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
                  Carregando produtos...
                </div>
              ) : produtos.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
                  Nenhum produto cadastrado.
                </div>
              ) : (
                produtos.map((prod) => {
                  const nome = prod.nome;
                  // Suporta tanto URLs do Firebase quanto caminhos locais
                  const imgSrc = prod.imagem.startsWith('http')
                    ? prod.imagem
                    : `/images/produtos/${prod.imagem}`;
                  const isDisabled = !selecionados.includes(nome) && selecionados.length >= 18;
                  return (
                    <label
                      key={prod.docId || nome}
                      className={`admin-prod-item ${isDisabled ? 'admin-prod-item--disabled' : ''}`}
                      aria-disabled={isDisabled ? 'true' : 'false'}
                    >
                      <input
                        type="checkbox"
                        checked={selecionados.includes(nome)}
                        onChange={() => handleCheck(nome)}
                        disabled={isDisabled}
                      />
                      <img
                        src={imgSrc}
                        alt={nome}
                        className="admin-prod-img"
                        onError={handleImageError}
                      />
                      <span className="admin-prod-name">{nome}</span>
                    </label>
                  );
                })
              )}
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
          </div>
        </div>
      </div>
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>

      {/* Contador Flutuante */}
      <div className={`ac-float-counter ${totalSelected > 0 ? 'ac-float-has-items' : ''} ${totalSelected >= 18 ? 'ac-float-max' : ''}`}>
        <div className="ac-float-number">{totalSelected}</div>
        <div className="ac-float-label">
          {totalSelected === 1 ? 'item' : 'itens'}
        </div>
        {totalSelected >= 18 && <div className="ac-float-check">✓</div>}
      </div>
    </div>
  );
}
