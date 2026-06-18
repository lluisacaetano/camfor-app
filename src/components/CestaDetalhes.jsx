import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CestaDetalhes.css';
import './MontarCesta.css';
import FinalizarPedido from './FinalizarPedido';
import Retirada from './Retirada';
import Entrega from './Entrega';
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
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            {/* Capa + Logo */}
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={() => navigate('/')} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logoImagem.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">ITENS DISPONÍVEIS</h2>

            {/* Preço + Como funciona lado a lado */}
            <div className="cd-info-row">
              <div className="cd-price-item" aria-hidden={storeClosed}>
                <div className="cd-price-size">18 itens</div>
                <div className="cd-price-value">{prices[18] ? formatBRL(prices[18]) : '—'}</div>
              </div>
              <div className="mc-obs-box">
                <div className="mc-obs-title">Como funciona:</div>
                <div className="mc-obs-text">
                  A cesta contém <strong>18 itens diferentes</strong>, selecionados <strong>aleatoriamente</strong> da lista abaixo.
                  <br />A quantidade de cada produto está indicada no card.
                </div>
              </div>
            </div>

            {storeClosed ? (
              <div style={{ textAlign:'center', color:'#fff', margin:'18px 0' }}>Loja fechada</div>
            ) : (
              <ul className="cd-list">
                {produtos.map((p, idx) => {
                  // Fallback para imagem baseada no nome se não houver img
                  const imgId = p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const imgSrc = p.img || `/images/produtos/${imgId}.jpg`;
                  const unidade = p.unidade || 'g';
                  const descricao = unidade === 'un' ? '1 maço/unidade' : unidade === 'pct' ? '1 bandeja' : 'Variação de 200g a 1kg';
                  return (
                    <li key={idx} className="cd-item">
                      <img src={imgSrc} alt={p.name} className="cd-prod-img" onError={handleImageError} />
                      <div className="cd-prod-info">
                        <span className="cd-prod-name">{p.name}</span>
                        <span className={`cd-prod-unit cd-prod-unit-${unidade}`}>{descricao}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Carrinho */}
            <h3 className="mc-cart-title">Carrinho</h3>
            <div className="mc-cart" style={{ marginTop: 8 }}>
              <div className="mc-cart-item">
                <img
                  className="mc-cart-img"
                  src={cestaImgForSize(18)}
                  alt="Cesta 18 itens"
                  onError={handleImageError}
                />
                <div className="mc-cart-name">Cesta de 18 itens</div>
                <div className="mc-cart-controls">
                  <div className="mc-qty-wrap">
                    <button
                      type="button"
                      className="mc-plus-btn"
                      onClick={() => updateBasketCount(18, Math.max(0, (basketCounts[18] || 0) - 1))}
                      disabled={storeClosed}
                      aria-label="Diminuir cestas"
                    >
                      -
                    </button>
                    <div className="mc-qty-display" aria-live="polite">{basketCounts[18] || 0}</div>
                    <button
                      type="button"
                      className="mc-plus-btn"
                      onClick={() => updateBasketCount(18, Math.min(99, (basketCounts[18] || 0) + 1))}
                      disabled={storeClosed}
                      aria-label="Aumentar cestas"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mc-cart-remove"
                    onClick={() => removeBasket(18)}
                    aria-label="Remover cesta"
                  >
                    REMOVER
                  </button>
                </div>
              </div>
            </div>

            <div className="cd-note" style={{ marginTop: 8 }}>
              Total: <strong>{formatBRL(totalValue)}</strong>
            </div>

            <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: 18 }}>
              <button className="ch-btn" onClick={() => navigate('/cesta/resumo')} disabled={!canFinalize() || storeClosed}>
                RESUMO DO PEDIDO
              </button>
            </div>

          </div>
        </div>
      </div>
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
            onBack={() => navigate('/cesta')}
            onFinalize={() => navigate('/cesta/finalizar')}
            onRetirada={() => navigate('/cesta/retirada')}
            onEntrega={() => navigate('/cesta/entrega')}
          />
        }
      />
      <Route
        path="finalizar"
        element={
          <FinalizarPedido
            size={totalBaskets || 0}
            onBack={() => navigate('/cesta/resumo')}
            onRetirada={() => navigate('/cesta/retirada')}
            onEntrega={() => navigate('/cesta/entrega')}
          />
        }
      />
      <Route
        path="retirada"
        element={
          <Retirada
            size={null}
            cartItems={basketItems}
            onBack={() => navigate(-1)}
            onFinish={() => navigate('/')}
          />
        }
      />
      <Route
        path="entrega"
        element={
          <Entrega
            size={null}
            totalPrice={totalValue}
            cartItems={basketItems}
            onBack={() => navigate(-1)}
            onFinish={() => navigate('/')}
          />
        }
      />
    </Routes>
  );
}
