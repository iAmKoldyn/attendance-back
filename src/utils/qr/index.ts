import QRCode from 'qrcode';

export const generateQR = (url: string): Promise<string> => {
  return QRCode.toDataURL(url);
};
