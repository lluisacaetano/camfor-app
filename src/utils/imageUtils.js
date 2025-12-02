export function handleImageError(e) {
  const cur = e.currentTarget;
  const src = cur.src || '';
  
  if (src.match(/\.jpg$/i)) {
    cur.src = src.replace(/\.jpg$/i, '.jpeg');
  } else if (src.match(/\.jpeg$/i)) {
    cur.src = src.replace(/\.jpeg$/i, '.png');
  } else if (src.match(/\.png$/i)) {
    cur.src = src.replace(/\.png$/i, '.jpg');
  } else {
    cur.src = '/images/placeholder.png';
  }
}
