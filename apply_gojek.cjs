const fs = require('fs');
const file = 'src/pages/Index.tsx';
let t = fs.readFileSync(file, 'utf8');

const searchStart = t.indexOf('<div className="flex h-[100dvh] flex-col w-full');
const searchEnd = t.indexOf('{/* Bottom Navigation */}');

if (searchStart > -1 && searchEnd > -1) {
    const p1 = t.substring(0, searchStart);
    const p2 = t.substring(searchEnd);
    
    // Gojek Style UI Block
    const newUI = `<div className="flex h-[100dvh] flex-col w-full bg-white dark:bg-slate-950 overflow-hidden">
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
                
                {/* Floating "Gopay" Style Card for Stats summary */}
                <div className="bg-[#0081a0] rounded-2xl p-4 shadow-lg text-white mb-6 border border-[#0092b6]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center">
                                <img src="/unes.png" alt="Logo" className="w-7 h-7 object-contain" />
                            </div>
                            <div>
                                <div className="font-bold text-sm tracking-tight mb-0.5">
                                    {currentUser?.full_name || 'Pengguna'}
                                </div>
                                <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded inline-flex font-semibold shadow-sm">
                                    {currentUser?.role?.toUpperCase() || 'USER'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 4 small stats like gopay actions */}
                    <div className="grid grid-cols-4 gap-2 bg-white text-slate-800 rounded-xl py-3 px-2 shadow-inner">
                        <div className="flex flex-col items-center">
                            <div className="font-black text-[#0081a0] text-lg mb-1 leading-none">{stats.totalMasuk}</div>
                            <div className="text-[10px] font-semibold text-slate-600 text-center leading-tight">Hadir</div>
                        </div>
                        <div className="flex flex-col items-center relative after:content-[''] after:absolute after:left-0 after:top-1 after:bottom-1 after:w-[1px] after:bg-slate-200">
                            <div className="font-black text-[#0081a0] text-lg mb-1 leading-none">{stats.totalPulang}</div>
                            <div className="text-[10px] font-semibold text-slate-600 text-center leading-tight">Pulang</div>
                        </div>
                        <div onClick={() => setShowAbsentModal(true)} className="flex flex-col items-center cursor-pointer relative after:content-[''] after:absolute after:left-0 after:top-1 after:bottom-1 after:w-[1px] after:bg-slate-200 active:scale-95 transition-transform">
                            <div className="font-black text-rose-500 text-lg mb-1 leading-none">{stats.tidakMasuk}</div>
                            <div className="text-[10px] font-semibold text-slate-600 text-center leading-tight">Alpha</div>
                        </div>
                        <div onClick={() => setShowLeaveModal(true)} className="flex flex-col items-center cursor-pointer relative after:content-[''] after:absolute after:left-0 after:top-1 after:bottom-1 after:w-[1px] after:bg-slate-200 active:scale-95 transition-transform">
                            <div className="font-black text-amber-500 text-lg mb-1 leading-none">{stats.leaveDays}</div>
                            <div className="text-[10px] font-semibold text-slate-600 text-center leading-tight">Izin/Cuti</div>
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

                {/* Promo / Banner Style Information */}
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

                {/* Banner Style Absen Info */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden bg-white dark:bg-slate-900 mb-6 group cursor-pointer" onClick={() => navigate('/attendance')}>
                    <div className="absolute -right-4 -top-4 bg-[#00aa13] bg-opacity-10 w-24 h-24 rounded-full blur-2xl z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10 flex gap-4 items-center">
                        <div className="flex-1">
                            <h4 className="font-extrabold text-slate-800 dark:text-white mb-0.5 text-sm">
                                Siap untuk bekerja?
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-snug">
                                Jangan lupa untuk mencatat kehadiran Anda tepat waktu.
                            </p>
                        </div>
                        <div className="bg-[#00aa13] text-white px-4 py-2 rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-transform">
                            Absen Tepat Waktu
                        </div>
                    </div>
                </div>

            </main>

            `;

    fs.writeFileSync(file, p1 + newUI + p2, 'utf8');
    console.log('Successfully updated Index.tsx to Gojek Style');
} else {
    console.log('Failed to find layout markers!');
}
