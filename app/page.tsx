import Link from 'next/link';
import { Shield, Zap, HardDrive, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#ff9900]/30 flex flex-col">
      
      {/* Navbar */}
      <nav className="container mx-auto max-w-5xl px-6 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 mt-4 bg-[#ff9900] rounded-xl text-white shadow-lg shadow-[#ff9900]/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full transform -translate-x-3 -translate-y-3"></div>
            <h1 className="text-xl md:text-3xl font-bold">
                <span className="text-white">Drive </span>
                <span className="text-black">Hub</span>
                </h1>
          </div>
        </div>
        <div>
          <Link 
            href="/dashboard" 
            className="px-5 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] rounded-xl font-medium transition-colors border border-zinc-800"
          >
            Masuk
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 pt-16 pb-24">
        <div className="inline-flex items-center space-x-2 bg-[#1f1f1f] border border-zinc-800 px-4 py-2 rounded-full mb-8">
          <span className="flex h-2 w-2 rounded-full bg-[#ff9900] animate-pulse"></span>
          <span className="text-sm font-medium text-zinc-300">Aplikasi Pengelola Drive #1</span>
        </div>
        
        <h1 className="text-3xl md:text-7xl font-extrabold mb-8 tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent max-w-4xl leading-tight">
          Satu Tempat Untuk <br className="hidden md:block" />
          <span className="text-[#ff9900]">Semua Drive Anda</span>
        </h1>
        
        <p className="text-sm md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Kelola, hubungkan, dan unggah file ke berbagai akun Drive tanpa perlu repot berganti akun. Cepat, terpusat, dan sangat efisien.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 bg-[#ff9900] hover:bg-[#e68a00] text-black rounded-xl font-bold text-sm md:text-lg transition-all shadow-lg shadow-[#ff9900]/25 hover:scale-105 active:scale-95 flex items-center justify-center group"
          >
            Mulai Sekarang 
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="border-t border-zinc-800/50 bg-[#151515] py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Fitur 1 */}
            <div className="bg-[#121212] p-8 rounded-2xl border border-zinc-800/50 hover:border-[#ff9900]/30 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#ff9900]/10 flex items-center justify-center rounded-xl mb-6">
                <HardDrive className="text-[#ff9900]" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">Multi-Akun Terpusat</h3>
              <p className="text-zinc-400 leading-relaxed">
                Hubungkan puluhan akun Drive sekaligus. Pilih target Drive unggahan Anda hanya dengan satu klik melalui *dropdown* interaktif.
              </p>
            </div>
            
            {/* Fitur 2 */}
            <div className="bg-[#121212] p-8 rounded-2xl border border-zinc-800/50 hover:border-[#ff9900]/30 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#ff9900]/10 flex items-center justify-center rounded-xl mb-6">
                <Zap className="text-[#ff9900]" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">Upload Cepat & Stabil</h3>
              <p className="text-zinc-400 leading-relaxed">
                Proses unggah file dioptimalkan dengan *progress bar real-time*. Bebas kirim file ukuran besar langsung ke server Drive.
              </p>
            </div>

            {/* Fitur 3 */}
            <div className="bg-[#121212] p-8 rounded-2xl border border-zinc-800/50 hover:border-[#ff9900]/30 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#ff9900]/10 flex items-center justify-center rounded-xl mb-6">
                <Shield className="text-[#ff9900]" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">Aman & Terenkripsi</h3>
              <p className="text-zinc-400 leading-relaxed">
                Akses token Anda dienkripsi secara mutakhir di dalam database Supabase. Kami sangat memprioritaskan privasi data Anda.
              </p>
            </div>

          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 text-center text-zinc-500 text-sm flex flex-col items-center">
        <p className="mb-4">&copy; {new Date().getFullYear()} Drive Hub. Dibangun untuk menyederhanakan tugas Anda.</p>
        <div className="flex space-x-6">
          <Link href="/privacy-policy" className="hover:text-[#ff9900] transition-colors">Kebijakan Privasi</Link>
          <Link href="/terms-of-service" className="hover:text-[#ff9900] transition-colors">Ketentuan Layanan</Link>
        </div>
      </footer>
    </div>
  );
}