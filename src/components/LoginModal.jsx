import { useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { loginAdmin } from '../services/authService';
import './LoginModal.css';

export default function LoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('E-mail é obrigatório'); return; }
    if (!email.includes('@')) { setError('E-mail inválido. Deve conter "@"'); return; }
    if (!password.trim()) { setError('Senha é obrigatória'); return; }

    setLoading(true);
    try {
      await loginAdmin(email, password);
      setTimeout(() => { onSuccess && onSuccess(); }, 300);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="lm-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lm-card" onClick={(e) => e.stopPropagation()}>
        <button className="lm-close" onClick={onClose} aria-label="Fechar"><IoCloseOutline /></button>

        <div className="lm-medal"><img src="/images/logoEmblema.png" alt="CAMFOR" /></div>
        <div className="lm-eyebrow">Área administrativa</div>
        <h2 className="lm-title">Acesso restrito</h2>
        <p className="lm-sub">Entre para gerenciar produtos e pedidos do dia.</p>

        {error && <div className="lm-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="lm-field">
            <label htmlFor="lm-email">E-mail</label>
            <input
              id="lm-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>
          <div className="lm-field">
            <label htmlFor="lm-senha">Senha</label>
            <input
              id="lm-senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          <button type="submit" className="lm-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button type="button" className="lm-back" onClick={onClose}>← Voltar à loja</button>
      </div>
    </div>
  );
}
