import type { Aniversariante } from './aniversariantes';

export type TemaAniversario = 'masculino' | 'feminino' | 'neutro';

const LARGURA = 1080;
const ALTURA = 1440;
const CENTRO = LARGURA / 2;

export async function carregarFotoCanvas(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar a fotografia para o PNG. Confira as permissões de leitura e CORS do Storage.'));
    img.src = url;
  });
}

function circulo(ctx: CanvasRenderingContext2D, x: number, y: number, raio: number, cor: string) {
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2);
  ctx.fillStyle = cor;
  ctx.fill();
}

function desenharFoto(ctx: CanvasRenderingContext2D, foto: HTMLImageElement | null, nome: string) {
  const fx = 238, fy = 274, fw = 604, fh = 724;
  const borda = 15;
  const px = fx + borda, py = fy + borda, pw = fw - borda * 2, ph = fh - borda * 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(fx, fy, fw, fh);
  ctx.fillStyle = '#e5e9ed';
  ctx.fillRect(px, py, pw, ph);

  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();

  if (foto && foto.naturalWidth > 0 && foto.naturalHeight > 0) {
    const iw = foto.naturalWidth, ih = foto.naturalHeight;
    // Uma camada de fundo cobre o retângulo, sem deixar faixas vazias.
    // O retrato principal usa 'contain': não corta cabeça, rosto nem ombros.
    const fundoEscala = Math.max(pw / iw, ph / ih);
    ctx.globalAlpha = 0.22;
    ctx.drawImage(foto, px + (pw - iw * fundoEscala) / 2, py + (ph - ih * fundoEscala) / 2, iw * fundoEscala, ih * fundoEscala);
    ctx.globalAlpha = 1;
    const escala = Math.min(pw / iw, ph / ih);
    const w = iw * escala, h = ih * escala;
    ctx.drawImage(foto, px + (pw - w) / 2, py + (ph - h) / 2, w, h);
  } else {
    const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'CI';
    const gradient = ctx.createLinearGradient(px, py, px + pw, py + ph);
    gradient.addColorStop(0, '#7299bb');
    gradient.addColorStop(1, '#24486f');
    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, pw, ph);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '700 144px Arial, sans-serif';
    ctx.fillText(iniciais, CENTRO, py + ph / 2);
  }
  ctx.restore();
}

function linhasDoNome(ctx: CanvasRenderingContext2D, nome: string, largura: number): string[] {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let linha = '';
  for (const parte of partes) {
    const candidata = linha ? `${linha} ${parte}` : parte;
    if (linha && ctx.measureText(candidata).width > largura) {
      linhas.push(linha);
      linha = parte;
    } else linha = candidata;
  }
  if (linha) linhas.push(linha);
  return linhas;
}

function desenharNome(ctx: CanvasRenderingContext2D, nome: string) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  const nomeSeguro = (nome || 'Servidor CIAPI').trim();
  let fontSize = 64;
  let linhas: string[] = [];
  do {
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    linhas = linhasDoNome(ctx, nomeSeguro, 940);
    if (linhas.length <= 2) break;
    fontSize -= 3;
  } while (fontSize > 36);
  // Para nome longo, diminui a fonte mantendo até duas linhas e sem encobrir a mensagem.
  if (linhas.length > 2) {
    fontSize = 36;
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    linhas = linhasDoNome(ctx, nomeSeguro, 985);
  }
  const alturaLinha = fontSize + 8;
  const baseline = linhas.length === 1 ? 1072 : 1048;
  linhas.forEach((linha, i) => ctx.fillText(linha, CENTRO, baseline + i * alturaLinha, 980));
}

export async function criarCardPNG(
  p: Aniversariante,
  tema: TemaAniversario,
  fotoUrl: string
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não permite exportação por Canvas.');

  const fundo = ctx.createLinearGradient(0, 0, LARGURA, ALTURA);
  fundo.addColorStop(0, '#0c2d55');
  fundo.addColorStop(1, tema === 'feminino' ? '#565080' : tema === 'neutro' ? '#32627b' : '#17669f');
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  const tons = tema === 'feminino'
    ? ['#d5a4d8', '#a3a7e0', '#b5cce9']
    : ['#749ec1', '#5088b6', '#91b8d5'];
  const decoracoes = [
    [96, 75, 38], [265, 230, 58], [629, 264, 53], [985, 306, 55],
    [87, 578, 74], [840, 545, 60], [984, 825, 89], [242, 872, 66],
    [83, 1098, 39], [443, 1138, 40], [814, 1185, 38],
  ];
  ctx.save();
  ctx.globalAlpha = 0.32;
  decoracoes.forEach(([x, y, r], i) => circulo(ctx, x, y, r, tons[i % tons.length]));
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd98c';
  ctx.font = '700 58px Arial, sans-serif';
  ctx.fillText('FELIZ ANIVERSÁRIO!', CENTRO, 164, 1000);
  ctx.fillStyle = '#ffffff';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText('O RH CIAPI celebra este dia especial', CENTRO, 236, 1030);

  // Carregar antes de desenhar: nunca baixar foto cortada ou ausente por falha silenciosa.
  const foto = await carregarFotoCanvas(fotoUrl);
  desenharFoto(ctx, foto, p.nomeCurto);
  desenharNome(ctx, p.nomeCurto);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '31px Arial, sans-serif';
  ctx.fillText('Que seu novo ciclo seja repleto de saúde,', CENTRO, 1220, 1010);
  ctx.fillText('alegria e realizações!', CENTRO, 1271, 1010);
  ctx.fillStyle = '#ffd98c';
  ctx.font = '700 32px Arial, sans-serif';
  ctx.fillText('Com carinho, equipe CIAPI', CENTRO, 1351, 1020);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível criar o arquivo PNG.');
  const link = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = link;
  const nomeArquivo = p.nomeCurto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  anchor.download = `Aniversario_${nomeArquivo}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(link), 2000);
}
