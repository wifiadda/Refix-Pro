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

export function generateServiceWhatsAppTemplate(input: {
  serviceTitle: string;
  serviceCategory?: string;
  macbookModel?: string;
  customerName?: string;
  mobile?: string;
  problemDescription?: string;
}): string {
  const service = (input.serviceTitle || 'MacBook Diagnostic Inspection').trim();
  const model = (input.macbookModel || '').trim() || '[MacBook Model / A-Number]';
  const name = (input.customerName || '').trim();
  const phone = (input.mobile || '').trim();
  const problem = (input.problemDescription || '').trim();
  const hay = `${service} ${input.serviceCategory || ''}`.toLowerCase();

  let serviceSpecificChecks = '• Diagnostic Check Requested: Full hardware bench evaluation & exact estimate before repair';
  if (/liquid|water|spill|corrosion/.test(hay)) {
    serviceSpecificChecks =
      '• Urgent Liquid Spill Protocol: Keeping device powered OFF & disconnected from MagSafe/USB-C\n• Requested: Ultrasonic board cleaning, short-rail inspection & corrosion recovery';
  } else if (/display|screen|lcd|backlight|flexgate|crack/.test(hay)) {
    serviceSpecificChecks =
      '• Display Details: Screen assembly / TrueTone / backlight inspection\n• Please share compatible panel stock availability & turnaround time';
  } else if (/battery|charging|magsafe|power|usb-c|port/.test(hay)) {
    serviceSpecificChecks =
      '• Power & Battery Check: USB-C PD 20V charging negotiation, battery health & cycle check\n• Please confirm replacement battery / DC-in board stock';
  } else if (/logic board|motherboard|no power|dead|chip|micro|gpu|ssd/.test(hay)) {
    serviceSpecificChecks =
      '• Logic Board Bench Request: Schematic micro-soldering & power rail diagnostics\n• Data Safety Priority: Preserve internal SSD data wherever possible';
  } else if (/keyboard|trackpad|hinge|body|fan|thermal/.test(hay)) {
    serviceSpecificChecks =
      '• Mechanical / Thermal Check: Top-case key/trackpad response, fan cleanup & thermal paste check';
  } else if (/software|macos|data|recovery|upgrade|ssd/.test(hay)) {
    serviceSpecificChecks =
      '• macOS & Data Request: OS recovery, performance optimization & backup verification';
  }

  const lines = [
    'Hello Refix Pro (Sector 14, Gurugram),',
    'I would like to book a MacBook repair:',
    '',
    `• Selected Service: ${service}`,
    `• Device Model: ${model}`,
    ...(name ? [`• Customer Name: ${name}`] : []),
    ...(phone ? [`• Contact Mobile: ${phone}`] : []),
    ...(problem ? [`• Observed Issue: ${problem}`] : []),
    serviceSpecificChecks,
    '',
    'Please confirm slot availability and estimated diagnostic turnaround.',
  ];

  return lines.join('\n');
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
        const qualities = [0.6, 0.45, 0.3];
        for (const q of qualities) {
          if (dataUrl.length <= 180000) break;
          dataUrl = canvas.toDataURL('image/jpeg', q);
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
