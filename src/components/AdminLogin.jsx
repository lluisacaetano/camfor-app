import { useState } from 'react';
import './AdminLogin.css';

export default function AdminLogin({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [isLogged, setIsLogged] = useState(false);

  const validateEmail = (value) => {
    return value.includes('@');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email inválido. Deve conter "@"');
      return;
    }

    if (!password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    // Verificar credenciais
    if (email === 'admin@admin' && password === 'admin') {
      // Login bem-sucedido
      setIsLogged(true);
      localStorage.setItem('adminLogged', 'true');
      setTimeout(() => {
        onLoginSuccess && onLoginSuccess();
      }, 500);
    } else {
      setError('Email ou senha incorretos');
    }
  };

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
                <img src="/images/logoImagem.png" alt="CAMFOR" className="ch-logo-img" />
              </div>
            </div>

            <div className="admin-login-container-inner">
              <div className="admin-login-box">
                <h1>LOGIN ADMINISTRADOR</h1>
                
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email"
                      className="input-field"
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
                    />
                  </div>

                  <button type="submit" className="login-button">
                    Entrar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <img src="/images/logo-sicoob.png" alt="SICOOB" className="ch-sicoob-bottom" />
    </div>
  );
}
