"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, AlertCircle, Globe } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Proses Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        router.push('/dashboard');
      } else {
        // Proses Register
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        setSuccessMsg('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi (jika diaktifkan) atau langsung login.');
        setIsLogin(true);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat autentikasi.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal login dengan Google.';
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-center items-center p-6 selection:bg-[#ff9900]/30">
      <Link href="/" className="mb-8 p-2.5 bg-[#ff9900] rounded-xl text-white shadow-lg shadow-[#ff9900]/30 relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/20 blur-md rounded-full transform -translate-x-3 -translate-y-3"></div>
        <h1 className="text-2xl font-bold relative z-10">
          <span className="text-white">Drive </span>
          <span className="text-black">Hub</span>
        </h1>
      </Link>

      <div className="w-full max-w-md bg-[#1f1f1f] p-8 rounded-2xl shadow-xl border border-zinc-800/50">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
        </h2>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start text-red-500 text-sm">
            <AlertCircle className="mr-3 flex-shrink-0 mt-0.5" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-zinc-500" />
              </div>
              <input
                type="email"
                required
                className="w-full pl-10 p-3.5 bg-[#2a2a2a] border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-[#ff9900] focus:border-[#ff9900] outline-none transition-all"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-zinc-500" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                className="w-full pl-10 p-3.5 bg-[#2a2a2a] border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-[#ff9900] focus:border-[#ff9900] outline-none transition-all"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#ff9900] hover:bg-[#e68a00] text-black font-bold rounded-xl shadow-lg shadow-[#ff9900]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-zinc-700"></div>
          <span className="px-4 text-sm text-zinc-500">atau</span>
          <div className="flex-grow border-t border-zinc-700"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl flex items-center justify-center transition-colors mb-6"
        >
          <Globe size={20} className="mr-2 text-blue-600" />
          Lanjutkan dengan Google
        </button>

        <p className="text-center text-sm text-zinc-400">
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-[#ff9900] hover:underline font-medium focus:outline-none"
          >
            {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </p>
      </div>
    </div>
  );
}