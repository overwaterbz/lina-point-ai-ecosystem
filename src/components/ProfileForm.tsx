'use client';

import React, { useState } from 'react';

interface ProfileFormProps {
  action: any; // server action
  initial?: any;
}

export default function ProfileForm({ action, initial }: ProfileFormProps) {
  const [birthday, setBirthday] = useState(initial?.birthday || '');
  const [anniversary, setAnniversary] = useState(initial?.anniversary || '');
  const [specialEvents, setSpecialEvents] = useState<Array<{ name: string; date: string }>>(
    initial?.special_events || []
  );
  const [musicStyle, setMusicStyle] = useState(initial?.music_style || 'EDM');
  const [mayaInterests, setMayaInterests] = useState<string[]>(initial?.maya_interests || []);
  const [optInMagic, setOptInMagic] = useState(!!initial?.opt_in_magic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      // Before submit, ensure hidden inputs are updated (they are bound to state via value)
      const form = e.target as HTMLFormElement;
      await action(new FormData(form));
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={action} onSubmit={submitHandler} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
          <input
            name="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Anniversary</label>
          <input
            name="anniversary"
            type="date"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Events</label>
        {specialEvents.map((ev, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Name"
              value={ev.name}
              onChange={(e) => {
                const copy = [...specialEvents];
                copy[idx].name = e.target.value;
                setSpecialEvents(copy);
              }}
              className="flex-1 px-3 py-2 border rounded"
            />
            <input
              type="date"
              value={ev.date}
              onChange={(e) => {
                const copy = [...specialEvents];
                copy[idx].date = e.target.value;
                setSpecialEvents(copy);
              }}
              className="w-40 px-3 py-2 border rounded"
            />
            <button
              type="button"
              onClick={() => setSpecialEvents(specialEvents.filter((_, i) => i !== idx))}
              className="text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setSpecialEvents([...specialEvents, { name: '', date: '' }])} className="text-sm text-blue-600">
          + Add event
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Music Style</label>
        <select name="music_style" value={musicStyle} onChange={(e) => setMusicStyle(e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="EDM">EDM</option>
          <option value="Pop">Pop</option>
          <option value="Ambient">Ambient</option>
          <option value="Maya Fusion">Maya Fusion</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Maya Interests</label>
        <div className="flex flex-wrap gap-2">
          {['Ruins', 'Cuisine', 'Wellness', 'Kundalini'].map((item) => (
            <label key={item} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={mayaInterests.includes(item)}
                onChange={(e) => {
                  if (e.target.checked) setMayaInterests([...mayaInterests, item]);
                  else setMayaInterests(mayaInterests.filter((m) => m !== item));
                }}
              />
              <span className="text-sm">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input name="opt_in_magic" type="checkbox" checked={optInMagic} onChange={(e) => setOptInMagic(e.target.checked)} />
        <label className="text-sm text-gray-700">Opt in to magic recommendations</label>
      </div>

      {/* Hidden JSON fields for arrays */}
      <input type="hidden" name="special_events_json" value={JSON.stringify(specialEvents)} />
      <input type="hidden" name="maya_interests_json" value={JSON.stringify(mayaInterests)} />

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">Profile saved</div>}

      <div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
}
