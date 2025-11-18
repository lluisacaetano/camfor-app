# CAMFOR App

Aplicação frontend em React para pedidos de cestas de produtos da agricultura familiar (mobile-first).

## Resumo

- Permite escolher entre "Pedir cesta completa" ou "Montar minha cesta".
- Painel admin (localStorage) para configurar lista de produtos e preços por tamanho de cesta.
- Senha administrador = admin
- Horário de funcionamento: loja 07:00 — 17:00. Horário de entregas: 07:00 — 16:00.
- Reset diário automático das configurações administrativas às 17:00 (limpa chaves do localStorage).

## Rápido start

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Rodar em modo desenvolvimento:

   ```bash
   npm start
   ```

   Abrir [http://localhost:3000](http://localhost:3000)

## Build para produção

```bash
npm run build
```

## Estrutura relevante

- `src/components/CamforHome.jsx` — tela principal, controle de horários, overlay "LOJA FECHADA".
- `src/components/CestaDetalhes.jsx` — pedido de cesta completa (leitura de produtos/preços do localStorage).
- `src/components/MontarCesta.jsx` — montar cesta personalizada.
- `src/components/AdminCesta.jsx` — painel admin que salva `camfor_selected_items` e `camfor_prices` no localStorage.
- `src/components/Entrega.jsx`, `Retirada.jsx`, `FinalizarPedido.jsx`, `ResumoPedido.jsx` — fluxos de finalização.
- `src/components/*.css` — estilos por componente.
- `public/images` — imagens usadas (capa, logo, produtos, placeholder, logo-sicoob).
- Favicon: definido em runtime por CamforHome.

## Configuração de produtos e preços

- O Admin salva duas chaves no localStorage:
  - `camfor_selected_items` — array JSON com nomes dos produtos.
  - `camfor_prices` — objeto JSON com preços por tamanho: e.g. `{ "10": 30, "15": 45, "18": 55 }`.
- O app converte nomes para IDs de imagem (normalização) e tenta carregar `/images/produtos/{id}.jpg` (fallback para .jpeg ou placeholder).
- Para limpar manualmente: remover as chaves acima do localStorage ou usar o botão de reset no admin (se disponível).

## Comportamento de horários

- A validação de horário principal está em CamforHome. Quando fechada:
  - Os botões principais ficam desabilitados.
  - Aparece um backdrop com modal informando "LOJA FECHADA" e horários.
- Observação: entregas têm janela levemente diferente (07:00–16:00), tratada nas telas de entrega.

## Validações de pagamento

- Em Entrega, se pagamento em dinheiro com troco solicitado, o campo de troco precisa ser maior que o total do pedido (validação em centavos).

## Boas práticas

- Imagens de produtos devem ser nomeadas conforme a normalização (remover acentos e caracteres especiais, lowercase).
- Testar em mobile e desktop; o layout usa Bootstrap e estilos customizados.

## Contribuições / desenvolvimento

- Manter componentes pequenos e reusáveis.
- Atualizar README quando alterar horários ou lógica de reset.
