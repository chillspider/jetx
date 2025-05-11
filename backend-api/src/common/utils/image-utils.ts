import { isURL } from 'class-validator';
import mime from 'mime';
import path from 'path';

import { ImageFile } from '../types/image-file.type';

export async function getImageBuffer(url: string): Promise<ImageFile> {
  if (!url || !isURL(url)) return null;

  const mimetype = mime.lookup(url);
  const filename = path.basename(url);
  const buffer = await fetchBufferFromUrl(url);
  if (!buffer) return null;

  return {
    buffer,
    contentType: mimetype,
    filename,
  };
}

export async function fetchBufferFromUrl(url: string): Promise<Buffer> {
  try {
    const data = await fetch(url);
    return Buffer.from(await data.arrayBuffer());
  } catch (error) {
    return null;
  }
}
