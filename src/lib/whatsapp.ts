import twilio from 'twilio';

export function normalizePhoneNumber(input: string) {
  const trimmed = input.trim();
  const withoutPrefix = trimmed.startsWith('whatsapp:')
    ? trimmed.replace('whatsapp:', '')
    : trimmed;

  return withoutPrefix.replace(/\s+/g, '');
}

export function toWhatsAppAddress(phone: string) {
  const normalized = normalizePhoneNumber(phone);
  return normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`;
}

export async function sendWhatsAppMessage(phone: string, text: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const client = twilio(accountSid, authToken);
  return client.messages.create({
    from: toWhatsAppAddress(fromNumber),
    to: toWhatsAppAddress(phone),
    body: text,
  });
}
