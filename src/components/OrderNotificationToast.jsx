import React, { useEffect } from 'react';
import './OrderNotificationToast.css';

export default function OrderNotificationToast({ notifications, onDismiss, onViewOrders }) {
  // Auto-dismiss após 8 segundos
  useEffect(() => {
    if (notifications.length === 0) return;

    const timers = notifications.map(notification => {
      return setTimeout(() => {
        onDismiss(notification.id);
      }, 8000);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="ont-container">
      {notifications.slice(0, 3).map(notification => (
        <div key={notification.id} className="ont-toast" onClick={() => onViewOrders && onViewOrders()}>
          <div className="ont-icon">
            <span className="ont-bell">🔔</span>
          </div>
          <div className="ont-content">
            <div className="ont-title">Novo Pedido!</div>
            <div className="ont-message">
              <strong>{notification.clientName}</strong>
            </div>
            <div className="ont-details">
              {notification.items} {notification.items === 1 ? 'item' : 'itens'} • {notification.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
            </div>
          </div>
          <button
            className="ont-close"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }}
            aria-label="Fechar notificação"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
