import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-white">Kebijakan Privasi</h1>
        <p className="text-zinc-400 mb-10 text-sm">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID')}</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p className="mb-3">Saat Anda menggunakan Drive Hub dan menghubungkan akun Google Anda, kami mengumpulkan informasi berikut:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Alamat Email:</strong> Digunakan semata-mata untuk mengidentifikasi akun Google Drive mana yang telah Anda hubungkan di dalam dasbor kami.</li>
              <li><strong>Token Akses Otentikasi:</strong> Kami menerima token otorisasi (termasuk <em>refresh token</em>) dari Google untuk memungkinkan kami mengunggah file ke Drive Anda.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
            <p>Data yang kami kumpulkan hanya digunakan untuk menyediakan fungsionalitas inti aplikasi, yaitu:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Menerima file dari perangkat Anda dan mengunggahnya ke akun Google Drive tujuan yang Anda pilih.</li>
              <li>Menampilkan daftar akun Drive Anda di dasbor.</li>
            </ul>
            <p className="mt-3">Kami <strong>tidak</strong> membaca, memodifikasi, atau menghapus file apa pun yang sudah ada di dalam Google Drive Anda. Akses kami terbatas pada hak untuk mengunggah (menulis) file baru.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Kepatuhan Kebijakan Data Pengguna Layanan API Google</h2>
            <p>
              Penggunaan dan transfer informasi yang diterima dari API Google oleh Drive Hub ke aplikasi lain akan mematuhi <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-[#ff9900] hover:underline">Kebijakan Data Pengguna Layanan API Google</a>, termasuk persyaratan Penggunaan Terbatas (<em>Limited Use requirements</em>).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Keamanan Data</h2>
            <p>
              Keamanan Anda adalah prioritas kami. Token otorisasi Google Anda dienkripsi menggunakan standar enkripsi tingkat tinggi sebelum disimpan ke dalam basis data kami. Kami tidak pernah membagikan atau menjual data Anda kepada pihak ketiga.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Penghapusan Data</h2>
            <p>
              Anda memiliki kendali penuh atas data Anda. Anda dapat memutuskan tautan akun Google Drive kapan saja melalui dasbor Drive Hub. Saat Anda mengklik tombol &quot;Hapus&quot;, semua data yang terkait dengan akun tersebut (termasuk email dan token enkripsi) akan dihapus secara permanen dari server kami.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}