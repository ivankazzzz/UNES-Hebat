import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";
import { Volume2, VolumeX, Music } from "lucide-react";

const PLAY_WHITELIST_USERNAMES = [
  "sufyarma.marsidin",
  "h.agussalim",
  "dian.wahyuni.dewi.fitri",
  "henny.puspita.sari",
  "tesx",
  "dewirman.prima.putra",
  "susi.delmiati",
  "jusmita.weriza",
  "takdir.mattaliti",
  "andi.syahrum.makkurade",
  "suparman",
  "yenitaroza",
  "aulya.bayu.de.patna.siregar",
  "dewi.retno.sani",
  "andi.fazzar.fardian.syah",
  "pandu.aji.putra.utama",
  "delsi",
  "bakhtiar",
  "andi.l",
  "rival.ramdani",
  "rudiyansa.putra"
];

export default function SoundPlayer() {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  const currentUser = getCurrentUser();

  // 1. Kriteria User untuk Musik KKN (Disabled pasca KKN)
  const isEligibleKkn = false;

  // 2. Kriteria User untuk Mars UNES (Seluruh user yang login)
  const isEligibleMars = currentUser && (
    currentUser.role === "dosen" ||
    currentUser.role === "pegawai" ||
    currentUser.role === "admin" ||
    currentUser.role === "superadmin" ||
    currentUser.role === "mahasiswa"
  );

  const isEligible = isEligibleMars;
  const targetSrc = isEligible ? "/MARS-UNES-AAI.mp3" : "";
  const isAllowedRoute = ["/", "/history", "/profile"].includes(location.pathname);

  // Efek untuk menginisialisasi atau mengganti file audio jika targetSrc berubah
  useEffect(() => {
    if (!targetSrc) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setHasEnded(false);
      setCurrentSrc("");
      return;
    }

    if (audioRef.current && currentSrc === targetSrc) {
      return;
    }

    // Pause audio lama jika ada
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(targetSrc);
    audio.loop = false; // Hanya dimainkan 1 kali, tidak di-loop
    audioRef.current = audio;
    setCurrentSrc(targetSrc);
    setHasEnded(false);
    setIsPlaying(false);

    const handleEnded = () => {
      setHasEnded(true);
      setIsPlaying(false);
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [targetSrc, currentSrc]);

  // Efek untuk memutar/jeda otomatis berdasarkan status halaman yang aktif
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isEligible || hasEnded) {
      if (audio && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
      setShowWidget(false);
      return;
    }

    setShowWidget(isAllowedRoute);

    if (isAllowedRoute && !isMuted) {
      const playAudio = () => {
        audio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.log("Autoplay diblokir browser, menunggu interaksi user...", err);
            setIsPlaying(false);
          });
      };

      playAudio();

      const handleUserInteraction = () => {
        if (audio.paused && !isMuted && !hasEnded) {
          playAudio();
        }
        window.removeEventListener("click", handleUserInteraction);
      };

      window.addEventListener("click", handleUserInteraction);

      return () => {
        window.removeEventListener("click", handleUserInteraction);
      };
    } else {
      if (!audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    }
  }, [isAllowedRoute, isEligible, isMuted, hasEnded, currentSrc]);

  // Toggle Mute/Unmute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      setIsMuted(false);
      audio.muted = false;
      if (isAllowedRoute && !hasEnded) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Gagal play setelah unmute:", err));
      }
    } else {
      setIsMuted(true);
      audio.pause();
      setIsPlaying(false);
    }
  };

  if (!showWidget || !isEligible) return null;

  // Nama tooltip dinamis berdasarkan jenis audio yang sedang diputar
  const tooltipText = isEligibleKkn
    ? "KKN UNES - Rudiyansa P. S.Sos"
    : "Mars UNES AAI";

  return (
    <div className="fixed bottom-24 right-4 z-[9999] flex items-center gap-2">
      {/* Label Tooltip Melayang yang Lembut */}
      {isPlaying && (
        <span className="bg-slate-900/90 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-400/30 font-medium tracking-wide animate-pulse shadow-lg select-none">
          {tooltipText}
        </span>
      )}

      {/* Floating Audio Button */}
      <button
        onClick={toggleMute}
        title={isMuted ? "Putar Musik" : "Senyap Musik"}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#8c1b1d] border-2 border-[#fbbf24] text-[#fbbf24] shadow-[0_4px_20px_rgba(140,27,29,0.4)] active:scale-95 transition-all duration-300 relative overflow-hidden"
      >
        {/* Glow Pulse Efek Emas */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[#fbbf24]/10 pointer-events-none" />
        )}

        {/* Piringan musik berputar */}
        <div
          className="flex items-center justify-center w-full h-full"
          style={{
            animation: isPlaying ? "spin 8s linear infinite" : "none",
          }}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 transition-transform" />
          ) : isPlaying ? (
            <Music className="w-5 h-5 transition-transform" />
          ) : (
            <Volume2 className="w-5 h-5 transition-transform animate-bounce" />
          )}
        </div>
      </button>

      {/* Tambahan style CSS spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
