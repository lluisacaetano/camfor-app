import React from 'react';
import './Loading.css';

export default function Loading({ message = 'Carregando...' }) {
  return (
    <div className="ld-root">
      <div className="ld-box">
        <img src="/images/logoImagem.png" alt="CAMFOR" className="ld-logo" />
        <div className="ld-spinner" aria-hidden="true" />
        <div className="ld-text">{message}</div>
      </div>
    </div>
  );
}
