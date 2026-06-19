import React, { useState, useEffect, useRef } from 'react';
import './AdminProdutos.css';
import '../styles/admin.css';
import { IoSearchOutline, IoTrashOutline, IoCameraOutline, IoAddOutline, IoScaleOutline, IoLeafOutline, IoFileTrayOutline } from 'react-icons/io5';
import {
  subscribeToProducts,
  addProductWithImage,
  updateProductWithImage,
  deleteProductWithImage
} from '../services/firestoreService';
import { handleImageError } from '../utils/imageUtils';

const UNIT_LABEL = { g: 'Peso', un: 'Unidade', pct: 'Bandeja' };

export default function AdminProdutos({ onBack }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('g');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const [popup, setPopup] = useState({ show: false, type: '', message: '' });

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
    setUnidade('g');
    setImageFile(null);
    setImagePreview('');
    setShowForm(true);
  }

  function handleEdit(produto) {
    setEditingProduct(produto);
    setNome(produto.nome);
    setUnidade(produto.unidade || 'g');
    setImageFile(null);
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
    setUnidade('g');
    setImageFile(null);
    setImagePreview('');
  }

  function showPopup(type, message) { setPopup({ show: true, type, message }); }
  function closePopup() { setPopup({ show: false, type: '', message: '' }); }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showPopup('error', 'Por favor, selecione um arquivo de imagem.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showPopup('error', 'A imagem deve ter no máximo 5MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  function triggerFileInput() { fileInputRef.current?.click(); }

  async function handleSave() {
    if (!nome.trim()) { showPopup('error', 'Digite o nome do produto'); return; }
    if (!editingProduct && !imageFile) { showPopup('error', 'Selecione uma imagem para o produto'); return; }

    const nomeNormalizado = nome.trim().toLowerCase();
    const produtoExistente = produtos.find(p => {
      if (editingProduct && p.docId === editingProduct.docId) return false;
      return p.nome.toLowerCase() === nomeNormalizado;
    });
    if (produtoExistente) {
      showPopup('warning', `Já existe um produto cadastrado com o nome "${produtoExistente.nome}".`);
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProductWithImage(editingProduct.docId, nome.trim(), imageFile, editingProduct.imagem, unidade);
        handleCancelForm();
        showPopup('success', 'Produto atualizado com sucesso!');
      } else {
        await addProductWithImage(nome.trim(), imageFile, unidade);
        handleCancelForm();
        showPopup('success', 'Produto cadastrado com sucesso!');
      }
    } catch (e) {
      console.error('Erro ao salvar:', e);
      showPopup('error', e.message || 'Erro ao salvar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(produto) {
    try {
      await deleteProductWithImage(produto.docId, produto.imagem);
      setShowDeleteConfirm(null);
      showPopup('success', 'Produto excluído com sucesso!');
    } catch (e) {
      showPopup('error', 'Erro ao excluir produto. Tente novamente.');
    }
  }

  const normalizar = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const buscaNorm = normalizar(searchTerm);
  const filtrados = produtos.filter(p => !buscaNorm || normalizar(p.nome).includes(buscaNorm));

  return (
    <div className="ch-root adm-root">
      <div className="adm-wrap">
        <div className="ch-cover-wrapper">
          <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
          <div className="ch-cover-inner"><img src="/images/capa.png" alt="Capa" className="ch-cover-img" /></div>
          <div className="ch-logo"><img src="/images/logoEmblema.png" alt="CAMFOR" className="ch-logo-img" /></div>
        </div>
        <div className="ch-content adm-head">
          <div className="ch-eyebrow">Agricultura Familiar</div>
          <h2 className="ch-title">Gerenciar produtos</h2>
          <div className="ch-rule" />
        </div>

        <div className="adm-toolbar">
          <div className="adm-search" style={{ margin: 0, flex: 1 }}>
            <IoSearchOutline size={18} color="rgba(247,244,236,.5)" />
            <input type="text" placeholder="Pesquisar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="adm-btn adm-btn-acc adm-add" onClick={handleAdd}><IoAddOutline size={18} /><span className="adm-add-txt">Adicionar produto</span></button>
        </div>

        {loading ? (
          <div className="adm-empty">Carregando produtos...</div>
        ) : filtrados.length === 0 ? (
          <div className="adm-empty">{searchTerm.trim() ? `Nenhum produto encontrado para "${searchTerm}".` : 'Nenhum produto cadastrado.'}</div>
        ) : (
          <div className="adm-plist">
            {filtrados.map((prod) => {
              const imgSrc = prod.imagem && prod.imagem.startsWith('http') ? prod.imagem : `/images/produtos/${prod.imagem}`;
              return (
                <div key={prod.docId} className="adm-prow">
                  <img src={imgSrc} alt={prod.nome} loading="lazy" decoding="async" onError={handleImageError} />
                  <div className="adm-prow-info">
                    <span className="nm">{prod.nome}</span>
                    <span className="adm-prow-unit">{UNIT_LABEL[prod.unidade] || 'Peso'}</span>
                  </div>
                  <button className="adm-editbtn" onClick={() => handleEdit(prod)}>Editar</button>
                  <button className="adm-iconbtn del" onClick={() => setShowDeleteConfirm(prod)} title="Excluir"><IoTrashOutline /></button>
                </div>
              );
            })}
          </div>
        )}

        <div className="adm-savebar" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 8 }}>
          <div className="c">
            {searchTerm.trim()
              ? `${filtrados.length} de ${produtos.length} produto(s)`
              : `${produtos.length} produto(s) cadastrado(s)`}
          </div>
        </div>
      </div>

      <div className="ch-apoio-eyebrow">Apoio</div>
      <div className="ch-logos-bottom"><img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" /><img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" /></div>

      {/* Modal de formulário (adicionar/editar) */}
      {showForm && (
        <div className="adm-modal-backdrop" onClick={handleCancelForm}>
          <div className="adm-modal adm-modal-form" onClick={(e) => e.stopPropagation()}>
            <h3 className="adm-modal-title">{editingProduct ? 'Editar produto' : 'Novo produto'}</h3>

            <label className="adm-flabel">Nome do produto</label>
            <input className="adm-finput" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Banana" />

            <label className="adm-flabel">Foto do produto</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            <button type="button" className="adm-upload" onClick={triggerFileInput}>
              <IoCameraOutline size={18} /> {imageFile ? 'Trocar foto' : 'Selecionar foto'}
            </button>
            {imagePreview && (
              <div className="adm-preview">
                <img src={imagePreview} alt="Preview" onError={handleImageError} />
                {imageFile && <div className="adm-preview-name">{imageFile.name}</div>}
              </div>
            )}

            <label className="adm-flabel">Tipo de medida</label>
            <div className="adm-units">
              <button type="button" className={`adm-unit ${unidade === 'g' ? 'sel' : ''}`} onClick={() => setUnidade('g')}>
                <span className="ic"><IoScaleOutline size={22} /></span><span className="t">Peso</span><span className="d">200g a 1kg</span>
              </button>
              <button type="button" className={`adm-unit ${unidade === 'un' ? 'sel' : ''}`} onClick={() => setUnidade('un')}>
                <span className="ic"><IoLeafOutline size={22} /></span><span className="t">Unidade</span><span className="d">1 maço/un.</span>
              </button>
              <button type="button" className={`adm-unit ${unidade === 'pct' ? 'sel' : ''}`} onClick={() => setUnidade('pct')}>
                <span className="ic"><IoFileTrayOutline size={22} /></span><span className="t">Bandeja</span><span className="d">1 bandeja</span>
              </button>
            </div>

            <div className="adm-modal-actions" style={{ marginTop: 20 }}>
              <button className="adm-modal-btn ghost" onClick={handleCancelForm} disabled={saving}>Cancelar</button>
              <button className="adm-modal-btn primary" onClick={handleSave} disabled={saving || !nome.trim() || (!editingProduct && !imageFile)}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="adm-modal-backdrop" onClick={() => setShowDeleteConfirm(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-icon warn">!</div>
            <h3 className="adm-modal-title">Excluir produto?</h3>
            <p className="adm-modal-text">Deseja excluir <strong style={{ color: '#fff' }}>{showDeleteConfirm.nome}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="adm-modal-actions">
              <button className="adm-modal-btn ghost" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className="adm-modal-btn danger" onClick={() => handleDelete(showDeleteConfirm)}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de feedback */}
      {popup.show && (
        <div className="adm-modal-backdrop" onClick={closePopup}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`adm-modal-icon ${popup.type === 'success' ? 'ok' : popup.type === 'error' ? 'err' : 'warn'}`}>
              {popup.type === 'success' ? '✓' : popup.type === 'error' ? '✕' : '!'}
            </div>
            <h3 className="adm-modal-title">{popup.type === 'success' ? 'Sucesso!' : popup.type === 'error' ? 'Erro' : 'Atenção'}</h3>
            <p className="adm-modal-text">{popup.message}</p>
            <div className="adm-modal-actions">
              <button className="adm-modal-btn primary" onClick={closePopup}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
