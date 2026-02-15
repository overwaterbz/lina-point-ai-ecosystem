'use server';

import { requireAdmin } from '@/lib/admin';
import { normalizePhoneNumber, sendWhatsAppMessage } from '@/lib/whatsapp';

export async function sendTestMessageAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const phoneRaw = (formData.get('phone') as string) || '';
  const phone = normalizePhoneNumber(phoneRaw);
  const message = (formData.get('message') as string) || '';

  if (!phone || !message) {
    throw new Error('Phone and message are required');
  }

  await sendWhatsAppMessage(phone, message);

  await supabase.from('whatsapp_messages').insert({
    user_id: user.id,
    phone_number: phone,
    direction: 'outbound',
    body: message,
  });

  await supabase
    .from('whatsapp_sessions')
    .upsert({
      phone_number: phone,
      user_id: user.id,
      last_message: message,
      last_outbound_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}
