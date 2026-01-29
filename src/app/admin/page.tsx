"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signIn = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const u = await fetch('/api/admin/users', { headers: { 'x-admin-key': adminKey } });
      if (!u.ok) throw new Error('Unauthorized - Invalid admin key');
      const usersJson = await u.json();
      setUsers(usersJson || []);

      const f = await fetch('/api/admin/feedback', { headers: { 'x-admin-key': adminKey } });
      const feedbackJson = f.ok ? await f.json() : [];
      setFeedback(feedbackJson || []);

      const h = await fetch('/api/admin/search-history', { headers: { 'x-admin-key': adminKey } });
      const historyJson = h.ok ? await h.json() : [];
      setHistory(historyJson || []);

      setIsAuthenticated(true);
    } catch (e: any) {
      setAuthError(String(e.message || e));
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const topQueries = () => {
    const map = new Map<string, number>();
    history.forEach((h: any) => {
      const q = (h.query || '').toLowerCase();
      if (!q) return;
      map.set(q, (map.get(q) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0,10);
  };

  // Removed test-data generation to ensure admin sees only real user data

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto mt-20">
          <h1 className="text-3xl font-bold mb-4">🔐 Admin Dashboard</h1>
          <p className="mb-6 text-sm text-muted-foreground">Enter your admin key to access the dashboard.</p>

          <div className="flex flex-col gap-3">
            <Input 
              placeholder="Admin key" 
              value={adminKey} 
              onChange={e => setAdminKey(e.target.value)}
              type="password"
              onKeyDown={e => e.key === 'Enter' && signIn()}
            />
            <Button 
              onClick={signIn} 
              disabled={loading || !adminKey}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
          {authError && <div className="text-red-600 mt-4 p-3 bg-red-50 dark:bg-red-900 rounded">{authError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📊 Admin Dashboard</h1>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsAuthenticated(false)}>Logout</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm('Are you sure you want to DELETE search history and feedback? This cannot be undone.')) return;
                  try {
                    setLoading(true);
                    const res = await fetch('/api/admin/clear', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
                      body: JSON.stringify({ scope: 'history_and_feedback' }),
                    });
                    if (!res.ok) throw new Error('Clear failed');
                    const json = await res.json();
                    // Refresh lists
                    const u = await fetch('/api/admin/users', { headers: { 'x-admin-key': adminKey } });
                    const usersJson = u.ok ? await u.json() : [];
                    setUsers(usersJson || []);
                    const f = await fetch('/api/admin/feedback', { headers: { 'x-admin-key': adminKey } });
                    const feedbackJson = f.ok ? await f.json() : [];
                    setFeedback(feedbackJson || []);
                    const h = await fetch('/api/admin/search-history', { headers: { 'x-admin-key': adminKey } });
                    const historyJson = h.ok ? await h.json() : [];
                    setHistory(historyJson || []);
                    alert('Cleared data: ' + JSON.stringify(json.results || json));
                  } catch (e: any) {
                    alert('Error clearing data: ' + String(e?.message || e));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Clear History & Feedback
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm('ARE YOU SURE? This will DELETE ALL users, feedback and search history. This is irreversible. Type YES to confirm.')) return;
                  const typed = prompt('Type YES to confirm full delete');
                  if (typed !== 'YES') {
                    alert('Full delete cancelled');
                    return;
                  }
                  try {
                    setLoading(true);
                    const res = await fetch('/api/admin/clear', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
                      body: JSON.stringify({ scope: 'all', confirm: true }),
                    });
                    if (!res.ok) throw new Error('Clear failed');
                    const json = await res.json();
                    setUsers([]);
                    setFeedback([]);
                    setHistory([]);
                    alert('Full wipe completed: ' + JSON.stringify(json.results || json));
                  } catch (e: any) {
                    alert('Error performing full wipe: ' + String(e?.message || e));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Full Wipe (All Users)
              </Button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Total Users</h3>
            <div className="text-4xl font-bold mt-2">{users.length}</div>
            {users.length === 0 && <p className="text-xs text-gray-500 mt-2">No users registered yet</p>}
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Total Feedback</h3>
            <div className="text-4xl font-bold mt-2">{feedback.length}</div>
            {feedback.length === 0 && <p className="text-xs text-gray-500 mt-2">No feedback submitted yet</p>}
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Total Searches</h3>
            <div className="text-4xl font-bold mt-2">{history.length}</div>
            {history.length === 0 && <p className="text-xs text-gray-500 mt-2">No searches recorded yet</p>}
          </div>
        </section>

        {users.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">👥 Users</h2>
            <div className="grid gap-3">
              {users.map((u: any) => (
                <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="font-semibold">{u.firstName || 'N/A'} {u.lastName || 'N/A'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ID: {u.id}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Email: {u.email || 'N/A'}</div>
                  <div className="text-xs text-gray-500 mt-2">Created: {new Date(u.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {topQueries().length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🔍 Top Search Queries</h2>
            <ul className="space-y-2">
              {topQueries().map(([q, count], i) => (
                <li key={q} className="bg-white dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                  <span className="font-semibold">{i+1}. {q}</span>
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {feedback.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">💬 Recent Feedback</h2>
            <div className="space-y-3">
              {feedback.map((f: any) => (
                <div key={f.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">User ID: {f.userId}</div>
                    <div className="text-xs text-gray-500">{new Date(f.time).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">{f.text}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">📋 Recent Searches</h2>
            <div className="space-y-3">
              {history.slice(0, 20).map((h: any) => (
                <div key={h.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">User ID: {h.userId}</div>
                    <div className="text-xs text-gray-500">{new Date(h.time).toLocaleString()}</div>
                  </div>
                  <div className="font-semibold mt-2">🔍 Query: {h.query}</div>
                  {h.result && <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">✅ Result: {h.result.substring(0, 100)}...</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {users.length === 0 && feedback.length === 0 && history.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">📭 No data available yet</p>
            <p className="text-sm text-gray-500">Data will appear here once users start using the app.</p>
          </div>
        )}
      </div>
    </div>
  );
}

