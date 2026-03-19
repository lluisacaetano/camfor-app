import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToOrders } from '../services/firestoreService';

// Cria AudioContext para gerar som de notificação
let audioContext = null;

function playNotificationBeep() {
  try {
    // Cria AudioContext apenas quando necessário
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Retoma o contexto se estiver suspenso (política de autoplay)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Som de notificação - duas notas (ding-dong)
    const now = audioContext.currentTime;

    // Primeira nota (ding)
    oscillator.frequency.setValueAtTime(830, now); // G#5
    oscillator.frequency.setValueAtTime(1046, now + 0.15); // C6 (segunda nota - dong)

    oscillator.type = 'sine';

    // Volume com fade out suave
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.setValueAtTime(0.4, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    oscillator.start(now);
    oscillator.stop(now + 0.6);
  } catch (e) {
    console.warn('Não foi possível tocar som de notificação:', e);
  }
}

export default function useOrderNotifications(isAdminLoggedIn) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousOrdersRef = useRef(null);
  const originalTitleRef = useRef(document.title);

  // Toca o som de notificação
  const playSound = useCallback(() => {
    playNotificationBeep();
  }, []);

  // Pisca o título quando há notificações
  useEffect(() => {
    const originalTitle = originalTitleRef.current;

    if (unreadCount === 0) {
      document.title = originalTitle;
      return;
    }

    let visible = true;
    const interval = setInterval(() => {
      document.title = visible
        ? `(${unreadCount}) Novo Pedido! - CAMFOR`
        : originalTitle;
      visible = !visible;
    }, 1000);

    return () => {
      clearInterval(interval);
      document.title = originalTitle;
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
