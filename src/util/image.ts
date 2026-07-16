import sharp from "sharp";

export async function invertImage(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .negate({ alpha: false }) // invert RGB, preserve transparency
    .toBuffer();
}
