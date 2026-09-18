const fs = require('fs');
const path = 'c:/Users/Administrator/Documents/GitHub/absensiunesv2/src/pages/Index.tsx';

let content = fs.readFileSync(path, 'utf8');

const startIdx = content.indexOf('    return (');
const endIdx = content.indexOf('            {/* Bottom Navigation */}');

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find boundaries', startIdx, endIdx);
    process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const newRender = `    return (
        <div className="flex h-[100dvh] flex-col w-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden">
            {/* Header Clean Design */}
            <header className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 shadow-sm z-10 w-full relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                            <img
                                alt="University Logo"
                                className="h-8 w-8 object-contain"
                                src="/unes.png"
                            />
                        </div>
                        <div>
                            <h1 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">UNIVERSITAS EKASAKTI</h1>
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Absensi Online</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                    >
                        <User className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow overflow-y-auto px-5 py-6 w-full pb-28">
                {/* User Greeting Section */}
                <div className="mb-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{getGreeting()}</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                        {currentUser?.full_name || '[Nama Pengguna]'}
                    </h2>
                    
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[11px] font-semibold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                            {currentUser?.role === 'superadmin' ? 'Super Administrator' : currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'dosen' ? 'Dosen' : 'Tendik'}
                            {currentUser?.unit_kerja ? \` - \${currentUser.unit_kerja}\` : ''}
                        </span>
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <MapPin className="mr-1.5 w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">{locationName}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <section className="mb-8">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Aksi Cepat</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {/* Action 1 */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai') && (
                            <Link
                                to="/attendance"
                                className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mr-4">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Absensi Kehadiran</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Catat kehadiran masuk dan pulang</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 relative right-0" />
                            </Link>
                        )}

                        {/* Action 2 */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai') && (
                            <Link
                                to="/izin-cuti"
                                className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mr-4">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Izin & Cuti</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Ajukan izin, cuti, atau dinas luar</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                            </Link>
                        )}

                        {/* Action Admin */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                            <Link
                                to="/admin"
                                className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mr-4">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Panel Admin</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Kelola pengguna dan laporan</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                            </Link>
                        )}
                    </div>
                </section>

                {/* Statistics */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Statistik Anda</h3>
                        
                        <div className="flex items-center gap-2">
                            <Select 
                                value={selectedMonth.toString()} 
                                onValueChange={(value) => {
                                    setSelectedMonth(parseInt(value));
                                    setIsLoading(true);
                                }}
                            >
                                <SelectTrigger className="w-[100px] h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[11px] font-medium rounded-lg">
                                    <SelectValue placeholder="Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month) => (
                                        <SelectItem key={month.value} value={month.value} className="text-[11px]">
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            <Select 
                                value={selectedYear.toString()} 
                                onValueChange={(value) => {
                                    setSelectedYear(parseInt(value));
                                    setIsLoading(true);
                                }}
                            >
                                <SelectTrigger className="w-[80px] h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[11px] font-medium rounded-lg">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year.value} value={year.value} className="text-[11px]">
                                            {year.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Masuk */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            {isLoading ? (
                                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mb-1" />
                            ) : (
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.totalMasuk}</p>
                            )}
                            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Masuk</p>
                        </div>

                        {/* Pulang */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                                <LogOut className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            {isLoading ? (
                                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mb-1" />
                            ) : (
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.totalPulang}</p>
                            )}
                            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Pulang</p>
                        </div>

                        {/* Absen (Interactive) */}
                        <div 
                            onClick={() => setShowAbsentModal(true)}
                            className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 transition-all active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-3">
                                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            {isLoading ? (
                                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mb-1" />
                            ) : (
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.tidakMasuk}</p>
                            )}
                            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Tidak Hadir</p>
                        </div>

                        {/* Izin/Cuti (Interactive) */}
                        <div 
                            onClick={() => setShowLeaveModal(true)}
                            className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-all active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3">
                                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            {isLoading ? (
                                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mb-1" />
                            ) : (
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.leaveDays}</p>
                            )}
                            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Izin / Cuti</p>
                        </div>
                    </div>
                </section>
            </main>
`;

const newContent = before + newRender + "\n" + after;
fs.writeFileSync(path, newContent, 'utf8');
console.log('Successfully updated Index.tsx');
