import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
}

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: NotificationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      
      // Reset and start animation sequence
      setIsVisible(true);
      setIsAnimating(true);
      setShowIcon(false);
      setShowContent(false);
      
      // Staggered animation sequence
      const animateIn = setTimeout(() => setIsAnimating(false), 50);
      const iconTimer = setTimeout(() => setShowIcon(true), 200);
      const contentTimer = setTimeout(() => setShowContent(true), 400);
      
      return () => {
        clearTimeout(animateIn);
        clearTimeout(iconTimer);
        clearTimeout(contentTimer);
      };
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    // Start exit animation sequence
    setShowContent(false);
    
    setTimeout(() => setShowIcon(false), 100);
    setTimeout(() => setIsAnimating(true), 200);
    
    // Actually close after animation completes
    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = "unset";
      onClose();
    }, 450);
  }, [onClose]);

  if (!isVisible) return null;

  const isSuccess = type === 'success';
  const gradientColors = isSuccess 
    ? 'from-green-400 via-emerald-500 to-teal-500' 
    : 'from-red-400 via-rose-500 to-pink-500';
  const iconBgColor = isSuccess 
    ? 'bg-green-100 dark:bg-green-900/30' 
    : 'bg-red-100 dark:bg-red-900/30';
  const iconGradient = isSuccess 
    ? 'from-green-400 to-emerald-500' 
    : 'from-red-400 to-rose-500';
  const buttonColors = isSuccess
    ? 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25 hover:shadow-green-500/30'
    : 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/25 hover:shadow-red-500/30';
  const pulseBgColor = isSuccess 
    ? 'bg-green-200 dark:bg-green-800/40' 
    : 'bg-red-200 dark:bg-red-800/40';

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isAnimating ? 'bg-black/0' : 'bg-black/60'
      }`}
      style={{ backdropFilter: isAnimating ? 'blur(0px)' : 'blur(8px)' }}
      onClick={handleClose}
    >
      <div 
        className={`relative max-w-sm w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 ease-out ${
          isAnimating 
            ? 'scale-90 opacity-0 translate-y-8' 
            : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 ${
            showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top gradient accent */}
        <div className={`h-1.5 bg-gradient-to-r ${gradientColors}`} />
        
        <div className="flex flex-col items-center text-center p-8 space-y-6">
          {/* Animated icon container */}
          <div className="relative">
            {/* Outer ring */}
            <div 
              className={`absolute inset-0 w-20 h-20 rounded-full ${iconBgColor} transition-all duration-700 ease-out ${
                showIcon ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            />
            
            {/* Animated pulse rings */}
            <div 
              className={`absolute inset-0 w-20 h-20 rounded-full ${pulseBgColor} transition-all duration-1000 ${
                showIcon ? 'animate-ping opacity-30' : 'opacity-0'
              }`}
              style={{ animationDuration: '1.5s' }}
            />
            
            {/* Inner circle with icon */}
            <div 
              className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg transition-all duration-500 ease-out ${
                showIcon ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'
              }`}
              style={{ 
                boxShadow: isSuccess 
                  ? '0 10px 25px -5px rgba(34, 197, 94, 0.3)' 
                  : '0 10px 25px -5px rgba(239, 68, 68, 0.3)' 
              }}
            >
              {isSuccess ? (
                <CheckCircle2 
                  className={`w-10 h-10 text-white transition-all duration-300 delay-200 ${
                    showIcon ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                  strokeWidth={2.5}
                />
              ) : (
                <AlertTriangle 
                  className={`w-10 h-10 text-white transition-all duration-300 delay-200 ${
                    showIcon ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                  strokeWidth={2.5}
                />
              )}
            </div>
          </div>
          
          {/* Title and message with staggered fade */}
          <div 
            className={`space-y-3 transition-all duration-500 ease-out delay-100 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>
          
          {/* Button with slide up animation */}
          <button
            onClick={handleClose}
            className={`w-full bg-gradient-to-r ${buttonColors} text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: showContent ? '200ms' : '0ms' }}
          >
            OK
          </button>
        </div>
        
        {/* Subtle bottom decoration */}
        <div 
          className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t pointer-events-none ${
            isSuccess ? 'from-green-50/50 dark:from-green-900/10' : 'from-red-50/50 dark:from-red-900/10'
          } to-transparent`} 
        />
      </div>
    </div>
  );
}
