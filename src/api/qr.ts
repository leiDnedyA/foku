import QRCode from 'qrcode';

export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  try {
    // 1. Generate the QR code as a PNG Buffer
    return await QRCode.toBuffer(text, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 3,
      scale: 4
    });

  } catch (error) {
    console.error('Failed to generate QR Code:', error);
    throw error;
  }
}
