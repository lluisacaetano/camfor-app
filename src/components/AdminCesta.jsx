import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../supabaseCliente'; // <--- Importando Supabase
import './AdminCesta.css';
import { handleImageError } from '../utils/imageUtils';

const produtos = [
  'Abacate', 'Abacaxi', 'Abóbora', 'Abobrinha Italiana', 'Abobrinha Caipira', 'Acelga', 'Acerola',
  'Agrião', 'Alface', 'Alho', 'Alho Poró', 'Almeirão', 'Banana', 'Batata', 'Batata Doce',
  'Beterraba', 'Biscoito', 'Rosquinha', 'Brócolis Chinês', 'Brócolis Ramoso', 'Cara', 'Cebola',
  'Cebolinha', 'Cenoura', 'Chicória', 'Chuchu', 'Couve', 'Couve Flor', 'Espinafre', 'Goiaba',
  'Inhame', 'Inhame Cabeça', 'Jabuticaba', 'Jilo', 'Laranja', 'Limão', 'Maçã', 'Mamão',
  'Mandioca Congelada', 'Manga', 'Maracujá', 'Melão', 'Laranjinha', 'Mexerica', 'Milho',
  'Mostarda', 'Pera', 'Pêssego', 'Pimentão', 'Repolho', 'Rúcula', 'Salsinha', 'Tomate', 'Vagem'
];

function getImgSrc(nome) {
  const imgMap = {
    'Abacate': 'abacate.jpg',
    'Abacaxi': 'abacaxi.jpg',
    'Abóbora': 'abobora.jpg',
    'Abobrinha Italiana': 'abobrinhaitaliana.jpg',
    'Abobrinha Caipira': 'abobrinhacaipira.jpg',
    'Acelga': 'acelga.png',
    'Acerola': 'acerola.jpg',
    'Agrião': 'agriao.jpg',
    'Alface': 'alface.jpeg',
    'Alho': 'alho.jpg',
    'Alho Poró': 'alhoPoro.jpg',
    'Almeirão': 'almeirao.jpeg',
    'Banana': 'banana.jpg',
    'Batata': 'batata.jpg',
    'Batata Doce': 'batataDoce.jpg',
    'Beterraba': 'beterraba.jpg',
    'Biscoito': 'biscoito.jpg',
    'Rosquinha': 'rosquinha.png',
    'Brócolis Chinês': 'brocolisChines.jpg',
    'Brócolis Ramoso': 'brocolisRamoso.png',
    'Cara': 'cara.jpg',
    'Cebola': 'cebola.jpg',
    'Cebolinha': 'cebolinha.jpg',
    'Cenoura': 'cenoura.jpg',
    'Chicória': 'chicoria.jpg',
    'Chuchu': 'chuchu.jpg',
    'Couve': 'couve.jpg',
    'Couve Flor': 'couveFlor.jpg',
    'Espinafre': 'espinafre.jpg',
    'Goiaba': 'goiaba.jpg',
    'Inhame': 'inhame.jpg',
    'Inhame Cabeça': 'inhameCabeca.jpg',
    'Jabuticaba': 'jabuticaba.jpg',
    'Jilo': 'jilo.jpg',
    'Laranja': 'laranja.jpg',
    'Limão': 'limao.jpeg',
    'Maçã': 'maca.jpg',
    'Mamão': 'mamao.jpg',
    'Mandioca Congelada': 'mandiocaCongelada.png',
    'Manga': 'manga.jpg',
    'Maracujá': 'maracuja.jpg',
    'Melão': 'melao.jpg',
    'Laranjinha': 'laranjinha.png',
    'Mexerica': 'mexerica.jpg',
    'Milho': 'milho.jpg',
    'Mostarda': 'mostarda.jpg',
    'Pera': 'pera.jpg',
    'Pêssego': 'pessego.jpg',
    'Pimentão': 'pimentao.jpg',
    'Repolho': 'repolho.jpg',
    'Rúcula': 'rucula.jpg',
    'Salsinha': 'salsinha.png',
    'Tomate': 'tomate.jpg',
    'Vagem': 'vagem.png'
  };

  return `/images/produtos/${imgMap[nome] || nome.toLowerCase().replace(/\s+/g, '') + '.jpg'}`;
}

