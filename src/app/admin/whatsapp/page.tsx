import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';
import { sendTestMessageAction } from './actions';

export const metadata = {
  title: 'WhatsApp Admin',
};

export default async function WhatsAppAdminPage() {
  await requireAdmin();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service role not configured');
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: messages } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: sessions } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10);

  const { data: agentRuns } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('agent_name', 'whatsapp_concierge')
    .order('started_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Concierge Admin</h1>
          <p className="text-gray-600">Monitor conversations, sessions, and agent performance.</p>
        </header>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Test Message</h2>
          <form action={sendTestMessageAction} className="grid gap-4 md:grid-cols-3">
            <input
              name="phone"
              type="tel"
              placeholder="+1 555 123 4567"
              className="w-full rounded border px-3 py-2"
              required
            />
            <input
              name="message"
              type="text"
              placeholder="Welcome to Lina Point!"
              className="w-full rounded border px-3 py-2 md:col-span-2"
              required
            />
            <button
              type="submit"
              className="md:col-span-3 rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
            >
              Send WhatsApp Message
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Sessions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Phone</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Last Message</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {(sessions || []).map((session) => (
                  <tr key={session.id} className="border-t">
                    <td className="py-2 text-gray-800">{session.phone_number}</td>
                    <td className="py-2 text-gray-800">{session.user_id || 'Unlinked'}</td>
                    <td className="py-2 text-gray-800">{session.last_message || '-'}</td>
                    <td className="py-2 text-gray-500">
                      {session.updated_at ? new Date(session.updated_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Messages</h2>
          <div className="space-y-3">
            {(messages || []).map((msg) => (
              <div key={msg.id} className="border rounded p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{msg.direction.toUpperCase()} | {msg.phone_number}</span>
                  <span>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                </div>
                <p className="text-gray-800 mt-2">{msg.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Runs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Status</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Started</th>
                  <th className="py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {(agentRuns || []).map((run) => (
                  <tr key={run.id} className="border-t">
                    <td className="py-2 text-gray-800">{run.status}</td>
                    <td className="py-2 text-gray-800">{run.user_id}</td>
                    <td className="py-2 text-gray-500">
                      {run.started_at ? new Date(run.started_at).toLocaleString() : '-'}
                    </td>
                    <td className="py-2 text-gray-500">{run.duration_ms ? `${run.duration_ms}ms` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
