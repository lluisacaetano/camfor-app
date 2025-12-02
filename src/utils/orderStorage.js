export function saveOrder(orderData) {
  try {
    const orders = JSON.parse(localStorage.getItem('camfor_orders')) || [];
    const newOrder = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...orderData
    };
    orders.push(newOrder);
    localStorage.setItem('camfor_orders', JSON.stringify(orders));
    return newOrder;
  } catch (e) {
    console.warn('Erro ao salvar pedido', e);
    return null;
  }
}

export function getOrders() {
  try {
    return JSON.parse(localStorage.getItem('camfor_orders')) || [];
  } catch (e) {
    console.warn('Erro ao carregar pedidos', e);
    return [];
  }
}

export function getOrderById(id) {
  try {
    const orders = getOrders();
    return orders.find(o => o.id === id);
  } catch (e) {
    console.warn('Erro ao buscar pedido', e);
    return null;
  }
}
