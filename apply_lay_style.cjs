const fs = require('fs');
const file = 'src/pages/Index.tsx';
let t = fs.readFileSync(file, 'utf8');

const searchStartBlock = t.indexOf('<div className="flex h-[100dvh] flex-col w-full');
const searchEndBlock = t.indexOf('{/* Bottom Navigation */}');

if (searchStartBlock > -1 && searchEndBlock > -1) {
    const p1 = t.substring(0, searchStartBlock);
    const p2 = t.substring(searchEndBlock);
    
    // Exact Layout based on user's sketch (Lay.jpg)
    const newUI = `<div className="flex h-[100dvh] flex-col w-full bg-[#f8f9fa] dark:bg-slate-950 overflow-hidden relative">
            
            {/* Header with curved bottom background */}
            <div className="bg-gradient-to-b from-[#0081a0] to-[#006f8a] h-[180px] w-full absolute top-0 left-0 rounded-b-[40px] z-0 shadow-sm"></div>

            {/* Top Bar Location & Bell */}
            <div className="pt-8 pb-4 px-5 relative z-10 flex items-center justify-between">
                <div className="flex flex-1 items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mr-4 border border-white/20 shadow-sm">
                    <MapPin className="w-4 h-4 text-white mr-2 flex-shrink-0" />
                    <span className="text-white text-xs font-semibold opacity-100 truncate max-w-[220px]">
                        {locationName || 'Mendeteksi lokasi...'}
                    </span>
                </div>
                <button className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center shadow-sm relative">
                    <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-[#0081a0]"></div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </button>
            </div>

            {/* Main scrollable content */}
            <main className="flex-grow overflow-y-auto px-5 w-full pb-28 z-10 relative space-y-6">
                
                {/* Floating Profile Card - Overlaps the curved boundary */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between mt-2 cursor-pointer active:scale-[0.98] transition-all" onClick={() => navigate('/profile')}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border-2 border-slate-100 p-0.5 overflow-hidden">
                            <img src={currentUser?.avatar_url || "/unes.png"} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="flex flex-col">
                            <div className="font-extrabold text-slate-800 dark:text-white text-[15px] mb-0.5 tracking-tight">
                                {currentUser?.full_name || 'Pengguna'}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    {currentUser?.role || 'USER'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                </div>

                {/* Layanan Utama Grid */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-4">Layanan Utama</h3>
                    <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                        
                        {/* Presensi */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai') && (
                            <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={() => navigate('/attendance')}>
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-emerald-500 shadow-sm shadow-emerald-500/20">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Presensi</span>
                            </div>
                        )}
                        
                        {/* Izin/Cuti */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai') && (
                            <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={() => navigate('/izin-cuti')}>
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-sky-500 shadow-sm shadow-sky-500/20">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Izin / Cuti</span>
                            </div>
                        )}

                        {/* Riwayat */}
                        <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={() => navigate('/history')}>
                            <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-indigo-500 shadow-sm shadow-indigo-500/20">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Histori</span>
                        </div>

                        {/* Admin Room */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                            <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={() => navigate('/admin')}>
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-purple-500 shadow-sm shadow-purple-500/20">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Admin<br/>Room</span>
                            </div>
                        )}
                        
                    </div>
                </div>

                {/* Banner Absen CTA (Optional, kept modern) */}
                <div className="bg-gradient-to-r from-[#0081a0] to-sky-500 rounded-2xl p-4 shadow-md relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate('/attendance')}>
                    <div className="absolute -right-6 -bottom-6 opacity-20 w-32 h-32 rounded-full border-[10px] border-white z-0"></div>
                    <div className="relative z-10 flex gap-4 items-center justify-between">
                        <div className="flex-1">
                            <h4 className="font-extrabold text-white mb-1 text-sm tracking-wide">
                                Absen Disini
                            </h4>
                            <p className="text-[11px] text-sky-100 leading-snug max-w-[200px]">
                                Catat waktu kedatangan dan kepulangan Anda hari ini.
                            </p>
                        </div>
                        <div className="bg-white text-[#0081a0] px-4 py-2 rounded-full text-xs font-black shadow-sm">
                            Masuk
                        </div>
                    </div>
                </div>

                {/* Informasi Kehadiran */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Informasi Kehadiran</h3>
                        
                        {/* Month/Year selector compact */}
                        <div className="flex gap-1.5">
                            <Select value={selectedMonth.toString()} onValueChange={(v) => { setSelectedMonth(parseInt(v)); setIsLoading(true); }}>
                                <SelectTrigger className="h-7 px-2.5 bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-bold rounded-lg shadow-none focus:ring-0">
                                    <SelectValue placeholder="Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => <SelectItem key={m.value} value={m.value} className="text-[11px]">{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear.toString()} onValueChange={(v) => { setSelectedYear(parseInt(v)); setIsLoading(true); }}>
                                <SelectTrigger className="h-7 px-2.5 bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-bold rounded-lg shadow-none focus:ring-0">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y.value} value={y.value} className="text-[11px]">{y.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* List Format Rangkuman Kehadiran */}
                    <div className="flex flex-col gap-3">
                        {/* Total Masuk */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-300">Total Absen Masuk</span>
                            </div>
                            <span className="font-black text-[15px] text-slate-800 dark:text-white">{stats.totalMasuk} <span className="text-[10px] text-slate-400 font-semibold">hari</span></span>
                        </div>
                        
                        {/* Total Pulang */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div>
                                <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-300">Total Absen Pulang</span>
                            </div>
                            <span className="font-black text-[15px] text-slate-800 dark:text-white">{stats.totalPulang} <span className="text-[10px] text-slate-400 font-semibold">hari</span></span>
                        </div>

                        {/* Tidak Masuk */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer group" onClick={() => setShowAbsentModal(true)}>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                                <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-300">Tidak Masuk (Alpha)</span>
                            </div>
                            <div className="flex items-center gap-2 text-rose-500 group-hover:text-rose-600 transition-colors">
                                <span className="font-black text-[15px]">{stats.tidakMasuk} <span className="text-[10px] opacity-70 font-semibold">hari</span></span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Izin/Cuti */}
                        <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={() => setShowLeaveModal(true)}>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-300">Izin / Cuti / DL</span>
                            </div>
                            <div className="flex items-center gap-2 text-amber-500 group-hover:text-amber-600 transition-colors">
                                <span className="font-black text-[15px]">{stats.leaveDays} <span className="text-[10px] opacity-70 font-semibold">hari</span></span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            `;

    fs.writeFileSync(file, p1 + newUI + p2, 'utf8');
    console.log('Successfully updated Index.tsx layout mimicking Lay.jpg');
} else {
    console.log('Failed to find layout markers!');
}
