import React, { useState } from 'react';
import { Home, Plus, Trash2, MapPin, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useProperties, useInvalidateStr } from '@/hooks/useStrData';
import { Property } from '@/types';

export const PropertiesPage: React.FC = () => {
  const { logActivity, isAdmin } = useAuth();
  const { data: properties = [], isLoading, refetch } = useProperties();
  const invalidate = useInvalidateStr();
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const location = String(form.get('location') || '').trim();
    const defaultSource = String(form.get('defaultSource') || 'Mixed');

    try {
      await api.createProperty({ name, location, defaultSource });
      logActivity('PROPERTY_CREATE', `Added property: ${name}`);
      setModal(false);
      invalidate.properties();
      refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Property) => {
    if (!confirm(`Delete property "${p.name}"?`)) return;
    try {
      await api.deleteProperty(p.id);
      logActivity('PROPERTY_DELETE', p.name);
      invalidate.properties();
      refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Properties</h1>
          <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">
            Manage rental listings linked to your portfolio (MySQL)
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

      {properties.length === 0 ? (
        <div className="text-center py-16 str-glass-card">
          <Home className="h-12 w-12 text-purple-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-purple-300">No properties yet. Add your first listing.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map(p => (
            <div key={p.id} className="str-glass-card p-5">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <button onClick={() => handleDelete(p)} className="text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mt-3">{p.name}</h3>
              {p.location && (
                <p className="text-sm text-gray-500 dark:text-purple-300 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {p.location}
                </p>
              )}
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Source: {p.defaultSource}</p>
              <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 capitalize">
                {p.status}
              </span>
              {isAdmin() && (
                <p className="text-[10px] text-gray-400 mt-2">Owner ID: {p.userId.slice(0, 8)}…</p>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setModal(false)}>
          <div className="str-glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold dark:text-white">New Property</h3>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 dark:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="name" required placeholder="Property name" className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white" />
              <input name="location" placeholder="Location (optional)" className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white" />
              <select name="defaultSource" className="w-full px-3 py-2 border rounded-lg dark:bg-purple-950/40 dark:text-white">
                <option>Airbnb</option>
                <option>VRBO</option>
                <option>Booking.com</option>
                <option>Mixed</option>
              </select>
              <button type="submit" disabled={saving} className="w-full py-2 bg-purple-600 text-white rounded-lg flex justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Property
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
