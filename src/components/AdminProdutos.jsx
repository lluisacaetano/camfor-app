import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminProdutos.css';
import {
  subscribeToProducts,
  addProductWithImage,
  updateProductWithImage,
  deleteProductWithImage
} from '../services/firestoreService';
import { handleImageError } from '../utils/imageUtils';

export default function AdminProdutos({ onBack }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [nome, setNome] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

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
    setImageFile(null);
    setImagePreview('');
    setShowForm(true);
  }

  function handleEdit(produto) {
    setEditingProduct(produto);
    setNome(produto.nome);
    setImageFile(null);
    // Usa URL completa ou adiciona prefixo para imagens locais
    const imgSrc = produto.imagem && produto.imagem.startsWith('http')
      ? produto.imagem
      : `/images/produtos/${produto.imagem}`;
    setImagePreview(imgSrc);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingProduct(null);
    setNome('');
    setImageFile(null);
    setImagePreview('');
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      // Verifica se é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem.');
        return;
      }
      // Verifica tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      setImageFile(file);
      // Cria preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  async function handleSave() {
    if (!nome.trim()) {
      alert('Digite o nome do produto');
      return;
    }
    if (!editingProduct && !imageFile) {
      alert('Selecione uma imagem para o produto');
      return;
    }

    // Verifica se já existe produto com o mesmo nome
    const nomeNormalizado = nome.trim().toLowerCase();
    const produtoExistente = produtos.find(p => {
      const nomeExistente = p.nome.toLowerCase();
      // Se estiver editando, ignora o próprio produto
      if (editingProduct && p.docId === editingProduct.docId) {
        return false;
      }
      return nomeExistente === nomeNormalizado;
    });

    if (produtoExistente) {
      alert(`Já existe um produto cadastrado com o nome "${produtoExistente.nome}".`);
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProductWithImage(
          editingProduct.docId,
          nome.trim(),
          imageFile,
          editingProduct.imagem
        );
      } else {
        await addProductWithImage(nome.trim(), imageFile);
      }
      handleCancelForm();
    } catch (e) {
      console.error('Erro ao salvar:', e);
      alert(e.message || 'Erro ao salvar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(produto) {
    try {
      await deleteProductWithImage(produto.docId, produto.imagem);
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
                produtos.map((prod) => {
                  // Suporta tanto URLs do Firebase quanto caminhos locais
                  const imgSrc = prod.imagem && prod.imagem.startsWith('http')
                    ? prod.imagem
                    : `/images/produtos/${prod.imagem}`;
                  return (
                  <div key={prod.docId} className="ap-prod-item">
                    <img
                      src={imgSrc}
                      alt={prod.nome}
                      className="ap-prod-img"
                      onError={handleImageError}
                    />
                    <div className="ap-prod-info">
                      <div className="ap-prod-name">{prod.nome}</div>
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
                );})
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

            <label className="ap-label">Foto do Produto</label>

            {/* Input de arquivo oculto */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* Botão para selecionar foto */}
            <button
              type="button"
              className="ap-upload-btn"
              onClick={triggerFileInput}
            >
              📷 {imageFile ? 'TROCAR FOTO' : 'SELECIONAR FOTO'}
            </button>

            {/* Preview */}
            {imagePreview && (
              <div className="ap-preview">
                <img
                  src={imagePreview}
                  alt="Preview"
                  onError={handleImageError}
                />
                {imageFile && (
                  <div className="ap-file-name">{imageFile.name}</div>
                )}
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
                disabled={saving || !nome.trim() || (!editingProduct && !imageFile)}
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
                onClick={() => handleDelete(showDeleteConfirm)}
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
