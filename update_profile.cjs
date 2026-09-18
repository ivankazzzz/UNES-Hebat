const fs = require('fs');
const filepath = 'src/pages/Profile.tsx';
let text = fs.readFileSync(filepath, 'utf8');

const startIdx = text.indexOf('<header');
const endMarker = '        {/* Main Content */}';
const endIdx = text.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const oldStr = text.slice(startIdx, endIdx);
    const newStr = `<header className="shrink-0 relative z-20 overflow-hidden bg-[#0081a0] rounded-b-[30px] shadow-sm px-5 py-6 w-full">
          {/* Decorative Elements */}
          <div className="absolute top-[-50px] right-[-30px] w-48 h-48 rounded-full bg-white/10 blur-[30px] z-0 pointer-events-none" />
          <div className="absolute bottom-[-10px] left-[-20px] w-32 h-32 rounded-full bg-white/10 blur-[20px] z-0 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                  <button
                      onClick={() => navigate(-1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all shadow-sm"
                  >
                      <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex flex-col">
                      <h1 className="text-lg font-bold tracking-tight text-white mb-0 drop-shadow-sm">Profil Akun</h1>
                      <p className="text-[11px] text-white/90 font-medium tracking-wide">Informasi data diri Anda</p>
                  </div>
              </div>
              {/* Logo Right */}
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md p-1.5 ml-auto relative group">
                  <img src="/unes.png" alt="UNES" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
              </div>
          </div>
        </header>

`;
    fs.writeFileSync(filepath, text.replace(oldStr, newStr));
    console.log('Successfully updated Profile header');
}
