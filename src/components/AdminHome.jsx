import React, { useState, useEffect } from 'react';
import './AdminHome.css';
import '../styles/admin.css';
import { IoLogOutOutline, IoCartOutline, IoClipboardOutline, IoLeafOutline } from 'react-icons/io5';
import { fecharLoja, abrirLoja } from '../services/storeControl';
import { subscribeToAdminConfig, subscribeToProducts } from '../services/firestoreService';
import { isStoreOpen } from '../utils/storeHours';

export default function AdminHome({ onBack, onSelectProducts, onViewOrders, onManageProducts }) {
  const [lojaFechada, setLojaFechada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNoProductsPopup, setShowNoProductsPopup] = useState(false);
  const [adminConfig, setAdminConfig] = useState(null);
  const [lojaRealmenteAberta, setLojaRealmenteAberta] = useState(false);
  const [totalProdutos, setTotalProdutos] = useState(0);

  // Escuta o status da loja em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToAdminConfig((config) => {
      setLojaFechada(config?.lojaFechada || false);
      setAdminConfig(config);
      setLojaRealmenteAberta(isStoreOpen(config));
    });
    return () => unsubscribe();
  }, []);

  // Total de produtos cadastrados (catálogo)
  useEffect(() => {
    const unsubscribe = subscribeToProducts((prods) => setTotalProdutos(prods.length));
    return () => unsubscribe();
  }, []);

  const itensSelecionados = adminConfig?.selectedItems?.length || 0;

  function handleClickFecharLoja() {
    if (!lojaRealmenteAberta) {
      const hasProducts = adminConfig?.selectedItems && adminConfig.selectedItems.length > 0;
      if (!hasProducts) {
        setShowNoProductsPopup(true);
        return;
      }
    }
    setShowModal(true);
  }

  function handleGoToSelectProducts() {
    setShowNoProductsPopup(false);
    onSelectProducts();
  }

  async function handleConfirmFecharLoja() {
    setShowModal(false);
    setLoading(true);
    try {
      if (!lojaRealmenteAberta) {
        await abrirLoja();
      } else {
        await fecharLoja();
      }
    } catch (e) {
      console.error('Erro ao alterar status da loja:', e);
    } finally {
      setLoading(false);
    }
  }

  const statusMsg = lojaRealmenteAberta
    ? 'Os clientes podem fazer pedidos agora.'
    : (itensSelecionados === 0)
      ? 'Sem produtos configurados para hoje.'
      : lojaFechada
        ? 'Fechada manualmente.'
        : 'Fora do horário de atendimento.';

  return (
    <div className="ch-root adm-root">
      <button className="adm-sair" onClick={onBack}>
        <IoLogOutOutline size={16} /> Sair
      </button>

      <div className="adm-wrap">
        <div className="ch-cover-wrapper">
          <div className="ch-cover-inner">
            <img src="/images/capa.png" alt="Produtos Agricultura Familiar" className="ch-cover-img" />
          </div>
          <div className="ch-logo">
            <img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" />
          </div>
        </div>
        <div className="ch-content adm-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Painel administrativo</h2>
          <div className="ch-rule" />
        </div>

        {/* Status da loja */}
        <div className={`adm-status ${lojaRealmenteAberta ? 'adm-status-open' : ''}`}>
          <div className="adm-status-head">
            <span className="adm-status-dot" />
            <div>
              <div className="k">Loja {lojaRealmenteAberta ? 'aberta' : 'fechada'}</div>
              <div className="d">{statusMsg}</div>
            </div>
          </div>
          <div className="sp" />
          <button
            className={`adm-btn ${lojaRealmenteAberta ? 'adm-btn-red' : 'adm-btn-acc'}`}
            onClick={handleClickFecharLoja}
            disabled={loading}
          >
            {loading ? 'Processando...' : (lojaRealmenteAberta ? 'Fechar loja' : 'Abrir loja')}
          </button>
        </div>

        {/* Ações */}
        <div className="adm-actions">
          <button className="adm-acard" onClick={onSelectProducts}>
            <div className="ic"><IoCartOutline /></div>
            <div className="adm-acard-body">
              <h4>Selecionar produtos do dia</h4>
              <p>Defina os itens disponíveis e os preços das cestas de hoje.</p>
              <div className="stat">{itensSelecionados} {itensSelecionados === 1 ? 'item selecionado' : 'itens selecionados'}</div>
            </div>
          </button>

          <button className="adm-acard" onClick={onViewOrders}>
            <div className="ic"><IoClipboardOutline /></div>
            <div className="adm-acard-body">
              <h4>Ver pedidos</h4>
              <p>Acompanhe os pedidos de retirada e entrega do dia.</p>
              <div className="stat">Retirada e entrega</div>
            </div>
          </button>

          <button className="adm-acard" onClick={onManageProducts}>
            <div className="ic"><IoLeafOutline /></div>
            <div className="adm-acard-body">
              <h4>Gerenciar produtos</h4>
              <p>Cadastre, edite ou remova produtos do catálogo.</p>
              <div className="stat">{totalProdutos} {totalProdutos === 1 ? 'produto' : 'produtos'}</div>
            </div>
          </button>
        </div>
      </div>

      <div className="ch-apoio-eyebrow">Apoio</div>
      <div className="ch-logos-bottom">
        <img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" />
        <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
      </div>

      {/* Modal confirmar abrir/fechar */}
      {showModal && (
        <div className="adm-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`adm-modal-icon ${lojaRealmenteAberta ? 'warn' : 'ok'}`}>
              {lojaRealmenteAberta ? '!' : '✓'}
            </div>
            <h3 className="adm-modal-title">{lojaRealmenteAberta ? 'Fechar a loja?' : 'Abrir a loja?'}</h3>
            <p className="adm-modal-text">
              {lojaRealmenteAberta
                ? 'Isso impedirá novos pedidos e os produtos selecionados serão desmarcados.'
                : 'A loja será aberta e os clientes poderão fazer pedidos.'}
            </p>
            <div className="adm-modal-actions">
              <button className="adm-modal-btn ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className={`adm-modal-btn ${lojaRealmenteAberta ? 'danger' : 'primary'}`}
                onClick={handleConfirmFecharLoja}
              >
                {lojaRealmenteAberta ? 'Sim, fechar' : 'Sim, abrir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup sem produtos */}
      {showNoProductsPopup && (
        <div className="adm-modal-backdrop" onClick={() => setShowNoProductsPopup(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-icon warn">!</div>
            <h3 className="adm-modal-title">Atenção</h3>
            <p className="adm-modal-text">Você precisa selecionar os produtos antes de abrir a loja.</p>
            <div className="adm-modal-actions">
              <button className="adm-modal-btn primary" onClick={handleGoToSelectProducts}>Selecionar produtos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
