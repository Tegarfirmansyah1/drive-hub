"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Cloud, Plus, HardDrive, UploadCloud, CheckCircle, Trash2, AlertCircle, X, File as FileIcon, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 
import { DriveAccount } from '@/types';   
import { useRouter } from 'next/navigation';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export default function App() {
  // State untuk daftar drive nyata dari Supabase
  const [drives, setDrives] = useState<DriveAccount[]>([]);
  const [isLoadingDrives, setIsLoadingDrives] = useState(true);
  const router = useRouter();

  // State untuk form tambah drive
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlias, setNewAlias] = useState('');

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // State untuk proses upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [customFolderPath, setCustomFolderPath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Logika mengambil data dari Supabase saat komponen dimuat
  const fetchDrives = async () => {
    setIsLoadingDrives(true);
    try {
      // 1. Ambil token sesi dari Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // Jika tidak ada sesi, jangan lanjutkan fetch (bisa redirect ke login)
      if (!session) {
        console.warn('Tidak ada sesi aktif. Mengalihkan ke login...');
        window.location.href = '/login';
        return;
      }
      
      // 2. Fetch data dengan membawa token
      const res = await fetch('/api/drives', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      }); 
      
      if (res.ok) {
        const data = await res.json();
        setDrives(data);
      } else {
        // TANGKAP PESAN ERROR DARI BACKEND DI SINI
        const errorData = await res.json();
        console.error('Gagal mengambil data drive. Detail:', errorData);
      }
    } catch (error) {
      console.error('Error jaringan saat fetching drives:', error);
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
  const handleAddDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim()) return;
    
    // Dapatkan identitas user yang sedang login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Sesi Anda telah habis. Silakan login kembali.");
      window.location.href = '/login';
      return;
    }
    
    // Redirect dengan menambahkan parameter userId
    window.location.href = `/api/auth?alias=${encodeURIComponent(newAlias)}&userId=${user.id}`;
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

  // --- FUNGSI DRAG & DROP MULTI-FILE ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const newUploadFiles = newFiles.map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      file,
      progress: 0,
      status: 'idle' as const
    }));
    // Tambahkan file baru tanpa menghapus file yang sudah dipilih sebelumnya
    setUploadFiles(prev => [...prev, ...newUploadFiles]);
    setUploadSuccess(false);
  };

  const removeFile = (idToRemove: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== idToRemove));
  };

  const updateFileState = (id: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };
 

  // 4. Logika Upload Antrean (Resumable Upload Client-Side)
  const handleUpload = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'idle' || f.status === 'error');
    if (pendingFiles.length === 0 || !selectedDriveId) return;
    
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi Anda tidak valid. Silakan login kembali.");

      // Eksekusi antrean file satu per satu (Sequential)
      for (const current of pendingFiles) {
        updateFileState(current.id, { status: 'uploading', progress: 0, errorMessage: undefined });

        try {
          const initRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              filename: current.file.name,
              mimeType: current.file.type,
              size: current.file.size,
              driveId: selectedDriveId,
              customPath: customFolderPath
            })
          });

          if (!initRes.ok) {
            const err = await initRes.json();
            throw new Error(err.error || 'Gagal inisialisasi server.');
          }

          const { uploadUrl } = await initRes.json();

          // Bungkus XHR dengan Promise agar loop menunggu proses file ini selesai
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true); 

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                updateFileState(current.id, { progress: percentComplete });
              }
            };

            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 201 || xhr.status === 308) {
                updateFileState(current.id, { status: 'success', progress: 100 });
                resolve(null);
              } else {
                reject(new Error('File ditolak Google Drive.'));
              }
            };

            xhr.onerror = () => reject(new Error('Koneksi terputus.'));
            xhr.send(current.file);
          });

        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          updateFileState(current.id, { status: 'error', errorMessage });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(errorMessage);
    } finally {
      setIsUploading(false);
      // Periksa apakah semua file berhasil diunggah
      setUploadFiles(currentList => {
        const hasError = currentList.some(f => f.status === 'error');
        if (!hasError) setUploadSuccess(true);
        return currentList;
      });
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar?");
    if (!confirmLogout) return;
    
    await supabase.auth.signOut();
    router.push('/login'); // Arahkan kembali ke halaman login
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex justify-between items-start mb-10">
          <div className="flex flex-col">
            {/* Bagian Judul */}
            <div className="p-3 bg-[#ff9900] rounded-xl text-white shadow-lg shadow-[#ff9900]/30 relative overflow-hidden w-fit mb-4">
                <div className="absolute inset-0 bg-white/20 blur-md rounded-full transform -translate-x-4 -translate-y-4"></div>
                <h1 className="text-[14px] md:text-[22px] font-bold">
                <span className="text-white">Drive </span>
                <span className="text-black">Hub</span>
                </h1>
            </div>
            {/* Bagian Deskripsi */}
            <div className="hidden md:block">
                <p className="text-zinc-400">Kelola unggahan ke semua Drive Anda.</p>
            </div>
          </div>
          
          {/* Tombol Logout */}
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2.5 bg-[#1f1f1f] hover:bg-red-500/10 text-zinc-400 hover:text-red-500 border border-zinc-800 hover:border-red-500/30 rounded-xl transition-all"
          >
            <LogOut size={18} className="mr-2" />
            <span className="font-medium text-[10px] md:text-[12px]">Keluar</span>
          </button>
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
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragging ? 'border-[#ff9900] bg-[#ff9900]/20' : 'border-zinc-700 hover:border-[#ff9900] hover:bg-[#ff9900]/5'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  multiple // WAJIB UNTUK MULTI FILE
                />
                
                <div className="flex flex-col items-center group">
                  <UploadCloud size={48} className={`mb-3 transition-colors ${isDragging ? 'text-[#ff9900]' : 'text-zinc-500 group-hover:text-[#ff9900]'}`} />
                  <p className={`font-bold text-lg transition-colors ${isDragging ? 'text-[#ff9900]' : 'text-white group-hover:text-[#ff9900]'}`}>
                    {isDragging ? 'Lepaskan file di sini' : 'Klik atau seret file ke sini'}
                  </p>
                  <p className="text-sm text-zinc-400 mt-2">Mendukung banyak file secara bersamaan</p>
                </div>
              </div>

              {/* Daftar Antrean File */}
              {uploadFiles.length > 0 && (
                <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {uploadFiles.map((f) => (
                    <div key={f.id} className="p-4 bg-[#2a2a2a] border border-zinc-700 rounded-xl flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center overflow-hidden">
                          <FileIcon size={20} className="text-[#ff9900] mr-3 flex-shrink-0" />
                          <div className="truncate">
                            <p className="font-medium text-white text-sm truncate">{f.file.name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        
                        {f.status === 'idle' || f.status === 'error' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                            disabled={isUploading}
                            className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : f.status === 'success' ? (
                          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                        ) : null}
                      </div>
                      
                      {/* Progress bar individual */}
                      {(f.status === 'uploading' || f.status === 'success' || f.progress > 0) && (
                        <div className="w-full bg-[#121212] rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${f.status === 'error' ? 'bg-red-500' : f.status === 'success' ? 'bg-green-500' : 'bg-[#ff9900]'}`} 
                            style={{ width: `${f.progress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {f.errorMessage && (
                        <p className="text-xs text-red-500 mt-2">{f.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

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

              <div className="mt-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Sub-Folder (Opsional)
                </label>
                <div className="flex bg-[#2a2a2a] border border-zinc-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#ff9900] focus-within:border-[#ff9900] transition-all">
                  <div className="bg-[#1f1f1f] px-4 py-3 border-r border-zinc-700 text-zinc-500 font-medium select-none flex items-center">
                    Drive Hub /
                  </div>
                  <input 
                    type="text" 
                    placeholder="contoh: foto atau arsip/2026"
                    className="w-full p-3 bg-transparent text-white outline-none placeholder-zinc-600"
                    value={customFolderPath}
                    onChange={(e) => setCustomFolderPath(e.target.value)}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Biarkan kosong jika hanya ingin mengunggah ke folder utama &quot;Drive Hub&quot;. Anda bisa membuat folder bersarang menggunakan tanda miring (/).
                </p>
              </div>

              {/* Tombol Upload */}
              <button 
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || !selectedDriveId || isUploading}
                className={`w-full mt-8 py-3.5 px-4 rounded-xl font-bold text-black transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  (uploadFiles.length === 0 || !selectedDriveId || isUploading) 
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                    : 'bg-[#ff9900] hover:bg-[#e68a00] shadow-lg shadow-[#ff9900]/30'
                }`}
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

      {/* --- KODE TAMBAHAN UI USAGE DRIVE DI SINI --- */}
        {drives.length > 0 && !isLoadingDrives && (
          <div className="bg-[#1f1f1f] p-6 md:p-8 rounded-2xl shadow-xl border border-zinc-800/50 mt-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
              <HardDrive className="mr-3 text-[#ff9900]" size={24} />
              Informasi Penggunaan Kuota
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drives.map(drive => {
                // Jangan tampilkan jika API Google belum merespon kuota
                if (!drive.quota) return null;

                const usedGB = (drive.quota.used / (1024 ** 3)).toFixed(2);
                const totalGB = (drive.quota.total / (1024 ** 3)).toFixed(2);
                const percentage = drive.quota.total > 0 
                  ? Math.min(Math.round((drive.quota.used / drive.quota.total) * 100), 100) 
                  : 0;

                // Ubah warna bar menjadi merah jika hampir penuh (di atas 90%)
                const barColor = percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-[#ff9900]';

                return (
                  <div key={`usage-${drive.id}`} className="bg-[#2a2a2a] p-5 rounded-xl border border-zinc-800">
                    <div className="flex justify-between items-start mb-4">
                      <div className="truncate pr-4">
                        <p className="font-bold text-white truncate">{drive.alias_name}</p>
                        <p className="text-xs text-zinc-400 truncate">{drive.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs font-medium mb-2">
                      <span className="text-zinc-300">{usedGB} GB terpakai</span>
                      <span className="text-zinc-500">{totalGB} GB total</span>
                    </div>
                    
                    <div className="w-full bg-[#121212] rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 shadow-md ${barColor}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs mt-2 text-zinc-400 font-bold">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  placeholder="Contoh: Drive Klien A"
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