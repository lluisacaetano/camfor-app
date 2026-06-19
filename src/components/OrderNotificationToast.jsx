import React, { useEffect } from 'react';
import { IoNotificationsOutline } from 'react-icons/io5';
import './OrderNotificationToast.css';

const fmtBRL = (v) => {
  try { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  catch { return 'R$ 0,00'; }
};

export default function OrderNotificationToast({ notifications, onDismiss, onViewOrders }) {
  // Auto-dismiss após 8 segundos
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map(notification =>
      setTimeout(() => onDismiss(notification.id), 8000)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="ont-container">
      {notifications.slice(0, 3).map(notification => (
        <div
          key={notification.id}
          className="ont-toast"
          onClick={() => onViewOrders && onViewOrders(notification.orderId)}
        >
          <button
            className="ont-close"
            onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
            aria-label="Fechar notificação"
          >
            ×
          </button>
          <div className="ont-icon"><IoNotificationsOutline /></div>
          <div className="ont-content">
            <div className="ont-eyebrow"><span className="ont-dot" /> Novo pedido</div>
            <div className="ont-name">{notification.clientName}</div>
            <div className="ont-meta">
              {notification.items} {notification.items === 1 ? 'item' : 'itens'} · {notification.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
              {notification.total ? ` · ${fmtBRL(notification.total)}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
