import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminProdutos.css';
import { subscribeToProducts, addProduct, updateProduct, deleteProduct } from '../services/firestoreService';
import { handleImageError } from '../utils/imageUtils';

export default function AdminProdutos({ onBack }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [nome, setNome] = useState('');
  const [imagem, setImagem] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Escuta produtos em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToProducts((prods) => {
      setProdutos(prods);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  function handleAdd() {
    setEditingProduct(null);
    setNome('');
    setImagem('');
    setShowForm(true);
  }

  function handleEdit(produto) {
    setEditingProduct(produto);
    setNome(produto.nome);
    setImagem(produto.imagem);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingProduct(null);
    setNome('');
    setImagem('');
  }

  async function handleSave() {
    if (!nome.trim()) {
      alert('Digite o nome do produto');
      return;
    }
    if (!imagem.trim()) {
      alert('Digite o nome do arquivo de imagem');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.docId, nome.trim(), imagem.trim());
      } else {
        await addProduct(nome.trim(), imagem.trim());
      }
      handleCancelForm();
    } catch (e) {
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(docId) {
    try {
      await deleteProduct(docId);
      setShowDeleteConfirm(null);
    } catch (e) {
      alert('Erro ao excluir produto. Tente novamente.');
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
                <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logoImagem.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>

            <h2 className="ch-title">GERENCIAR PRODUTOS</h2>

            {/* Botão Adicionar */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button className="ap-add-btn" onClick={handleAdd}>
                + ADICIONAR PRODUTO
              </button>
            </div>

            {/* Lista de Produtos */}
            <div className="ap-prod-list">
              {loading ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: 20 }}>
                  Carregando produtos...
                </div>
              ) : produtos.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: 20 }}>
                  Nenhum produto cadastrado.
                </div>
              ) : (
                produtos.map((prod) => (
                  <div key={prod.docId} className="ap-prod-item">
                    <img
                      src={`/images/produtos/${prod.imagem}`}
                      alt={prod.nome}
                      className="ap-prod-img"
                      onError={handleImageError}
                    />
                    <div className="ap-prod-info">
                      <div className="ap-prod-name">{prod.nome}</div>
                      <div className="ap-prod-file">{prod.imagem}</div>
                    </div>
                    <div className="ap-prod-actions">
                      <button
                        className="ap-edit-btn"
                        onClick={() => handleEdit(prod)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="ap-delete-btn"
                        onClick={() => setShowDeleteConfirm(prod)}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Contador */}
            <div style={{ textAlign: 'center', color: '#fff', marginTop: 12, opacity: 0.8 }}>
              {produtos.length} produto(s) cadastrado(s)
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="ap-modal-backdrop">
          <div className="ap-modal">
            <h3 className="ap-modal-title">
              {editingProduct ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}
            </h3>

            <label className="ap-label">Nome do Produto</label>
            <input
              className="ap-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Banana"
            />

            <label className="ap-label">Arquivo de Imagem</label>
            <input
              className="ap-input"
              value={imagem}
              onChange={(e) => setImagem(e.target.value)}
              placeholder="Ex: banana.jpg"
            />
            <div className="ap-hint">
              A imagem deve estar em /images/produtos/
            </div>

            {/* Preview */}
            {imagem && (
              <div className="ap-preview">
                <img
                  src={`/images/produtos/${imagem}`}
                  alt="Preview"
                  onError={handleImageError}
                />
              </div>
            )}

            <div className="ap-modal-buttons">
              <button
                className="ap-cancel-btn"
                onClick={handleCancelForm}
                disabled={saving}
              >
                CANCELAR
              </button>
              <button
                className="ap-save-btn"
                onClick={handleSave}
                disabled={saving || !nome.trim() || !imagem.trim()}
              >
                {saving ? 'SALVANDO...' : 'SALVAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="ap-modal-backdrop">
          <div className="ap-modal">
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 className="ap-modal-title">EXCLUIR PRODUTO</h3>
            <p style={{ textAlign: 'center', color: '#fff', marginBottom: 20 }}>
              Deseja excluir <strong>{showDeleteConfirm.nome}</strong>?
              <br />Esta ação não pode ser desfeita.
            </p>
            <div className="ap-modal-buttons">
              <button
                className="ap-cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                CANCELAR
              </button>
              <button
                className="ap-delete-confirm-btn"
                onClick={() => handleDelete(showDeleteConfirm.docId)}
              >
                EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logos */}
      <div className="ch-logos-bottom">
        <img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" />
        <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
      </div>
    </div>
  );
}
