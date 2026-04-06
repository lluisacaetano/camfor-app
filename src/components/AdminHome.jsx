import React, { useState, useEffect } from 'react';
import './AdminHome.css';
import { fecharLoja, abrirLoja } from '../services/storeControl';
import { subscribeToAdminConfig } from '../services/firestoreService';

export default function AdminHome({ onBack, onSelectProducts, onViewOrders, onManageProducts }) {
  const [lojaFechada, setLojaFechada] = useState(false);
  const [loading, setLoading] = useState(false);

  // Escuta o status da loja em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToAdminConfig((config) => {
      setLojaFechada(config?.lojaFechada || false);
    });
    return () => unsubscribe();
  }, []);

  async function handleToggleLoja() {
    if (lojaFechada) {
      // Abrir loja
      if (!window.confirm('Deseja reabrir a loja? Será necessário selecionar os produtos novamente.')) return;
      setLoading(true);
      try {
        await abrirLoja();
        alert('Loja reaberta com sucesso!');
      } catch (e) {
        alert('Erro ao abrir loja. Tente novamente.');
      } finally {
        setLoading(false);
      }
    } else {
      // Fechar loja
      if (!window.confirm('Tem certeza que deseja fechar a loja? Isso impedirá novos pedidos e os produtos serão desmarcados.')) return;
      setLoading(true);
      try {
        await fecharLoja();
        alert('Loja fechada com sucesso! Os produtos foram desmarcados.');
      } catch (e) {
        alert('Erro ao fechar loja. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  }
  return (
    <div className="ch-root">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            {/* Capa + Logo */}
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img 
                  src="/images/capa.jpg" 
                  alt="Produtos Agricultura Familiar"
                  className="ch-cover-img"
                />
              </div>

              {/* Logo */}
              <div className="ch-logo">
                <img 
                  src="/images/logoImagem.png" 
                  alt="CAMFOR - Agricultura Familiar"
                  className="ch-logo-img"
                />
              </div>
            </div>

            {/* Título */}
            <h2 className="ch-title">
              PAINEL ADMINISTRATIVO
            </h2>

            {/* Status da Loja */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              padding: '12px 20px',
              borderRadius: '8px',
              backgroundColor: lojaFechada ? '#ffebee' : '#e8f5e9',
              border: lojaFechada ? '2px solid #c62828' : '2px solid #2e7d32'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: lojaFechada ? '#c62828' : '#2e7d32',
                marginBottom: '4px'
              }}>
                {lojaFechada ? '🔴 LOJA FECHADA' : '🟢 LOJA ABERTA'}
              </div>
              <div style={{
                fontSize: '12px',
                color: lojaFechada ? '#d32f2f' : '#388e3c'
              }}>
                {lojaFechada ? 'Os clientes não podem fazer pedidos' : 'Os clientes podem fazer pedidos'}
              </div>
            </div>

            {/* Botões */}
            <div className="d-grid gap-3 mb-4 ch-btn-group">
              <button
                className="ch-btn"
                onClick={onSelectProducts}
              >
                SELECIONAR PRODUTOS
              </button>
              <button
                className="ch-btn"
                onClick={onViewOrders}
              >
                VER PEDIDOS
              </button>
              <button
                className="ch-btn"
                onClick={onManageProducts}
              >
                GERENCIAR PRODUTOS
              </button>
              <button
                className="ch-btn"
                style={{
                  backgroundColor: lojaFechada ? '#2e7d32' : '#c62828',
                  borderColor: lojaFechada ? '#1b5e20' : '#b71c1c'
                }}
                onClick={handleToggleLoja}
                disabled={loading}
              >
                {loading ? 'PROCESSANDO...' : (lojaFechada ? 'ABRIR LOJA' : 'FECHAR LOJA')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo SICOOB */}
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>
    </div>
  );
}
