// Gera a imagem "Cesta do dia" (story 941x1672) sobre o template fixo,
// desenhando a lista de itens de hoje e os 3 valores das cestas.
// Remove o fundo branco de cada foto na hora (floodfill a partir das bordas),
// preservando o branco interno do produto — então itens novos funcionam sozinhos.

const TEMPLATE_SRC = '/images/storyDiario.png';
const W = 941;
const H = 1672;

// Coordenadas (no espaço 941x1672), calibradas pelo diff com storyCompleto.png
const ITEMS_BOX = { x: 76, y: 640, w: 580, h: 568 }; // área pontilhada "Itens de hoje"
const ITEM_COLS = 2;
const ROW_H_MAX = 71; // ritmo das linhas na arte de referência (16 itens / 8 linhas)
// Centros das plaquinhas (medidos no template). Valor centralizado em VALUE_Y;
// "R$" no canto superior-esquerdo da madeira.
const PRICE_SLOTS = [196, 464, 730];
const VALUE_Y = 1423;
const VALUE_FONT = 58;
const RS_DX = -98; // deslocamento do "R$" para o canto esquerdo
const RS_DY = -34;

function loadImage(src, cross) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cross) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Remove o branco conectado às bordas (floodfill). Mantém branco interno.
function cutWhite(img, tol = 38) {
  const c = document.createElement('canvas');
  const w = (c.width = img.naturalWidth);
  const h = (c.height = img.naturalHeight);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  let data;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch (e) {
    return c; // canvas "tainted" (CORS) — devolve com fundo
  }
  const px = data.data;
  const isWhite = (i) => px[i] > 255 - tol && px[i + 1] > 255 - tol && px[i + 2] > 255 - tol;
  const stack = [];
  const visited = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) { stack.push(x); stack.push(x + (h - 1) * w); }
  for (let y = 0; y < h; y++) { stack.push(y * w); stack.push(w - 1 + y * w); }
  while (stack.length) {
    const p = stack.pop();
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    if (!isWhite(i)) continue;
    px[i + 3] = 0; // transparente
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

function drawCheck(ctx, x, y, s) {
  // quadradinho arredondado com check verde (estilo da arte)
  const r = 6;
  ctx.save();
  ctx.strokeStyle = '#2f7d32';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, r);
  ctx.stroke();
  ctx.strokeStyle = '#2f7d32';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.22, y + s * 0.55);
  ctx.lineTo(x + s * 0.42, y + s * 0.74);
  ctx.lineTo(x + s * 0.8, y + s * 0.28);
  ctx.stroke();
  ctx.restore();
}

function fitDraw(ctx, src, cx, cy, box) {
  // desenha o canvas/imagem `src` centralizado em (cx,cy) cabendo em box x box
  const sw = src.width, sh = src.height;
  const scale = Math.min(box / sw, box / sh);
  const dw = sw * scale, dh = sh * scale;
  ctx.drawImage(src, cx - dw / 2, cy - dh / 2, dw, dh);
}

/**
 * @param {Object} opts
 * @param {Array<{name:string, src:string}>} opts.items
 * @param {{['10']:number, ['15']:number, ['18']:number}} opts.prices
 * @param {number} [opts.scale] fator de resolução (2 = mais nítido)
 * @returns {Promise<string>} dataURL PNG
 */
export async function generateStoryDataUrl({ items = [], prices = {}, scale = 2 }) {
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('400 52px "Bebas Neue"'),
        document.fonts.load('400 86px "Anton"'),
      ]);
    } catch (e) { /* ignore */ }
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = 'high';

  const tpl = await loadImage(TEMPLATE_SRC);
  ctx.drawImage(tpl, 0, 0, W, H);

  // ---- Itens (ordem alfabética, pt-BR) ----
  const list = items.slice(0, 18)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
  const rows = Math.ceil(list.length / ITEM_COLS);
  const colW = ITEMS_BOX.w / ITEM_COLS;
  const rowH = Math.min(ROW_H_MAX, ITEMS_BOX.h / Math.max(rows, 1));
  const thumb = Math.min(rowH * 0.84, 62);

  // carrega/recorta imagens em paralelo (silenciando falhas)
  const cuts = await Promise.all(list.map(async (it) => {
    try {
      const remote = /^https?:/i.test(it.src);
      const img = await loadImage(it.src, remote);
      return cutWhite(img);
    } catch (e) { return null; }
  }));

  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  list.forEach((it, idx) => {
    // coluna a coluna: alfabético desce a coluna esquerda e depois a direita
    const col = idx < rows ? 0 : 1;
    const row = idx < rows ? idx : idx - rows;
    const cy = ITEMS_BOX.y + rowH * row + rowH / 2;
    const x0 = ITEMS_BOX.x + colW * col;
    // thumb (foto recortada) à esquerda
    const thumbCx = x0 + 6 + thumb / 2;
    const cut = cuts[idx];
    if (cut) fitDraw(ctx, cut, thumbCx, cy, thumb);
    // nome em MAIÚSCULAS, verde, negrito
    ctx.font = `400 ${Math.min(rowH * 0.7, 46)}px "Bebas Neue", sans-serif`;
    ctx.fillStyle = '#184F1F';
    ctx.textAlign = 'left';
    const nameX = thumbCx + thumb / 2 + 14;
    let name = (it.name || '').toUpperCase();
    const maxW = x0 + colW - nameX - 6;
    while (ctx.measureText(name).width > maxW && name.length > 3) name = name.slice(0, -1);
    if (name !== (it.name || '').toUpperCase()) name = name.trim() + '…';
    ctx.fillText(name, nameX, cy + 1);
  });
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // ---- Valores das cestas (Anton, itálico ~10°, branco com sombra) ----
  ['10', '15', '18'].forEach((k, i) => {
    const cx = PRICE_SLOTS[i];
    const val = Number(prices[k] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    // "R$" pequeno, no canto superior-esquerdo da plaqueta
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = '400 30px "Anton", sans-serif';
    ctx.fillText('R$', cx + RS_DX, VALUE_Y + RS_DY);
    ctx.restore();
    // valor, inclinado, com sombra suave
    ctx.save();
    ctx.translate(cx, VALUE_Y);
    ctx.transform(1, 0, -0.176, 1, 0, 0); // ~10° de inclinação
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `400 ${VALUE_FONT}px "Anton", sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 6;
    ctx.fillText(val, 0, 0);
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}
