import React, { useState, useEffect } from 'react';
import './AdminCesta.css';
import '../styles/admin.css';
import { IoSearchOutline, IoImageOutline } from 'react-icons/io5';
import { handleImageError } from '../utils/imageUtils';
import { saveAdminConfig, getAdminConfig, getProducts, seedProducts } from '../services/firestoreService';
import { generateStoryDataUrl } from '../utils/storyImage';
import Loading from './Loading';

export default function AdminCesta({ onBack }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionados, setSelecionados] = useState([]);
  const [valor10, setValor10] = useState('');
  const [valor15, setValor15] = useState('');
  const [valor18, setValor18] = useState('');
  const [busca, setBusca] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [gerandoStory, setGerandoStory] = useState(false);

  // Carrega produtos do Firebase
  useEffect(() => {
    async function loadProducts() {
      try {
        let prods = await getProducts();
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

  const totalSelected = selecionados.length;
  const v10 = parseBRL(valor10);
  const v15 = parseBRL(valor15);
  const v18 = parseBRL(valor18);
  const canSave = totalSelected >= 1 && v10 > 0 && v15 > 0 && v18 > 0;

  function handleCheck(nome) {
    setSelecionados(sel => {
      if (sel.includes(nome)) return sel.filter(n => n !== nome);
      if (sel.length >= 18) {
        alert('Você já selecionou o máximo de 18 itens.');
        return sel;
      }
      return [...sel, nome];
    });
  }

  async function handleSalvar() {
    if (!canSave) return;
    try {
      await saveAdminConfig(selecionados, { 10: v10, 15: v15, 18: v18 });
      setShowSuccessPopup(true);
    } catch (e) {
      console.error('Falha ao salvar configuração no Firestore', e);
      alert('Erro ao salvar. Tente novamente.');
    }
  }

  function handleCloseSuccessPopup() {
    setShowSuccessPopup(false);
    onBack && onBack();
  }

  // Monta o story "Cesta do dia" com os itens e preços atuais e baixa o PNG.
  async function handleGerarStory() {
    if (!canSave || gerandoStory) return;
    setGerandoStory(true);
    try {
      const items = selecionados.map((nome) => {
        const prod = produtos.find((p) => p.nome === nome);
        const src = prod && prod.imagem
          ? (prod.imagem.startsWith('http') ? prod.imagem : `/images/produtos/${prod.imagem}`)
          : '';
        return { name: nome, src };
      });
      const dataUrl = await generateStoryDataUrl({ items, prices: { 10: v10, 15: v15, 18: v18 } });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'cesta-do-dia.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Erro ao gerar story', e);
      alert('Não foi possível gerar a imagem. Tente novamente.');
    } finally {
      setGerandoStory(false);
    }
  }

  const normalizar = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const buscaNorm = normalizar(busca);
  const filtrados = produtos.filter(p => normalizar(p.nome).includes(buscaNorm));

  return (
    <div className="ch-root adm-root">
      <div className="adm-wrap">
        <div className="ch-cover-wrapper">
          <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
          <div className="ch-cover-inner">
            <img src="/images/capa.png" alt="Capa" className="ch-cover-img" />
          </div>
          <div className="ch-logo">
            <img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" />
          </div>
        </div>
        <div className="ch-content adm-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Produtos do dia</h2>
          <div className="ch-rule" />
        </div>
        {/* Preços */}
        <div className="adm-eyebrow">Preço das cestas</div>
        <div className="adm-prices">
          <div className="adm-pcard">
            <div className="pl">Cesta 10 itens</div>
            <div className="pin"><span>R$</span><input type="text" inputMode="numeric" placeholder="0,00" value={valor10.replace('R$', '').trim()} onChange={e => setValor10(formatBRL(e.target.value))} /></div>
          </div>
          <div className="adm-pcard">
            <div className="pl">Cesta 15 itens</div>
            <div className="pin"><span>R$</span><input type="text" inputMode="numeric" placeholder="0,00" value={valor15.replace('R$', '').trim()} onChange={e => setValor15(formatBRL(e.target.value))} /></div>
          </div>
          <div className="adm-pcard">
            <div className="pl">Cesta 18 itens</div>
            <div className="pin"><span>R$</span><input type="text" inputMode="numeric" placeholder="0,00" value={valor18.replace('R$', '').trim()} onChange={e => setValor18(formatBRL(e.target.value))} /></div>
          </div>
        </div>

        {/* Seleção de itens */}
        <div className="adm-eyebrow adm-eyebrow-gap">Itens disponíveis</div>
        <div className="adm-search">
          <IoSearchOutline size={18} color="rgba(247,244,236,.5)" />
          <input type="text" placeholder="Pesquisar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {loading ? (
          <div className="adm-empty">Carregando produtos...</div>
        ) : filtrados.length === 0 ? (
          <div className="adm-empty">Nenhum produto encontrado.</div>
        ) : (
          <div className="adm-psel">
            {filtrados.map((prod) => {
              const nome = prod.nome;
              const imgSrc = prod.imagem?.startsWith('http') ? prod.imagem : `/images/produtos/${prod.imagem}`;
              const sel = selecionados.includes(nome);
              const isDisabled = !sel && selecionados.length >= 18;
              return (
                <div
                  key={prod.docId || nome}
                  className={`adm-pchip ${sel ? 'sel' : ''}`}
                  style={isDisabled ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
                  onClick={() => handleCheck(nome)}
                >
                  <img src={imgSrc} alt={nome} loading="lazy" decoding="async" onError={handleImageError} />
                  <span className="nm">{nome}</span>
                  <span className="ck" />
                </div>
              );
            })}
          </div>
        )}

        <div className="adm-cesta-save">
          <button className="adm-btn adm-btn-acc" onClick={handleSalvar} disabled={!canSave}>Salvar configuração</button>
          <button className="adm-btn adm-btn-ghost" onClick={handleGerarStory} disabled={selecionados.length === 0 || gerandoStory}>
            <IoImageOutline size={18} /> Gerar Story
          </button>
        </div>
        {!canSave && (
          <p className="adm-cesta-hint">Selecione os itens e defina os 3 preços para salvar e gerar o story.</p>
        )}
      </div>

      {/* Contador flutuante (lado direito) */}
      <div className={`adm-float ${totalSelected > 0 ? 'has' : ''} ${totalSelected >= 18 ? 'max' : ''}`}>
        <div className="adm-float-n">{totalSelected}</div>
        <div className="adm-float-l">{totalSelected === 1 ? 'item' : 'itens'}</div>
      </div>

      <div className="ch-apoio-eyebrow">Apoio</div>
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>

      {showSuccessPopup && (
        <div className="adm-modal-backdrop" onClick={handleCloseSuccessPopup}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-icon ok">✓</div>
            <h3 className="adm-modal-title">Configuração salva!</h3>
            <p className="adm-modal-text">Os produtos e preços do dia foram atualizados com sucesso.</p>
            <div className="adm-modal-actions">
              <button className="adm-modal-btn ghost" onClick={handleCloseSuccessPopup}>OK</button>
              <button className="adm-modal-btn primary" onClick={handleGerarStory} disabled={gerandoStory}>
                Gerar Story
              </button>
            </div>
          </div>
        </div>
      )}

      {gerandoStory && <Loading message="Gerando a imagem do dia…" />}
    </div>
  );
}
