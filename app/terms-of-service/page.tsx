import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#ff9900]/30">
      {/* Navbar Minimalis */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-800/50">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2 bg-[#ff9900] rounded-lg text-white shadow-lg shadow-[#ff9900]/20">
            <h1 className="text-xl md:text-3xl font-bold">
                <span className="text-white">Drive </span>
                <span className="text-black">Hub</span>
                </h1>
          </div>
        </Link>
        <Link href="/" className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Link>
      </nav>

      {/* Konten Utama */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-white">Ketentuan Layanan</h1>
        <p className="text-zinc-400 mb-10 text-sm">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID')}</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mengakses dan menggunakan Drive Hub, Anda menyetujui untuk terikat oleh Ketentuan Layanan ini serta Kebijakan Privasi kami. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan ini, Anda dilarang menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Deskripsi Layanan</h2>
            <p>
              Drive Hub adalah aplikasi perangkat lunak berbasis web yang bertindak sebagai perantara untuk memfasilitasi pengunggahan file dari perangkat Anda langsung ke satu atau beberapa akun Google Drive milik Anda yang telah diotorisasi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Kewajiban Pengguna</h2>
            <p>Saat menggunakan Drive Hub, Anda setuju untuk:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Tidak menggunakan layanan ini untuk mengunggah materi yang melanggar hukum, berbahaya, mengancam, melecehkan, atau mengandung virus/malware.</li>
              <li>Tidak mencoba mengganggu, meretas, atau merusak keamanan sistem kami.</li>
              <li>Bertanggung jawab penuh atas konten file yang Anda unggah ke Google Drive Anda melalui layanan kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Penafian Jaminan (Disclaimer)</h2>
            <p>
              Layanan kami disediakan secara &quot; sebagaimana adanya &quot; (<em>as is</em>) dan &quot;sebagaimana tersedia&quot; (<em>as available</em>). Drive Hub tidak memberikan jaminan, tersurat maupun tersirat, bahwa layanan akan bebas dari gangguan, bebas dari kesalahan, atau sepenuhnya aman dari kegagalan jaringan atau server pihak ketiga.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Pembatasan Tanggung Jawab</h2>
            <p>
              Dalam keadaan apa pun, Drive Hub atau pengembangnya tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, atau konsekuensial (termasuk hilangnya data atau keuntungan) yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Perubahan Ketentuan</h2>
            <p>
              Kami berhak untuk mengubah atau mengganti Ketentuan Layanan ini kapan saja. Perubahan akan berlaku segera setelah diposting di halaman ini. Anda diharapkan untuk meninjau halaman ini secara berkala.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}