/**
 * Détection minimale des dimensions (largeur/hauteur en pixels) d'une image
 * PNG ou JPEG encodée en data URL, afin de l'intégrer dans un PDF sans la
 * déformer. jsPDF ne fournit pas cette information lui-même.
 */

interface ImageInfo {
  format: 'PNG' | 'JPEG';
  width: number;
  height: number;
}

function parsePng(buffer: Buffer): { width: number; height: number } | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function parseJpeg(buffer: Buffer): { width: number; height: number } | null {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let i = 2;
  while (i < buffer.length - 9) {
    if (buffer[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buffer[i + 1];
    if (marker === undefined) break;
    // Marqueurs sans segment de longueur
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) {
      return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
    }
    const length = buffer.readUInt16BE(i + 2);
    i += 2 + length;
  }
  return null;
}

/**
 * Extrait format + dimensions à partir d'une data URL `data:image/...;base64,...`.
 * Retourne `null` si le format n'est pas reconnu (ni PNG ni JPEG).
 */
export function getImageInfoFromDataUrl(dataUrl: string): ImageInfo | null {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1]?.toLowerCase();
  const base64 = match[2];
  if (!mime || !base64) return null;

  const buffer = Buffer.from(base64, 'base64');
  const format: ImageInfo['format'] = mime === 'png' ? 'PNG' : 'JPEG';
  const dimensions = format === 'PNG' ? parsePng(buffer) : parseJpeg(buffer);
  if (!dimensions) return null;

  return { format, width: dimensions.width, height: dimensions.height };
}
