const fs = require('fs');
const file = 'src/pages/Index.tsx';
let t = fs.readFileSync(file, 'utf8');

// The Goal is to remove the 4 stats from the Gopay card and add them as Rekap Bulanan under the dropdown.

// Part 1: Remove from Top Card
let searchStart = t.indexOf('                    {/* 4 small stats like gopay actions */}');
let searchEnd = t.indexOf('                </div>', searchStart);
// Wait, actually, let's just rewrite the return UI block again cleanly... 

const searchStartBlock = t.indexOf('<div className="flex h-[100dvh] flex-col w-full');
const searchEndBlock = t.indexOf('{/* Bottom Navigation */}');

if (searchStartBlock > -1 && searchEndBlock > -1) {
    const p1 = t.substring(0, searchStartBlock);
    const p2 = t.substring(searchEndBlock);
    
    // Gojek Style UI Block
    const newUI = `<div className="flex h-[100dvh] flex-col w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Gojek Style Header - Green Background */}
            <div className="bg-[#00aa13] dark:bg-[#007a0e] pt-6 pb-20 px-4 relative flex-none">
                <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-1 items-center bg-white/20 px-3 py-2 rounded-full mr-4 border border-white/10 shadow-sm">
                        <MapPin className="w-4 h-4 text-white mr-2 flex-shrink-0" />
                        <span className="text-white text-xs font-medium opacity-95 truncate max-w-[220px]">
                            {locationName}
                        </span>
                    </div>
                    <button onClick={() => navigate('/profile')} className="flex-shrink-0 w-9 h-9 bg-white/20 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <User className="text-white w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content overlapping the header */}
            <main className="flex-grow overflow-y-auto px-4 w-full pb-28 -mt-10 z-10 relative">
                
                {/* User Info Card */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-slate-100 flex items-center gap-3">
                    <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center">
                        <img src="/unes.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 text-base tracking-tight mb-0.5">
                            {currentUser?.full_name || 'Pengguna'}
                        </div>
                        <div className="text-[10px] bg-[#0081a0]/10 text-[#0081a0] px-2 py-0.5 rounded inline-flex font-semibold shadow-sm">
                            {currentUser?.role?.toUpperCase() || 'USER'}
                        </div>
                    </div>
                </div>

                {/* Gojek Style Grid Menu Icons */}
                <div className="grid grid-cols-4 gap-y-5 gap-x-2 mb-8">
                    {/* Absen */}
                    {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai') && (
                        <div className="flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-90" onClick={() => navigate('/attendance')}>
                            <div className="w-[46px] h-[46px] flex items-center justify-center rounded-[14px] bg-[#00aa13] shadow-sm transform transition-all">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center leading-tight">Absen</span>
                        </div>
                    )}
                    
                    {/* Izin/Cuti */}
                    {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai') && (
                        <div className="flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-90" onClick={() => navigate('/izin-cuti')}>
                            <div className="w-[46px] h-[46px] flex items-center justify-center rounded-[14px] bg-[#00a5cf] shadow-sm transform transition-all">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center leading-tight">Izin & Cuti</span>
                        </div>
                    )}

                    {/* Riwayat */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-90" onClick={() => navigate('/history')}>
                        <div className="w-[46px] h-[46px] flex items-center justify-center rounded-[14px] bg-[#ee2737] shadow-sm transform transition-all">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center leading-tight">Riwayat</span>
                    </div>

                    {/* Profil / Info */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-90" onClick={() => navigate('/profile')}>
                        <div className="w-[46px] h-[46px] flex items-center justify-center rounded-[14px] bg-[#f06400] shadow-sm transform transition-all">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center leading-tight">Profil</span>
                    </div>

                    {/* Admin (Only shows if admin) */}
                    {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                        <div className="flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-90" onClick={() => navigate('/admin')}>
                            <div className="w-[46px] h-[46px] flex items-center justify-center rounded-[14px] bg-[#93328e] shadow-sm transform transition-all">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center leading-tight">Admin Room</span>
                        </div>
                    )}
                </div>

                {/* Banner Style Absen Info (Moved Above Informasi Kehadiran) */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden bg-white dark:bg-slate-900 mb-6 group cursor-pointer" onClick={() => navigate('/attendance')}>
                    <div className="absolute -right-4 -top-4 bg-[#00aa13] bg-opacity-10 w-24 h-24 rounded-full blur-2xl z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10 flex gap-4 items-center">
                        <div className="flex-1">
                            <h4 className="font-extrabold text-slate-800 dark:text-white mb-0.5 text-sm">
                                Siap untuk bekerja?
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-snug">
                                Jangan lupa untuk mencatat kehadiran Anda hari ini.
                            </p>
                        </div>
                        <div className="bg-[#00aa13] text-white px-4 py-2 rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-transform">
                            Absen
                        </div>
                    </div>
                </div>

                {/* Informasi Kehadiran (Rekap Bulanan) */}
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight text-lg">Informasi Kehadiran</h3>
                </div>
                
                {/* Month/Year selector styled cleanly */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    <Select value={selectedMonth.toString()} onValueChange={(v) => { setSelectedMonth(parseInt(v)); setIsLoading(true); }}>
                        <SelectTrigger className="h-8 max-w-fit px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold rounded-full shadow-sm focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={m.value} className="text-[11px]">{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear.toString()} onValueChange={(v) => { setSelectedYear(parseInt(v)); setIsLoading(true); }}>
                        <SelectTrigger className="h-8 max-w-fit px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold rounded-full shadow-sm focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y.value} value={y.value} className="text-[11px]">{y.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Layout Rekap Bulanan */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 mb-6">
                    <div className="text-xs font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Rekap Bulanan (Bulan Terpilih)</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#00aa13]"></div>
                                <span className="text-[11px] text-slate-500 font-medium">Total Absen Masuk</span>
                            </div>
                            <span className="font-bold text-slate-800 text-xl pl-4">{stats.totalMasuk} <span className="text-[10px] text-slate-400 font-normal">hari</span></span>
                        </div>
                        
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#00a5cf]"></div>
                                <span className="text-[11px] text-slate-500 font-medium">Total Absen Pulang</span>
                            </div>
                            <span className="font-bold text-slate-800 text-xl pl-4">{stats.totalPulang} <span className="text-[10px] text-slate-400 font-normal">hari</span></span>
                        </div>
                        
                        <div onClick={() => setShowAbsentModal(true)} className="flex flex-col cursor-pointer hover:bg-slate-50 rounded-lg -ml-2 p-2 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                <span className="text-[11px] text-slate-500 font-medium">Tidak Masuk (Alpha)</span>
                            </div>
                            <span className="font-bold text-rose-500 text-xl pl-2">{stats.tidakMasuk} <span className="text-[10px] bg-rose-100 text-rose-600 px-1 py-0.5 rounded font-medium ml-1">Detail</span></span>
                        </div>
                        
                        <div onClick={() => setShowLeaveModal(true)} className="flex flex-col cursor-pointer hover:bg-slate-50 rounded-lg -ml-2 p-2 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-[11px] text-slate-500 font-medium">Izin / Cuti / DL</span>
                            </div>
                            <span className="font-bold text-amber-500 text-xl pl-2">{stats.leaveDays} <span className="text-[10px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-medium ml-1">Detail</span></span>
                        </div>
                    </div>
                </div>

                {/* Recent Attendance History (Gojek List Style) */}
                <div className="mt-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight text-lg">Riwayat Absen Detail</h3>
                        <span className="text-[11px] font-semibold text-[#00aa13] cursor-pointer" onClick={() => navigate('/history')}>Lihat Semua</span>
                    </div>
                    
                    <div className="space-y-3">
                        {attendanceHistory === undefined || attendanceHistory.length === 0 ? (
                            <div className="text-center py-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <p className="text-sm text-slate-500">Tidak ada riwayat absen bulan ini</p>
                            </div>
                        ) : (
                            attendanceHistory.slice(0, 3).map((record) => (
                                <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                                            <Clock className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[12px] text-slate-800 dark:text-slate-200">
                                                {new Date(record.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                    Masuk: {record.clock_in ? new Date(record.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </span>
                                                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                    Pulang: {record.clock_out ? new Date(record.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        {record.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </main>

            `;

    fs.writeFileSync(file, p1 + newUI + p2, 'utf8');
    console.log('Successfully updated Index.tsx to structured Info Kehadiran');
} else {
    console.log('Failed to find layout markers!');
}
