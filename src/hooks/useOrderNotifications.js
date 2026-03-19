import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToOrders } from '../services/firestoreService';

// Som de notificação em base64 (beep curto)
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkYuEgHZ1eX+Fh4uHgoB7eX1+goSGh4eGhYOBgH9+foCBgoKDg4ODg4KBgYCAf39/f4CAgIGBgYGBgYGBgIGAgYCAgIGAgICAgYGBgYGBgYCAgICAgIGBgYGBgYGBgYGBgYGBgYGAgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgIGBgYGBgYCBgYGBgYGBgYGAgIGBgYGBgYCAgYGBgYGBgICAgICBgYGBgICAgYGBgYCAgICAgYGBgICAgICBgYGAgICAgIGBgICAgICBgYCAgICAgYGAgICAgICBgICAgICAgYCAgICAgIGAgICAgICBgICAgICAgYCAgICAgIGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';

export default function useOrderNotifications(isAdminLoggedIn) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousOrdersRef = useRef(null);
  const audioRef = useRef(null);
  const originalTitleRef = useRef(document.title);

  // Inicializa o audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;
  }, []);

  // Toca o som de notificação
  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Navegador bloqueou autoplay - ignora silenciosamente
      });
    }
  }, []);

  // Atualiza o título da aba
  const updateTitle = useCallback((count) => {
    if (count > 0) {
      document.title = `(${count}) Novo Pedido! - CAMFOR`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, []);

  // Pisca o título quando há notificações
  useEffect(() => {
    if (unreadCount === 0) {
      document.title = originalTitleRef.current;
      return;
    }

    let visible = true;
    const interval = setInterval(() => {
      document.title = visible
        ? `(${unreadCount}) Novo Pedido! - CAMFOR`
        : originalTitleRef.current;
      visible = !visible;
    }, 1000);

    return () => {
      clearInterval(interval);
      document.title = originalTitleRef.current;
    };
  }, [unreadCount]);

  // Adiciona uma nova notificação
  const addNotification = useCallback((order) => {
    const notification = {
      id: Date.now(),
      orderId: order.docId,
      clientName: order.nome || 'Cliente',
      items: order.items?.length || 0,
      tipo: order.tipo || 'retirada',
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Mantém últimas 10
    setUnreadCount(prev => prev + 1);
    playSound();
  }, [playSound]);

  // Remove uma notificação específica
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Limpa todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Marca como lido (reseta contador)
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Escuta pedidos em tempo real
  useEffect(() => {
    if (!isAdminLoggedIn) {
      previousOrdersRef.current = null;
      return;
    }

    const unsubscribe = subscribeToOrders((ordersList) => {
      // Na primeira carga, apenas armazena os IDs existentes
      if (previousOrdersRef.current === null) {
        previousOrdersRef.current = new Set(ordersList.map(o => o.docId));
        return;
      }

      // Detecta novos pedidos
      const currentIds = new Set(ordersList.map(o => o.docId));
      const previousIds = previousOrdersRef.current;

      ordersList.forEach(order => {
        if (!previousIds.has(order.docId)) {
          // Novo pedido detectado!
          addNotification(order);
        }
      });

      previousOrdersRef.current = currentIds;
    });

    return () => unsubscribe();
  }, [isAdminLoggedIn, addNotification]);

  return {
    notifications,
    unreadCount,
    dismissNotification,
    clearAllNotifications,
    markAsRead
  };
}
