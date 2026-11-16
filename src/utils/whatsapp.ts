export const DEFAULT_WHATSAPP_NUMBER = '919613932932';
export const DEFAULT_WHATSAPP_MESSAGE =
  'Hello Refix Pro, I need professional MacBook repair service in Gurugram. Please help me with the repair details.';

export function sanitizePhoneDigits(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits || DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = sanitizePhoneDigits(phone);
  const text = encodeURIComponent(message || DEFAULT_WHATSAPP_MESSAGE);
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildTelHref(phone: string): string {
  const digits = sanitizePhoneDigits(phone);
  return `tel:+${digits}`;
}

export function buildServiceWhatsAppMessage(serviceTitle: string, model?: string): string {
  if (model) {
    return `Hello Refix Pro, I need ${serviceTitle} for my ${model} in Gurugram. Please share diagnostic and repair availability.`;
  }
  return `Hello Refix Pro, I need ${serviceTitle} for my MacBook in Gurugram. Please help me with the repair details.`;
}

export async function compressImageToDataUrl(
  file: File,
  maxWidth = 900,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 200000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}
