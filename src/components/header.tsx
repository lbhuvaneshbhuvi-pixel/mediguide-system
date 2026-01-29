
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Logo } from './icons';
import { LanguageToggle } from './language-toggle';
import { translations } from '@/lib/translations';
import { useAuth, useUser } from '@/firebase';
import { signOut, updatePassword } from 'firebase/auth';
import { Button } from './ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';

type Language = 'en' | 'ta';

interface AppHeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const AppHeader: FC<AppHeaderProps> = ({ language, setLanguage }) => {
  const t = translations[language];
  const auth = useAuth();
  const { user } = useUser();
  const toast = useToast().toast;
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; result?: string }>>([]);
  const [loading, setLoadingState] = useState(false);
  const [activeTab, setActiveTab] = useState<'feedback' | 'history'>('feedback');
  const [historyFilter, setHistoryFilter] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'clear' | 'delete' | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/auth');
    }
  };

  const handleOpenProfile = () => {
    if (user) {
      setFirstName(user.displayName ? user.displayName.split(' ')[0] : '');
      setLastName(user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '');
      // fetch user-specific items when opening profile
      setOpen(true);
    }
  };

  // fetch search history when dialog opens
  const fetchSearchHistory = async () => {
    if (!user || !auth) return;
    try {
      setLoadingState(true);
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/search-history`, { headers: { Authorization: `Bearer ${idToken}` } });
      if (!res.ok) {
        console.error('Error fetching search history', res.status);
        setSearchHistory([]);
        return;
      }
      const list = await res.json();
      // support APIs that return { results: [...] } or raw array
      const items = Array.isArray(list) ? list : (list?.results || list?.history || []);
      setSearchHistory(items || []);
    } catch (err) {
      console.error('Error fetching search history:', err);
    } finally {
      setLoadingState(false);
    }
  };

  const sendFeedback = async () => {
    if (!user || !auth) return toast({ title: 'Not signed in', variant: 'destructive' });
    if (!feedbackText.trim()) return toast({ title: 'Feedback cannot be empty', variant: 'destructive' });
    try {
      setLoadingState(true);
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: user.uid, text: feedbackText }),
      });
      if (!res.ok) throw new Error('Failed to send feedback');
      setFeedbackText('');
      toast({ title: '✓ Feedback sent', variant: 'default' });
    } catch (err) {
      console.error('Error sending feedback:', err);
      toast({ title: 'Error sending feedback', description: String(err), variant: 'destructive' });
    } finally {
      setLoadingState(false);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    toast({ title: '✓ History cleared locally', description: 'Server records remain', variant: 'default' });
  };

  const handleSaveProfile = async () => {
    if (!user || !auth) {
      toast({ title: 'Not signed in', description: 'Please sign in to update your profile.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ firstName: firstName || null, lastName: lastName || null, email: user.email || null }),
      });

      // change password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({ title: 'Password mismatch', description: 'New password and confirm do not match.', variant: 'destructive' });
          setSaving(false);
          return;
        }
        const currentUser = auth.currentUser;
        if (currentUser) {
          await updatePassword(currentUser, newPassword);
        }
      }

      toast({ title: 'Profile updated', description: 'Your profile changes were saved.', variant: 'default' });
    } catch (err: any) {
      console.error('Profile save error', err);
      toast({ title: 'Update failed', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-xl font-bold">{t.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle language={language} setLanguage={setLanguage} />

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchSearchHistory(); }}>
            <DialogTrigger asChild>
              <div className="flex flex-col items-center cursor-pointer" onClick={handleOpenProfile} aria-label="Profile">
                <Button variant="ghost" size="icon">
                  {user?.photoURL ? (
                    <Avatar>
                      <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName ? user.displayName[0] : 'U'}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                </Button>
                <span className="text-xs mt-1 text-foreground/80 max-w-[120px] truncate text-center">
                  {user?.displayName ?? user?.email ?? 'Guest'}
                </span>
              </div>
            </DialogTrigger>
              <DialogContent className="max-h-[80vh] w-[min(640px,95vw)] overflow-auto">
              <DialogHeader>
                <DialogTitle>Profile Settings</DialogTitle>
                <DialogDescription>Update your name, password and view user details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave empty to keep current" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm password</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={saving} className="bg-blue-600">{saving ? 'Saving...' : 'Save'}</Button>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </div>
                <div className="text-xs text-gray-500">UID: {user?.uid}</div>
              </div>
              {/* Feedback and Search History moved into profile dialog */}
              <div className="mt-6">
                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'feedback' ? 'bg-green-600 text-white' : 'bg-transparent border'}`}
                  >
                    Feedback
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'bg-transparent border'}`}
                  >
                    Search History
                  </button>
                </div>

                <div className="max-w-xl mx-auto mt-4">
                  {activeTab === 'feedback' ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Feedback</label>
                      <textarea
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        rows={5}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Write your feedback here..."
                        disabled={loading}
                      />
                      <div className="flex gap-2">
                        <Button onClick={sendFeedback} disabled={loading} className="bg-green-600">{loading ? 'Sending...' : '📤 Send Feedback'}</Button>
                        <Button variant="outline" onClick={() => setFeedbackText('')}>Clear</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2 items-center">
                        <Input placeholder="Filter history..." value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} />
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              const blob = new Blob([JSON.stringify(searchHistory, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `search-history-${new Date().toISOString()}.json`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                              toast({ title: '✓ Export ready' });
                            } catch (err) {
                              console.error('Export failed', err);
                              toast({ title: 'Export failed', variant: 'destructive' });
                            }
                          }}
                        >
                          Export
                        </Button>
                        <Button variant="destructive" onClick={() => {
                          if (!searchHistory.length) return;
                          if (confirm('Clear history locally? This does not remove server records.')) {
                            clearHistory();
                          }
                        }} disabled={!searchHistory.length}>🗑️ Clear</Button>
                      </div>

                      {searchHistory.length === 0 ? (
                        <div className="text-sm text-gray-500">No search history yet</div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                              {searchHistory
                                .filter(h => h.query.toLowerCase().includes(historyFilter.toLowerCase()))
                                .map((item: any, i) => (
                                  <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border flex justify-between">
                                    <div>
                                      <div className="font-medium break-words">{item.query}</div>
                                      {item.result && <div className="text-sm text-gray-600 dark:text-gray-400 break-words">{item.result}</div>}
                                    </div>
                                    <div className="ml-3 flex-shrink-0 flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setPendingDeleteId(item.id ?? null);
                                          setConfirmAction('delete');
                                          setConfirmOpen(true);
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Confirmation Dialog for destructive actions */}
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="w-[min(480px,90vw)]">
                  <DialogHeader>
                    <DialogTitle>Confirm Action</DialogTitle>
                    <DialogDescription>{confirmAction === 'clear' ? 'Clear all history locally?' : 'Delete this history entry?'}</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 flex gap-2 justify-end">
                    <DialogClose asChild>
                      <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmAction(null); setPendingDeleteId(null); }}>Cancel</Button>
                    </DialogClose>
                    <Button
                      className="bg-red-600"
                      onClick={async () => {
                        setLoadingState(true);
                        try {
                          const idToken = await (auth.currentUser as any)?.getIdToken();
                          if (confirmAction === 'clear') {
                            const res = await fetch('/api/search-history', { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } });
                            if (res.ok) {
                              setSearchHistory([]);
                              toast({ title: '✓ History cleared' });
                            } else {
                              toast({ title: 'Could not clear history', variant: 'destructive' });
                            }
                          } else if (confirmAction === 'delete' && pendingDeleteId) {
                            const res = await fetch(`/api/search-history/${pendingDeleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } });
                            if (res.ok) {
                              setSearchHistory(prev => prev.filter((h: any) => h.id !== pendingDeleteId));
                              toast({ title: '✓ Entry deleted' });
                            } else {
                              toast({ title: 'Could not delete entry', variant: 'destructive' });
                            }
                          }
                        } catch (err) {
                          console.error('Delete error', err);
                          toast({ title: 'Error', description: String(err), variant: 'destructive' });
                        } finally {
                          setLoadingState(false);
                          setConfirmOpen(false);
                          setConfirmAction(null);
                          setPendingDeleteId(null);
                        }
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log Out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
