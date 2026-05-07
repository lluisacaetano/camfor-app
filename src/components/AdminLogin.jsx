import { useState } from 'react';
import { loginAdmin } from '../services/authService';
import './AdminLogin.css';

export default function AdminLogin({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!email.includes('@')) {
      setError('Email inválido. Deve conter "@"');
      return;
    }

    if (!password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    setLoading(true);

    try {
      // Login real com Firebase Authentication
      await loginAdmin(email, password);

      // Login bem-sucedido
      setTimeout(() => {
        onLoginSuccess && onLoginSuccess();
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ch-root admin-login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="ch-cover-wrapper">
              <button className="cc-back" onClick={onBack} aria-label="Voltar">←</button>
              <div className="ch-cover-inner">
                <img src="/images/capa.jpg" alt="Capa" className="ch-cover-img" />
              </div>
              <div className="ch-logo">
                <img src="/images/logoImagem.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>

            <div className="admin-login-container-inner">
              <div className="admin-login-box">
                <h1>LOGIN ADMINISTRADOR</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        className="input-field"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Senha</label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="senha"
                        className="input-field"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="ch-logos-bottom">
        <img src="/images/logo-ifmg.png" alt="IFMG" className="ch-ifmg-bottom" />
        <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
      </div>
      <footer className="ch-footer-bar">
        <div className="ch-footer-content">
          <span className="ch-copyright-text">
            <span className="ch-copyright-symbol">©</span>
            <span className="ch-copyright-year"> 2026</span>
            <span className="ch-copyright-divider">|</span>
            <span className="ch-copyright-names">Desenvolvido por Luisa Caetano Araujo, Júlia Cristina Martins de Almeida Nakano, Maria Eduarda Siqueira Silva e Yasmin Stefane Faria</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
