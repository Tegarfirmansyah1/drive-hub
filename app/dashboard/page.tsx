"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Cloud, Plus, HardDrive, UploadCloud, CheckCircle, Trash2, AlertCircle, X, File as FileIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 
import { DriveAccount } from '@/types';   

export default function App() {
  // State untuk daftar drive nyata dari Supabase
  const [drives, setDrives] = useState<DriveAccount[]>([]);
  const [isLoadingDrives, setIsLoadingDrives] = useState(true);

  // State untuk form tambah drive
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlias, setNewAlias] = useState('');

  // State untuk proses upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Logika mengambil data dari Supabase saat komponen dimuat
  const fetchDrives = async () => {
    setIsLoadingDrives(true);
    // Asumsi nama tabel Anda adalah 'drive_accounts'
    const { data, error } = await supabase
      .from('connected_drives') 
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil data drive:', error);
    } else if (data) {
      setDrives(data as DriveAccount[]);
    }
    setIsLoadingDrives(false);
  };

  useEffect(() => {
    const loadDrives = async () => {
      await fetchDrives();
    };
    loadDrives();
  }, []);

  // 2. Logika Redirect ke Google OAuth
  const handleAddDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim()) return;
    
    // Redirect ke rute backend untuk memulai alur OAuth
    window.location.href = `/api/auth?alias=${encodeURIComponent(newAlias)}`;
  };

  // 3. Logika Menghapus Drive dari Supabase
  const handleRemoveDrive = async (id: string) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus akun drive ini?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('connected_drives')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Gagal menghapus drive:', error);
      alert('Terjadi kesalahan saat menghapus drive.');
    } else {
      // Update state lokal setelah berhasil dihapus di database
      setDrives(drives.filter(drive => drive.id !== id));
      // Reset pilihan drive jika drive yang dipilih baru saja dihapus
      if (selectedDriveId === id) setSelectedDriveId('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  // 4. Logika Upload File Nyata (Menggunakan XHR agar ada Real Progress Bar)
  const handleUpload = () => {
    if (!selectedFile || !selectedDriveId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('driveId', selectedDriveId);

    // Menggunakan XMLHttpRequest (XHR) untuk menangkap progress upload yang nyata
    const xhr = new XMLHttpRequest();
    
    // Asumsi Anda memiliki endpoint API untuk menangani upload ke Google Drive
    xhr.open('POST', '/api/upload', true); 

    // Update progress bar
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    // Saat upload selesai
    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200 || xhr.status === 201) {
        setUploadSuccess(true);
        setSelectedFile(null); // Reset form
      } else {
        console.error('Upload gagal:', xhr.responseText);
        alert('Gagal mengunggah file. Silakan coba lagi.');
      }
    };

    // Saat terjadi error koneksi
    xhr.onerror = () => {
      setIsUploading(false);
      alert('Terjadi kesalahan jaringan saat mengunggah.');
    };

    // Mulai proses pengiriman data
    xhr.send(formData);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col mb-10">
            {/* Bagian Judul: w-fit memastikan lebar mengikuti teks saja */}
            <div className="p-3 bg-[#ff9900] rounded-xl text-white shadow-lg shadow-[#ff9900]/30 relative overflow-hidden w-fit mb-4">
                <div className="absolute inset-0 bg-white/20 blur-md rounded-full transform -translate-x-4 -translate-y-4"></div>
                <h1 className="text-3xl font-bold">
                <span className="text-white">Drive </span>
                <span className="text-black">Hub</span>
                </h1>
            </div>

            {/* Bagian Deskripsi */}
            <div>
                <p className="text-zinc-400">Kumpulkan dan kelola unggahan ke semua Drive Anda.</p>
            </div>
            </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Kiri: Panel Upload */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#1f1f1f] p-6 md:p-8 rounded-2xl shadow-xl border border-zinc-800/50">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
                <UploadCloud className="mr-3 text-[#ff9900]" size={24} />
                Upload File Baru
              </h2>

              {/* Area Drag & Drop / Pilih File */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${selectedFile ? 'border-[#ff9900] bg-[#ff9900]/10' : 'border-zinc-700 hover:border-[#ff9900] hover:bg-[#ff9900]/5'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <FileIcon size={48} className="text-[#ff9900] mb-3" />
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-zinc-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center group">
                    <UploadCloud size={48} className="text-zinc-500 mb-3 group-hover:text-[#ff9900] transition-colors" />
                    <p className="font-bold text-white text-lg group-hover:text-[#ff9900] transition-colors">Klik untuk memilih file</p>
                    <p className="text-sm text-zinc-400 mt-2">Mendukung semua format file</p>
                  </div>
                )}
              </div>

              {/* Pilihan Target Drive */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Pilih Drive Tujuan</label>
                <select 
                  className="w-full p-3 bg-[#2a2a2a] border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-[#ff9900] focus:border-[#ff9900] outline-none transition-all appearance-none"
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ff9900' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: '2.5rem' }}
                >
                  <option value="" disabled className="text-zinc-500">-- Pilih Akun Drive --</option>
                  {drives.map(drive => (
                    <option key={drive.id} value={drive.id} className="bg-[#2a2a2a] text-white">
                      {drive.alias_name} ({drive.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tombol Upload */}
              <button 
                onClick={handleUpload}
                disabled={!selectedFile || !selectedDriveId || isUploading}
                className={`w-full mt-8 py-3.5 px-4 rounded-xl font-bold text-black transition-all transform hover:scale-[1.02] active:scale-[0.98] ${(!selectedFile || !selectedDriveId || isUploading) ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-[#ff9900] hover:bg-[#e68a00] shadow-lg shadow-[#ff9900]/30'}`}
              >
                {isUploading ? 'Mengunggah...' : 'Unggah File'}
              </button>

              {/* Progress Bar (Muncul saat upload) */}
              {isUploading && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400 font-medium">Proses unggah...</span>
                    <span className="text-[#ff9900] font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#2a2a2a] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#ff9900] h-2.5 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_#ff9900]" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Pesan Sukses */}
              {uploadSuccess && (
                <div className="mt-6 p-4 bg-[#ff9900]/20 border border-[#ff9900]/50 rounded-xl flex items-center text-[#ff9900]">
                  <CheckCircle className="mr-3" size={24} />
                  <span className="font-medium">File berhasil diunggah ke Drive pilihan Anda!</span>
                </div>
              )}
            </div>
          </div>

          {/* Kanan: Daftar Akun Drive */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1f1f1f] p-6 md:p-8 rounded-2xl shadow-xl border border-zinc-800/50 h-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold flex items-center text-white">
                  <HardDrive className="mr-3 text-[#ff9900]" size={24} />
                  Akun Tertaut
                </h2>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="p-2.5 bg-[#ff9900] text-black rounded-xl hover:bg-[#e68a00] transition-all shadow-lg shadow-[#ff9900]/20 hover:scale-105 tooltip"
                  title="Tambah Akun Drive"
                >
                  <Plus size={20} strokeWidth={2.5} />
                </button>
              </div>

              {isLoadingDrives ? (
                <div className="text-center py-12 px-4">
                  <p className="text-zinc-400 font-medium animate-pulse">Memuat data drive...</p>
                </div>
              ) : drives.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-zinc-700 rounded-xl">
                  <AlertCircle className="mx-auto text-zinc-500 mb-3" size={40} />
                  <p className="text-zinc-400 font-medium">Belum ada Drive yang tertaut.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {drives.map(drive => (
                    <li key={drive.id} className="flex items-center justify-between p-4 bg-[#2a2a2a] border border-zinc-800 rounded-xl hover:border-[#ff9900]/50 transition-all group">
                      <div className="flex items-center overflow-hidden">
                        <div className="p-2.5 bg-[#1f1f1f] rounded-lg mr-4 flex-shrink-0 group-hover:bg-[#ff9900]/10 transition-colors">
                          <Cloud size={22} className="text-[#ff9900]" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-white truncate text-lg">{drive.alias_name}</p>
                          <p className="text-sm text-zinc-400 truncate">{drive.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveDrive(drive.id)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 ml-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Drive */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1f1f1f] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Hubungkan Drive Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddDrive}>
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
                Berikan nama alias untuk akun Drive ini agar mudah dikenali (misal: Drive Project A). Anda akan diarahkan ke Google untuk memberikan izin akses.
              </p>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Nama Alias Drive</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Contoh: Drive Klien B"
                  className="w-full p-3.5 bg-[#2a2a2a] border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-[#ff9900] focus:border-[#ff9900] outline-none placeholder-zinc-500 transition-all"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl font-medium text-zinc-300 bg-[#2a2a2a] hover:bg-[#3f3f3f] transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-black bg-[#ff9900] hover:bg-[#e68a00] shadow-lg shadow-[#ff9900]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center"
                >
                  Lanjutkan ke Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}