export default function AdminCesta({ onBack }) {
  const [selecionados, setSelecionados] = useState([]);
  const [valor10, setValor10] = useState('');
  const [valor15, setValor15] = useState('');
  const [valor18, setValor18] = useState('');
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [saving, setSaving] = useState(false);  // Estado de salvamento

  // --- Função auxiliar de formatação ---
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

  // --- 1. CARREGAR DO SUPABASE AO INICIAR ---
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const { data, error } = await supabase
            .from('store_config')
            .select('active_products, prices')
            .eq('id', 1)
            .single();

        if (error) throw error;

        if (data) {
          // Preenche os produtos selecionados
          setSelecionados(data.active_products || []);

          // Preenche os preços
          const p = data.prices || {};
          if (p[10]) setValor10(formatBRL(String(Math.round(p[10] * 100))));
          if (p[15]) setValor15(formatBRL(String(Math.round(p[15] * 100))));
          if (p[18]) setValor18(formatBRL(String(Math.round(p[18] * 100))));
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        alert('Erro ao carregar dados do servidor.');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Validação
  const totalSelected = selecionados.length;
  const v10 = parseBRL(valor10);
  const v15 = parseBRL(valor15);
  const v18 = parseBRL(valor18);
  const canSave = totalSelected >= 1 && v10 > 0 && v15 > 0 && v18 > 0;

  function handleCheck(nome) {
    setSelecionados(sel => {
      if (sel.includes(nome)) {
        return sel.filter(n => n !== nome);
      }
      if (sel.length >= 18) {
        alert('Você já selecionou o máximo de 18 itens.');
        return sel;
      }
      return [...sel, nome];
    });
  }

  // --- 2. SALVAR NO SUPABASE ---
  async function handleSalvar() {
    if (selecionados.length < 1) {
      alert('Selecione pelo menos 1 item.');
      return;
    }
    const v10 = parseBRL(valor10);
    const v15 = parseBRL(valor15);
    const v18 = parseBRL(valor18);

    if (!v10 || !v15 || !v18) {
      alert('Preencha todos os valores das cestas.');
      return;
    }

    setSaving(true);
    try {
      // Objeto de preços para salvar no JSONB
      const precosParaSalvar = { 10: v10, 15: v15, 18: v18 };

      const { error } = await supabase
          .from('store_config')
          .update({
            active_products: selecionados,
            prices: precosParaSalvar,
            updated_at: new Date()
          })
          .eq('id', 1);

      if (error) throw error;

      alert('Configuração salva com sucesso!');
      onBack && onBack();

    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar alterações. Verifique sua conexão ou permissões.');
    } finally {
      setSaving(false);
    }
  }

  return (
      <div className="ch-root">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              <div className="ch-cover-wrapper">
                <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
                <div className="ch-cover-inner">
                  <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
                </div>
                <div className="ch-logo">
                  <img src="/images/logo.png" alt="CAMFOR" className="ch-logo-img" />
                </div>
              </div>
              <h2 className="ch-title">SELECIONAR PRODUTOS</h2>

              {/* Loading Indicator */}
              {loading ? (
                  <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>Carregando dados...</div>
              ) : (
                  <>
                    <div className="admin-note" style={{ marginBottom: 8, marginTop: -10 }}>
                      <div className="admin-remaining" style={{ marginTop: 6 }}>
                        {totalSelected === 0
                            ? 'Selecione os itens que deseja incluir na cesta.'
                            : `Você selecionou ${totalSelected} item${totalSelected > 1 ? 's' : ''}.`}
                      </div>
                    </div>

                    <div className="admin-prod-list">
                      {produtos.map((nome) => {
                        const imgSrc = getImgSrc(nome);
                        const isDisabled = !selecionados.includes(nome) && selecionados.length >= 18;
                        return (
                            <label
                                key={nome}
                                className={`admin-prod-item ${isDisabled ? 'admin-prod-item--disabled' : ''}`}
                                aria-disabled={isDisabled ? 'true' : 'false'}
                            >
                              <input
                                  type="checkbox"
                                  checked={selecionados.includes(nome)}
                                  onChange={() => handleCheck(nome)}
                                  disabled={isDisabled}
                              />
                              <img
                                  src={imgSrc}
                                  alt={nome}
                                  className="admin-prod-img"
                                  onError={handleImageError}
                              />
                              <span className="admin-prod-name">{nome}</span>
                            </label>
                        );
                      })}
                    </div>
                    <div className="admin-values">
                      <label className="admin-label">Valor da Cesta Pequena (10 itens)</label>
                      <input
                          className="admin-input"
                          type="text"
                          placeholder="R$ 0,00"
                          value={valor10}
                          onChange={e => setValor10(formatBRL(e.target.value))}
                      />
                      <label className="admin-label">Valor da Cesta Média (15 itens)</label>
                      <input
                          className="admin-input"
                          type="text"
                          placeholder="R$ 0,00"
                          value={valor15}
                          onChange={e => setValor15(formatBRL(e.target.value))}
                      />
                      <label className="admin-label">Valor da Cesta Grande (18 itens)</label>
                      <input
                          className="admin-input"
                          type="text"
                          placeholder="R$ 0,00"
                          value={valor18}
                          onChange={e => setValor18(formatBRL(e.target.value))}
                      />
                    </div>
                    <div className="d-grid gap-3 mb-4 ch-btn-group" style={{ marginTop: '18px' }}>
                      <button
                          className="ch-btn"
                          onClick={handleSalvar}
                          disabled={!canSave || saving}
                          title={!canSave ? 'Selecione ao menos 1 item e preencha todos os valores' : 'Salvar configuração'}
                      >
                        {saving ? 'SALVANDO...' : 'SALVAR'}
                      </button>
                    </div>
                  </>
              )}
            </div>
          </div>
        </div>
        <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
      </div>
  );
}