import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { login, isAuthenticated, saveUserSession } from "@/lib/auth";
import { Eye, EyeOff, User, Lock, Loader2, Clock, Info, X, CheckCircle, Shield, Building, Ban } from "lucide-react";

const DosenNotificationToast = ({ onClose }: { onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 transition-all duration-300 ease-out ${
        isVisible && !isExiting ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-350 ease-out border border-white/20 ${
          isVisible && !isExiting
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 to-blue-500" />
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-6 pt-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center ring-4 ring-blue-50/50">
              <Info className="w-8 h-8 text-blue-700" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 text-center mb-3 font-display">
            Pemberitahuan
          </h3>
          <p className="text-slate-600 text-center text-base leading-relaxed mb-6">
            Maaf, sistem absensi online diperuntukkan untuk{" "}
            <span className="text-blue-700 font-bold">Dosen Struktural</span>,{" "}
            <span className="text-blue-700 font-bold">Tenaga Kependidikan</span>,{" "}
            Universitas Ekasakti.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-2xl text-base shadow-lg shadow-blue-700/20 transition-all duration-200 active:scale-[0.98]"
          >
            Baik
          </button>
        </div>
      </div>
    </div>
  );
};

const RevokedNotificationToast = ({ onClose }: { onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 transition-all duration-300 ease-out ${
        isVisible && !isExiting ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-350 ease-out border border-red-200 ${
          isVisible && !isExiting
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-red-400" />
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-6 pt-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center ring-4 ring-red-50/50">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <p className="text-amber-800 text-center text-base">
              <span className="font-semibold">Maaf, sistem absensi online diperuntukkan untuk Dosen Struktural dan Tenaga Kependidikan Universitas Ekasakti.</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-2xl text-base shadow-lg shadow-red-600/20 transition-all duration-200 active:scale-[0.98]"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

const MahasiswaBlockedNotificationToast = ({ onClose }: { onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 transition-all duration-300 ease-out ${
        isVisible && !isExiting ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-350 ease-out border border-white/20 ${
          isVisible && !isExiting
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-red-400" />
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-6 pt-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center ring-4 ring-red-50/50">
              <Ban className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <p className="text-amber-800 text-center text-base">
              <span className="font-semibold">Mohon Maaf, UNES Hebat saat ini hanya untuk Dosen Struktural dan Tenaga Kependidikan UNES.</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-2xl text-base shadow-lg shadow-red-600/20 transition-all duration-200 active:scale-[0.98]"
          >
            Baik
          </button>
        </div>
      </div>
    </div>
  );
};

const WelcomeAnimation = ({ userName, onComplete }: { userName: string; onComplete: () => void }) => {
  const [phase, setPhase] = useState<"enter" | "scale" | "fade" | "exit">("enter");

  useEffect(() => {
    const scaleTimer = setTimeout(() => setPhase("scale"), 300);
    const fadeTimer = setTimeout(() => setPhase("fade"), 2200);
    const exitTimer = setTimeout(() => setPhase("exit"), 2800);
    const completeTimer = setTimeout(onComplete, 3400);
    return () => {
      clearTimeout(scaleTimer);
      clearTimeout(fadeTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-out ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, #6b1516 0%, #8c1b1d 50%, #6b1516 100%)",
      }}
    >
      {/* iOS-style Background Blur Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full transition-all duration-1000 ${
            phase === "enter" ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
          style={{
            background: "radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div 
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full transition-all duration-1000 ${
            phase === "enter" ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
          style={{
            background: "radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            transitionDelay: "200ms"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center px-6">
        {/* Success Icon with iOS-style Animation */}
        <div 
          className={`mb-10 relative transition-all ${
            phase === "enter" 
              ? "scale-0 opacity-0" 
              : phase === "scale" 
              ? "scale-100 opacity-100" 
              : "scale-[18] opacity-0 pointer-events-none"
          }`}
          style={{
            transitionDuration: "900ms",
            transitionTimingFunction: phase === "fade" || phase === "exit"
              ? "cubic-bezier(0.25, 1, 0.50, 1)"
              : "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <div 
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)",
              filter: "blur(40px)",
              transform: "scale(1.5)",
            }}
          />
          <div className="relative w-32 h-32 bg-white/95 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center border-4 border-white/50 overflow-hidden">
            <img 
              src="/unes.png" 
              alt="UNES Logo" 
              className="w-20 h-20 object-contain" 
            />
          </div>
        </div>

        {/* Text Content with Smooth Fade */}
        <div 
          className={`text-center z-10 transition-all duration-700 ${
            phase === "enter" 
              ? "opacity-0 translate-y-4" 
              : phase === "scale" 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4 scale-95"
          }`}
          style={{ transitionDelay: phase === "scale" ? "300ms" : "0ms" }}
        >
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Login Berhasil
          </h2>
          <p className="text-lg text-amber-100/80 font-medium mb-1">Selamat Datang</p>
          <p className="text-2xl font-bold text-amber-400 tracking-wide drop-shadow-lg" style={{ letterSpacing: "-0.01em" }}>
            {userName}
          </p>
        </div>

        {/* iOS-style Loading Indicator */}
        <div 
          className={`mt-12 flex gap-2 transition-all duration-500 ${
            phase === "enter" ? "opacity-0" : phase === "scale" ? "opacity-60" : "opacity-0"
          }`}
          style={{ transitionDelay: phase === "scale" ? "500ms" : "0ms" }}
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms", animationDuration: "1s" }} />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms", animationDuration: "1s" }} />
        </div>
      </div>
    </div>
  );
};

const TypingText = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  useEffect(() => {
    if (isPausing) return;

    const typingSpeed = isDeleting ? 40 : 70;
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < text.length) {
          setDisplayed(text.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        } else {
          setIsPausing(true);
          setTimeout(() => {
            setIsPausing(false);
            setIsDeleting(true);
          }, 2200);
        }
      } else {
        if (charIndex > 0) {
          setDisplayed(text.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        } else {
          setIsDeleting(false);
          setIsPausing(true);
          setTimeout(() => setIsPausing(false), 400);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, isPausing, text]);

  return (
    <span
      style={{
        fontSize: "24px",
        fontWeight: 800,
        color: "#ffffff",
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
      }}
    >
      {displayed}
      <span
        style={{
          display: "inline-block",
          width: "2px",
          height: "1.1em",
          background: "#fbbf24",
          marginLeft: "3px",
          verticalAlign: "middle",
          borderRadius: "1px",
          animation: "blink-cursor 0.75s step-end infinite",
        }}
      />
    </span>
  );
};


export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ full_name: string } | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);
  const [showMahasiswaBlocked, setShowMahasiswaBlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  const locationState = location.state as { from?: Location } | null;
  const fromPath = locationState?.from?.pathname;

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(location.search);
    if (params.get("session") === "expired") {
      setSessionExpired(true);
      window.history.replaceState({}, "", "/login");
    }
  }, [location.search]);

  const resolveRedirectPath = useCallback(() => {
    const defaultPath = "/";
    if (!fromPath || fromPath === "/admin") return defaultPath;
    return fromPath;
  }, [fromPath]);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(resolveRedirectPath(), { replace: true });
    }
  }, [navigate, resolveRedirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));
      const loginPromise = login(username, password);
      
      const [user] = await Promise.all([loginPromise, minLoadingTime]);

      if (user) {
        // Cek apakah user di-revoke (is_blocked = true)
        if (user.is_blocked) {
          setShowAccessDenied(true);
          setLoading(false);
          setPassword("");
          return;
        }

        const isKetuaYPTP = user.unit_kerja?.toLowerCase().includes("ketua yptp");
        const isSekretarisYPTP = user.unit_kerja?.toLowerCase().includes("sekretaris yptp");
        const isSatpam = user.unit_kerja?.toLowerCase().includes("satpam");
        const isCleaningService = user.unit_kerja?.toLowerCase().includes("cleaning service") || 
                                   user.unit_kerja?.toLowerCase().includes("kebersihan");

        const isDplNonStruktural = user.role === "dosen" && user.is_dpl_kkn && !user.is_struktural && !isKetuaYPTP && !isSekretarisYPTP;

        // Blokir mahasiswa dan DPL KKN non-struktural login (pasca KKN selesai)
        if (user.role === "mahasiswa" || isDplNonStruktural) {
          setShowMahasiswaBlocked(true);
          setLoading(false);
          setPassword("");
          return;
        }

        // Blokir satpam, komandan satpam, wakil komandan satpam, dan cleaning service
        if (isSatpam || isCleaningService) {
          setShowAccessDenied(true);
          setLoading(false);
          setPassword("");
          return;
        }

        if (user.role === "dosen" && !user.is_struktural && !user.is_dpl_kkn && !isKetuaYPTP && !isSekretarisYPTP) {
          setShowAccessDenied(true);
          setLoading(false);
          setPassword("");
          return;
        }

        saveUserSession(user);
        setLoggedInUser(user);
        setShowWelcome(true);
      } else {
        setError("Nama pengguna atau password Bapak/Ibu salah. Silahkan coba lagi dengan hati-hati.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = useCallback(() => {
    navigate(resolveRedirectPath(), { replace: true });
  }, [navigate, resolveRedirectPath]);

  const handleCloseAccessDenied = () => {
    setShowAccessDenied(false);
    setUsername("");
    setPassword("");
  };

  const handleCloseRevoked = () => {
    setShowRevoked(false);
    setUsername("");
    setPassword("");
  }

  const handleCloseMahasiswaBlocked = () => {
    setShowMahasiswaBlocked(false);
    setUsername("");
    setPassword("");
  };

  if (showAccessDenied) {
    return <DosenNotificationToast onClose={handleCloseAccessDenied} />;
  }

  if (showRevoked) {
    return <RevokedNotificationToast onClose={handleCloseRevoked} />;
  }

  if (showMahasiswaBlocked) {
    return <MahasiswaBlockedNotificationToast onClose={handleCloseMahasiswaBlocked} />;
  }

  if (showWelcome && loggedInUser) {
    return <WelcomeAnimation userName={loggedInUser.full_name} onComplete={handleWelcomeComplete} />;
  }

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden"
      style={{ background: "#f5f6fa" }}
    >
      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes decorCircle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.18; }
          50% { transform: scale(1.06) rotate(8deg); opacity: 0.28; }
        }
        @keyframes goldLine {
          0%, 100% { width: 32px; opacity: 0.7; }
          50% { width: 52px; opacity: 1; }
        }
        @keyframes pulse-logo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.35), 0 8px 32px rgba(140,27,29,0.18); }
          50% { box-shadow: 0 0 0 8px rgba(251,191,36,0.10), 0 12px 40px rgba(140,27,29,0.28); }
        }
        @keyframes card-in {
          from { transform: translateY(40px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .card-entrance {
          animation: card-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, opacity;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      {/* ===== TOP SECTION: Solid #8c1b1d ===== */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          background: "#8c1b1d",
          minHeight: "260px",
          paddingBottom: "48px",
          borderRadius: "0 0 36px 36px",
        }}
      >
        {/* Decorative circles (red tone, subtle) */}
        <div
          className="absolute"
          style={{
            top: "-60px",
            right: "-60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            border: "2.5px solid rgba(251,191,36,0.18)",
            animation: "decorCircle 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "-30px",
            right: "-30px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "2px solid rgba(251,191,36,0.28)",
            animation: "decorCircle 5s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "20px",
            left: "-40px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.10)",
            animation: "decorCircle 8s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
        {/* Gold accent top-left corner */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: "80px",
            height: "4px",
            background: "linear-gradient(90deg, #fbbf24 0%, transparent 100%)",
            borderRadius: "0 0 4px 0",
          }}
        />
        <div
          className="absolute top-0 left-0"
          style={{
            width: "4px",
            height: "80px",
            background: "linear-gradient(180deg, #fbbf24 0%, transparent 100%)",
            borderRadius: "0 0 4px 0",
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 w-full max-w-lg mx-auto px-6 pt-10"
          style={{ animation: "slideDown 0.7s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          {/* Logo Row */}
          <div className="flex items-center gap-4 mb-5">
            {/* Logo bubble */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full bg-white"
              style={{
                width: "68px",
                height: "68px",
                boxShadow: "0 0 0 4px rgba(251,191,36,0.30), 0 8px 32px rgba(0,0,0,0.22)",
                animation: "pulse-logo 3s ease-in-out infinite",
              }}
            >
              <img
                alt="UNES AAI"
                src="/unes.png"
                style={{ width: "46px", height: "46px", objectFit: "contain" }}
              />
            </div>

            {/* Brand text */}
            <div className="flex flex-col gap-0.5">
              {/* UNES - AAI badge */}
              <div className="flex items-center gap-2">
                <div
                  style={{
                    height: "2px",
                    background: "linear-gradient(90deg, #fbbf24, transparent)",
                    animation: "goldLine 2.5s ease-in-out infinite",
                    borderRadius: "2px",
                    width: "32px",
                  }}
                />
                <span
                  style={{
                    color: "#fbbf24",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  UNES &bull; AAI
                </span>
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                Universitas Ekasakti
              </span>
            </div>
          </div>

          {/* Typing greeting — left aligned */}
          <div className="mb-1" style={{ minHeight: "36px" }}>
            <TypingText
              text="Selamat Datang di UNES Hebat"
            />
          </div>


          {/* Gold divider */}
          <div
            style={{
              marginTop: "18px",
              height: "2px",
              background: "linear-gradient(90deg, #fbbf24 0%, rgba(251,191,36,0.15) 70%, transparent 100%)",
              borderRadius: "2px",
              width: "70%",
            }}
          />
        </div>
      </div>

      {/* ===== BOTTOM SECTION: Light background with form ===== */}
      <div
        className="relative w-full max-w-lg mx-auto px-5"
        style={{ marginTop: "24px", paddingBottom: "32px" }}
      >
        {/* Red/yellow accent strip */}
        <div
          className="flex items-center gap-2 mb-4"
          style={{ animation: "fadeIn 0.8s ease-out 0.3s both" }}
        >
          <div style={{ width: "4px", height: "32px", background: "#8c1b1d", borderRadius: "4px" }} />
          <div style={{ width: "4px", height: "24px", background: "#fbbf24", borderRadius: "4px" }} />
          <span style={{ color: "#8c1b1d", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>
            Masuk ke Akun Anda
          </span>
        </div>

        {/* Error / Session expired banners */}
        {(sessionExpired || error) && (
          <div className="mb-3 w-full animate-fade-in">
            {sessionExpired && (
              <div
                className="w-full text-white px-4 py-3 rounded-2xl text-[14px] shadow-lg flex items-center gap-2.5"
                style={{ background: "#1a4d8f", border: "1px solid rgba(59,130,246,0.3)" }}
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">Sesi berakhir. Login kembali.</span>
              </div>
            )}
            {error && (
              <div
                className="w-full text-white px-4 py-3 rounded-2xl text-[14px] shadow-lg flex items-start gap-2.5"
                style={{ background: "#8c1b1d", border: "1px solid rgba(140,27,29,0.4)" }}
              >
                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-semibold leading-tight">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Login Card */}
        <div
          className="card-entrance"
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 4px 40px rgba(140,27,29,0.10), 0 1px 4px rgba(0,0,0,0.07)",
            border: "1px solid rgba(140,27,29,0.08)",
            overflow: "hidden",
            animationDelay: "0.25s",
          }}
        >
          {/* Card header accent */}
          <div
            style={{
              height: "4px",
              background: "linear-gradient(90deg, #8c1b1d 0%, #c0392b 40%, #fbbf24 100%)",
            }}
          />

          <div style={{ padding: "24px 20px 28px" }}>
            {/* Header row */}
            <div className="flex items-center gap-2 mb-5">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(140,27,29,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Shield style={{ width: "16px", height: "16px", color: "#8c1b1d" }} />
              </div>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", letterSpacing: "0.01em" }}>
                Masuk ke Sistem
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: focusedField === "username" ? "#8c1b1d" : "#475569",
                    display: "block",
                    marginLeft: "2px",
                    transition: "color 0.2s",
                  }}
                >
                  Username
                </label>
                <div className="relative">
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: focusedField === "username" ? "rgba(140,27,29,0.08)" : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s",
                    }}
                  >
                    <User style={{ width: "18px", height: "18px", color: focusedField === "username" ? "#8c1b1d" : "#94a3b8" }} />
                  </div>
                  <input
                    id="login-username"
                    className="w-full"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoFocus
                    style={{
                      height: "52px",
                      borderRadius: "14px",
                      border: focusedField === "username" ? "2px solid #8c1b1d" : "2px solid #e2e8f0",
                      background: focusedField === "username" ? "#fff" : "#f8fafc",
                      paddingLeft: "60px",
                      paddingRight: "16px",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                      transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                      boxShadow: focusedField === "username" ? "0 0 0 3px rgba(140,27,29,0.10)" : "none",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: focusedField === "password" ? "#8c1b1d" : "#475569",
                    display: "block",
                    marginLeft: "2px",
                    transition: "color 0.2s",
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: focusedField === "password" ? "rgba(140,27,29,0.08)" : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s",
                    }}
                  >
                    <Lock style={{ width: "18px", height: "18px", color: focusedField === "password" ? "#8c1b1d" : "#94a3b8" }} />
                  </div>
                  <input
                    id="login-password"
                    placeholder="Kata Sandi"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={{
                      width: "100%",
                      height: "52px",
                      borderRadius: "14px",
                      border: focusedField === "password" ? "2px solid #8c1b1d" : "2px solid #e2e8f0",
                      background: focusedField === "password" ? "#fff" : "#f8fafc",
                      paddingLeft: "60px",
                      paddingRight: "52px",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                      transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                      boxShadow: focusedField === "password" ? "0 0 0 3px rgba(140,27,29,0.10)" : "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "8px",
                      color: "#94a3b8",
                      borderRadius: "10px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#8c1b1d"; e.currentTarget.style.background = "rgba(140,27,29,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
                  >
                    {showPassword ? <EyeOff style={{ width: "18px", height: "18px" }} /> : <Eye style={{ width: "18px", height: "18px" }} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "52px",
                  marginTop: "8px",
                  background: loading
                    ? "#a03030"
                    : "linear-gradient(135deg, #8c1b1d 0%, #b52020 50%, #8c1b1d 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "15px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.8 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 20px rgba(140,27,29,0.35)",
                  transition: "all 0.2s",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = "0 6px 28px rgba(140,27,29,0.45)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(140,27,29,0.35)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {loading && <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />}
                {loading ? "Memproses..." : "Masuk Aplikasi"}
              </button>
            </form>
          </div>
        </div>



        {/* Footer */}
        <div
          className="text-center mt-6"
          style={{ animation: "fadeIn 1s ease-out 0.7s both" }}
        >
          <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Dibuat dan Dikembangkan oleh
          </p>
          <a
            href="https://scholar.google.com/citations?user=fffNQqcAAAAJ&hl=id"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "4px",
              color: "#8c1b1d",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fbbf24"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#8c1b1d"; }}
          >
            Irfan Ananda M.Pd, Gr.
          </a>
        </div>
      </div>
    </div>
  );
}
