import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MontarCesta.css';
import './CestaDetalhes.css';
import ResumoPedido from './ResumoPedido';
import { subscribeToAdminConfig, subscribeToProducts } from '../services/firestoreService';
import { isStoreOpen, getClosedReason, getBusinessHoursText } from '../utils/storeHours';
import { IoTrashOutline } from 'react-icons/io5';

export default function MontarCesta() {
  const navigate = useNavigate();
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [prices, setPrices] = useState({10:0,15:0,18:0});
  const [allProducts, setAllProducts] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [adminConfig, setAdminConfig] = useState(null);

  // Escuta produtos cadastrados
  useEffect(() => {
    const unsubscribe = subscribeToProducts((prods) => {
      setAllProducts(prods);
    });
    return () => unsubscribe();
  }, []);

  // Escuta configuração do admin (itens selecionados e preços)
  useEffect(() => {
    const unsubscribe = subscribeToAdminConfig((config) => {
      try {
        // Salva config completa para verificar horário de funcionamento
        setAdminConfig(config);

        if (config.selectedItems && config.selectedItems.length > 0) {
          setSelectedNames(config.selectedItems);
        } else {
          setSelectedNames([]);
        }
        if (config.prices) {
          setPrices(config.prices);
        }
      } catch (e) {
        console.warn('Erro ao processar configuração:', e);
      }
    });
    return () => unsubscribe();
  }, []);

  // Combina produtos selecionados com suas imagens reais
  useEffect(() => {
    if (selectedNames.length > 0 && allProducts.length > 0) {
      const mapped = selectedNames.map(name => {
        const product = allProducts.find(p => p.nome === name);
        const id = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

        // Usa a imagem do Firebase ou fallback para caminho local
        let img = `/images/produtos/${id}.jpg`;
        let unidade = 'g'; // padrão
        if (product) {
          if (product.imagem) {
            img = product.imagem.startsWith('http')
              ? product.imagem
              : `/images/produtos/${product.imagem}`;
          }
          unidade = product.unidade || 'g';
        }

        return { id, name, img, unidade };
      });
      // Ordena em ordem alfabética
      mapped.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setProdutosDisponiveis(mapped);
    } else if (selectedNames.length === 0) {
      setProdutosDisponiveis([]);
    }
  }, [selectedNames, allProducts]);

  // Quantidades começam vazias
  const [quantidades, setQuantidades] = useState({});

  useEffect(() => {
    if (!produtosDisponiveis || produtosDisponiveis.length === 0) {
      setQuantidades({});
      return;
    }
    setQuantidades(prev => {
      const map = produtosDisponiveis.reduce((acc, p) => ({ ...acc, [p.id]: prev[p.id] || 0 }), {});
      return map;
    });
  }, [produtosDisponiveis]);

  const [cart, setCart] = useState([]);

  const totalCount = cart.reduce((sum, it) => sum + (it.qty || 0), 0);
  const allowedTotals = [10, 15, 18];
  const finalPrice = allowedTotals.includes(totalCount) ? (prices[totalCount] || 0) : null;

  // Verifica se a loja está aberta (7h-17h + config do mesmo dia)
  const storeOpen = isStoreOpen(adminConfig);
  const storeClosed = !storeOpen;
  const closedReason = storeClosed ? getClosedReason(adminConfig) : '';

  // Incrementa quantidade e atualiza carrinho automaticamente
  function handleIncrement(prod) {
    setQuantidades(q => {
      const current = q[prod.id] || 0;
      if (current >= 2) return q; // Máximo 2 unidades por produto 
      const nextQty = current + 1;
      // Atualiza o carrinho
      setCart(prev => {
        const exists = prev.find(i => i.id === prod.id);
        if (exists) {
          return prev.map(i => i.id === prod.id ? { ...i, qty: nextQty } : i);
        }
        return [...prev, { ...prod, qty: nextQty }];
      });
      return { ...q, [prod.id]: nextQty };
    });
  }

  // Decrementa e remove do carrinho se chegar a 0
  function handleDecrement(prod) {
    setQuantidades(q => {
      const current = q[prod.id] || 0;
      const nextQty = Math.max(0, current - 1);
      setCart(prev => {
        const exists = prev.find(i => i.id === prod.id);
        if (!exists) return prev;
        if (nextQty === 0) {
          return prev.filter(i => i.id !== prod.id);
        }
        return prev.map(i => i.id === prod.id ? { ...i, qty: nextQty } : i);
      });
      return { ...q, [prod.id]: nextQty };
    });
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
    setQuantidades(q => ({ ...q, [id]: 0 }));
  }

  function updateCartQty(id, value) {
    const num = Number(value);
    const v = Number.isNaN(num) ? 0 : Math.min(2, Math.max(0, Math.floor(num)));
    if (v <= 0) {
      // Remove do carrinho e zera quantidade
      setCart(prev => prev.filter(i => i.id !== id));
      setQuantidades(q => ({ ...q, [id]: 0 }));
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: v } : i));
    setQuantidades(q => ({ ...q, [id]: v }));
  }

  const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const mainView = (
    <div className="ch-root mc-root cd-root montar-root">
      {/* Cabeçalho — capa com foto + medalhão (padrão das demais telas) */}
      <div className="cd-top">
        <div className="ch-cover-wrapper">
          <button className="cc-back" onClick={() => navigate('/')} aria-label="Voltar">←</button>
          <div className="ch-cover-inner"><img src="/images/capa.png" alt="Capa CAMFOR" className="ch-cover-img" /></div>
          <div className="ch-logo"><img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" /></div>
        </div>
        <div className="ch-content cd-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Montar minha cesta</h2>
          <div className="ch-rule" />
        </div>
      </div>

      <div className="mc-grid">
        {/* Coluna principal */}
        <div className="mc-main">
          <div className="mc-info">
            <h4>Como funciona</h4>
            <p>
              Escolha <strong>exatamente 10, 15 ou 18 itens</strong> para montar sua cesta.
              Você pode adicionar até <strong>2 unidades</strong> de cada produto.
            </p>
            <p>
              Nos produtos vendidos por peso (<strong>variação de 200g a 1kg</strong>), cada
              unidade corresponde a uma porção dentro dessa faixa de peso, e não a uma unidade
              avulsa do produto.
            </p>
          </div>

          {/* Tamanho da cesta — versão mobile (antes dos produtos, sem box externo) */}
          <div className="mc-sizes-mobile">
            <div className="mc-eyebrow">Tamanho da cesta</div>
            <div className="mc-sizes">
              {allowedTotals.map(sz => (
                <div key={sz} className={`mc-size ${totalCount === sz ? 'mc-size-sel' : ''}`}>
                  <div className="mc-size-h"><span className="mc-size-n">{sz}</span> itens</div>
                  <div className="mc-size-p">{prices[sz] ? fmtBRL(prices[sz]) : '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mc-eyebrow">Produtos do dia</div>
          <div className="mc-list">
            {produtosDisponiveis.map(prod => {
              const unidade = prod.unidade || 'g';
              const descricao = unidade === 'un' ? '1 maço/unidade' : unidade === 'pct' ? '1 bandeja' : 'Variação de 200g a 1kg';
              return (
              <div className="mc-item" key={prod.id}>
                <img
                  className="mc-prod-img"
                  src={prod.img}
                  alt={prod.name}
                  onError={e => {
                    const cur = e.currentTarget;
                    const attempt = parseInt(cur.dataset.attempt || '0', 10);
                    const baseSrc = prod.img.replace(/\.(jpg|jpeg|png)$/i, '');
                    const extensions = ['.jpeg', '.png'];
                    if (attempt < extensions.length) {
                      cur.dataset.attempt = String(attempt + 1);
                      cur.src = baseSrc + extensions[attempt];
                    } else {
                      cur.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNDAiIHk9IjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNlbSBpbWFnZW08L3RleHQ+PC9zdmc+';
                    }
                  }}
                />
                <div className="mc-prod-info">
                  <div className="mc-prod-name">{prod.name}</div>
                  <span className={`mc-badge-inline mc-badge-inline-${unidade}`}>{descricao}</span>
                </div>
                <div className="mc-controls">
                  <div className="mc-qty-wrap">
                    <button className="mc-plus-btn" onClick={() => handleDecrement(prod)}>-</button>
                    <div className="mc-qty-display">{quantidades[prod.id] || 0}</div>
                    <button
                      className="mc-plus-btn"
                      onClick={() => handleIncrement(prod)}
                      disabled={(quantidades[prod.id] || 0) >= 2}
                      title={(quantidades[prod.id] || 0) >= 2 ? 'Máximo 2 unidades' : ''}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Coluna lateral — carrinho + resumo */}
        <div className="mc-aside">
          <div className="mc-sizes-box">
            <div className="mc-eyebrow" style={{ marginTop: 0 }}>Tamanho da cesta</div>
            <div className="mc-sizes">
              {allowedTotals.map(sz => (
                <div key={sz} className={`mc-size ${totalCount === sz ? 'mc-size-sel' : ''}`}>
                  <div className="mc-size-h"><span className="mc-size-n">{sz}</span> itens</div>
                  <div className="mc-size-p">{prices[sz] ? fmtBRL(prices[sz]) : '—'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mc-aside-card">
            <div className="mc-eyebrow" style={{ marginTop: 0 }}>Carrinho</div>
            <div className="mc-cart">
              {cart.length === 0 && <div className="mc-empty">Carrinho vazio</div>}
              {cart.map(item => (
                <div className="mc-cart-item" key={item.id}>
                  <img
                    className="mc-cart-img"
                    src={item.img}
                    alt={item.name}
                    onError={e => {
                      const cur = e.currentTarget;
                      const attempt = parseInt(cur.dataset.attempt || '0', 10);
                      const baseSrc = item.img.replace(/\.(jpg|jpeg|png)$/i, '');
                      const extensions = ['.jpeg', '.png'];
                      if (attempt < extensions.length) {
                        cur.dataset.attempt = String(attempt + 1);
                        cur.src = baseSrc + extensions[attempt];
                      } else {
                        cur.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNDAiIHk9IjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNlbSBpbWFnZW08L3RleHQ+PC9zdmc+';
                      }
                    }}
                  />
                  <div className="mc-cart-name">{item.name}</div>
                  <div className="mc-cart-controls">
                    <div className="mc-qty-wrap">
                      <button className="mc-plus-btn" onClick={() => updateCartQty(item.id, item.qty - 1)}>-</button>
                      <div className="mc-qty-display">{item.qty}</div>
                      <button className="mc-plus-btn" onClick={() => updateCartQty(item.id, item.qty + 1)} disabled={item.qty >= 2}>+</button>
                    </div>
                    <button className="mc-cart-remove" onClick={() => removeFromCart(item.id)} aria-label="Remover" title="Remover"><IoTrashOutline /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mc-aside-foot">
              {storeClosed ? (
                <div className="mc-total-msg">
                  Loja fechada{closedReason ? ` · ${closedReason}` : ''}
                </div>
              ) : finalPrice !== null ? (
                <div className="mc-total-row">
                  <span className="mc-total-k">{totalCount} itens · valor final</span>
                  <span className="mc-total-v">{fmtBRL(finalPrice)}</span>
                </div>
              ) : (
                <div className="mc-total-msg">
                  Selecione exatamente 10, 15 ou 18 itens. <strong>{totalCount}</strong> selecionados.
                </div>
              )}
              <button
                className="ch-btn ch-btn-primary mc-finalize-btn"
                disabled={storeClosed || !allowedTotals.includes(totalCount)}
                onClick={() => {
                  if (storeClosed || !allowedTotals.includes(totalCount)) return;
                  navigate('/montar/resumo');
                }}
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

      {/* Contador Flutuante (mobile) — mesmo padrão do /admin/cesta */}
      <div className={`mc-float-counter ${totalCount > 0 ? 'mc-float-has' : ''} ${allowedTotals.includes(totalCount) ? 'mc-float-max' : ''}`}>
        <div className="mc-float-number">{totalCount}</div>
        <div className="mc-float-label">{totalCount === 1 ? 'item' : 'itens'}</div>
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
            cart={cart}
            size={totalCount}
            totalPrice={finalPrice}
            prices={prices}
            cartItems={cart}
            isMontarCesta={true}
            onBack={() => navigate('/montar')}
            onFinish={() => navigate('/')}
          />
        }
      />
    </Routes>
  );
}
