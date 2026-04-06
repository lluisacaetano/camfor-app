import React, { useState, useEffect } from 'react';
import './AdminHome.css';
import { fecharLoja, abrirLoja } from '../services/storeControl';
import { subscribeToAdminConfig } from '../services/firestoreService';

export default function AdminHome({ onBack, onSelectProducts, onViewOrders, onManageProducts }) {
  const [lojaFechada, setLojaFechada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Escuta o status da loja em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToAdminConfig((config) => {
      setLojaFechada(config?.lojaFechada || false);
    });
    return () => unsubscribe();
  }, []);

  function handleClickFecharLoja() {
    setShowModal(true);
  }

  async function handleConfirmFecharLoja() {
    setShowModal(false);
    setLoading(true);
    try {
      if (lojaFechada) {
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

  function handleCancelModal() {
    setShowModal(false);
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

            {/* Status da Loja + Botão */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: lojaFechada ? '#ffebee' : '#e8f5e9',
              border: lojaFechada ? '2px solid #ef5350' : '2px solid #66bb6a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: lojaFechada ? '#c62828' : '#2e7d32',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '18px' }}>{lojaFechada ? '🔴' : '🟢'}</span>
                  LOJA {lojaFechada ? 'FECHADA' : 'ABERTA'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: lojaFechada ? '#d32f2f' : '#388e3c',
                  opacity: 0.9
                }}>
                  {lojaFechada ? 'Os clientes não podem fazer pedidos' : 'Os clientes podem fazer pedidos'}
                </div>
              </div>
              <button
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor: lojaFechada ? '#66bb6a' : '#ef5350',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  minWidth: '140px',
                  opacity: loading ? 0.6 : 1
                }}
                onClick={handleClickFecharLoja}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
              >
                {loading ? 'PROCESSANDO...' : (lojaFechada ? 'ABRIR LOJA' : 'FECHAR LOJA')}
              </button>
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
            </div>
          </div>
        </div>
      </div>

      {/* Logo SICOOB */}
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>

      {/* Modal de Confirmação */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease',
            position: 'relative'
          }}>
            {/* Ícone */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: lojaFechada ? '#e8f5e9' : '#ffebee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              {lojaFechada ? '✅' : '⚠️'}
            </div>

            {/* Título */}
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#333',
              textAlign: 'center',
              marginBottom: '12px',
              lineHeight: '1.3'
            }}>
              {lojaFechada ? 'Reabrir a Loja?' : 'Fechar a Loja?'}
            </h3>

            {/* Mensagem */}
            <p style={{
              fontSize: '15px',
              color: '#666',
              textAlign: 'center',
              lineHeight: '1.6',
              marginBottom: '28px'
            }}>
              {lojaFechada
                ? 'Ao reabrir a loja, será necessário selecionar os produtos novamente.'
                : 'Isso impedirá novos pedidos e todos os produtos selecionados serão desmarcados.'
              }
            </p>

            {/* Botões */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleCancelModal}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#666',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e0e0e0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFecharLoja}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor: lojaFechada ? '#66bb6a' : '#ef5350',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
              >
                {lojaFechada ? 'Sim, Abrir' : 'Sim, Fechar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
