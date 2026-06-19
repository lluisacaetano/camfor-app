import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CestaDetalhes.css';
import './MontarCesta.css';
import ResumoPedido from './ResumoPedido';
import { handleImageError } from '../utils/imageUtils';
import { subscribeToAdminConfig, subscribeToProducts } from '../services/firestoreService';

function cestaImgForSize(sz) {
  if (sz === 10) return '/images/cesta10itens.png';
  if (sz === 15) return '/images/cesta15itens.png';
  if (sz === 18) return '/images/cesta18itens.png';
  return '/images/cestaCompleta.jpg';
}

export default function CestaDetalhes() {
  const navigate = useNavigate();

  const [selectedNames, setSelectedNames] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [prices, setPrices] = useState({10:0,15:0,18:0});
  const [basketCounts, setBasketCounts] = useState({10:0,15:0,18:0});

  // Escuta produtos cadastrados
  useEffect(() => {
    const unsubscribe = subscribeToProducts((prods) => {
      setAllProducts(prods);
    });
    return () => unsubscribe();
  }, []);

  // Escuta configuração do admin
  useEffect(() => {
    const unsubscribe = subscribeToAdminConfig((config) => {
      try {
        setSelectedNames(config.selectedItems || []);
        setPrices(config.prices || {10:0,15:0,18:0});
      } catch (e) {
        setSelectedNames([]);
        setPrices({10:0,15:0,18:0});
      }
    });
    return () => unsubscribe();
  }, []);

  // Combina produtos selecionados com suas imagens reais
  useEffect(() => {
    if (selectedNames.length > 0 && allProducts.length > 0) {
      const mapped = selectedNames.map(name => {
        const product = allProducts.find(p => p.nome === name);
        let img = null;
        let unidade = 'g'; // padrão
        if (product) {
          if (product.imagem) {
            img = product.imagem.startsWith('http')
              ? product.imagem
              : `/images/produtos/${product.imagem}`;
          }
          unidade = product.unidade || 'g';
        }
        return { name, img, unidade };
      });
      // Ordena alfabeticamente
      mapped.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setProdutos(mapped);
    } else if (selectedNames.length === 0) {
      setProdutos([]);
    }
  }, [selectedNames, allProducts]);

  function updateBasketCount(size, value) {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    setBasketCounts(b => ({ ...b, [size]: v }));
  }
  function removeBasket(size) {
    setBasketCounts(b => ({ ...b, [size]: 0 }));
  }

  const totalBaskets = basketCounts[18] || 0;
  const totalValue = (basketCounts[18] || 0) * (prices[18] || 0);

  // Pode finalizar se pelo menos 1 cesta e preço configurado
  function canFinalize() {
    if (totalBaskets === 0) return false;
    if (!(prices[18] && prices[18] > 0)) return false;
    return true;
  }

  // Converte basketCounts em itens para salvar/visualizar nas telas de
  // retirada/entrega
  const basketItems = [];
  if (totalBaskets > 0) {
    basketItems.push({
      id: 'cesta18',
      name: 'Cesta 18 itens',
      qty: totalBaskets,
      price: prices[18] || 0
    });
  }

  const formatBRL = v => {
    try { return Number(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
    catch { return 'R$ 0,00'; }
  };

  const storeClosed = produtos.length === 0;

  const mainView = (
    <div className="ch-root mc-root cd-root">
      {/* Cabeçalho — capa com foto + medalhão (padrão das demais telas) */}
      <div className="cd-top">
        <div className="ch-cover-wrapper">
          <button className="cc-back" onClick={() => navigate('/')} aria-label="Voltar">←</button>
          <div className="ch-cover-inner"><img src="/images/capa.png" alt="Capa CAMFOR" className="ch-cover-img" /></div>
          <div className="ch-logo"><img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" /></div>
        </div>
        <div className="ch-content cd-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Cesta completa</h2>
          <div className="ch-rule" />
        </div>
      </div>

      <div className="mc-grid">
        {/* Coluna principal — itens da cesta */}
        <div className="mc-main">
          <div className="mc-info">
            <h4>Como funciona</h4>
            <p>
              A cesta vem com <strong>18 itens diferentes</strong>, selecionados de forma
              variada entre os produtos disponíveis abaixo.
            </p>
          </div>

          <div className="mc-eyebrow">Itens disponíveis</div>
          {storeClosed ? (
            <div className="mc-empty">Loja fechada</div>
          ) : (
            <div className="mc-list">
                {produtos.map((p, idx) => {
                  // Fallback para imagem baseada no nome se não houver img
                  const imgId = p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const imgSrc = p.img || `/images/produtos/${imgId}.jpg`;
                  const unidade = p.unidade || 'g';
                  const descricao = unidade === 'un' ? '1 maço/unidade' : unidade === 'pct' ? '1 bandeja' : 'Variação de 200g a 1kg';
                  return (
                    <div className="mc-item" key={idx}>
                      <img src={imgSrc} alt={p.name} className="mc-prod-img" onError={handleImageError} />
                      <div className="mc-prod-info">
                        <div className="mc-prod-name">{p.name}</div>
                        <span className={`mc-badge-inline mc-badge-inline-${unidade}`}>{descricao}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Coluna lateral — sua cesta + resumo */}
        <div className="mc-aside">
          <div className="mc-aside-card">
            <div className="mc-eyebrow">Sua cesta</div>
            <div className="cd-basket-row">
              <img className="cd-basket-img" src={cestaImgForSize(18)} alt="Cesta 18 itens" onError={handleImageError} />
              <div className="cd-basket-info">
                <div className="cd-basket-name">Cesta de 18 itens</div>
                <div className="cd-basket-price">{prices[18] ? formatBRL(prices[18]) : '—'} <span>/ cesta</span></div>
              </div>
            </div>

            <div className="cd-qty-row">
              <span className="cd-qty-label">Quantidade</span>
              <div className="mc-qty-wrap">
                <button type="button" className="mc-plus-btn" onClick={() => updateBasketCount(18, Math.max(0, (basketCounts[18] || 0) - 1))} disabled={storeClosed} aria-label="Diminuir cestas">-</button>
                <div className="mc-qty-display" aria-live="polite">{basketCounts[18] || 0}</div>
                <button type="button" className="mc-plus-btn" onClick={() => updateBasketCount(18, Math.min(99, (basketCounts[18] || 0) + 1))} disabled={storeClosed} aria-label="Aumentar cestas">+</button>
              </div>
            </div>

            <div className="mc-aside-foot">
              {storeClosed ? (
                <div className="mc-total-msg">Loja fechada no momento.</div>
              ) : (
                <div className="mc-total-row">
                  <span className="mc-total-k">{totalBaskets} cesta{totalBaskets === 1 ? '' : 's'} · total</span>
                  <span className="mc-total-v">{formatBRL(totalValue)}</span>
                </div>
              )}
              <button
                className="ch-btn ch-btn-primary mc-finalize-btn"
                onClick={() => navigate('/cesta/resumo')}
                disabled={!canFinalize() || storeClosed}
              >
                Resumo do pedido
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selos + rodapé */}
      <div className="ch-apoio-eyebrow">Apoio</div>
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>
    </div>
  );

  return (
    <Routes>
      <Route index element={mainView} />
      <Route
        path="resumo"
        element={
          <ResumoPedido
            order={{ basketCounts }}
            totalPrice={totalValue}
            prices={prices}
            cartItems={basketItems}
            isMontarCesta={false}
            size={null}
            onBack={() => navigate('/cesta')}
            onFinish={() => navigate('/')}
          />
        }
      />
    </Routes>
  );
}
