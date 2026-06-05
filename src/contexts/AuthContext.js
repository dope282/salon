'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isAdminEmail } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState(null);          // нэвтэрсэн хэрэглэгчтэй тохирох артист (байвал)
  const [artistChecked, setArtistChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => { setUser(session?.user ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Нэвтэрсэн хэрэглэгчийн мэйл артистын мэйлтэй тохирч байгаа эсэхийг шалгана
  useEffect(() => {
    const email = user?.email?.toLowerCase();
    if (!email) {
      setArtist(null);
      // Auth ачаалал дуусаагүй бол "шалгасан" гэж тэмдэглэхгүй (false хэвээр) —
      // ингэснээр хуудасны guard цаг бусаар буцаахгүй
      setArtistChecked(!loading);
      return;
    }
    setArtistChecked(false);
    supabase.from('artists').select('*').ilike('email', email).limit(1)
      .then(({ data }) => { setArtist(data?.[0] || null); })
      .catch(() => setArtist(null))
      .finally(() => setArtistChecked(true));
  }, [user?.email, loading]);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email) {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  const isAdmin = isAdminEmail(user?.email);
  const isArtist = !!artist;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, artist, isArtist, artistChecked, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
