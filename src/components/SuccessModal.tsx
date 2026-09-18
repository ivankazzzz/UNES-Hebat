import { useState, useEffect, useCallback } from "react";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    buttonText?: string;
}

const SuccessModal = ({ 
    isOpen, 
    onClose, 
    title = "Berhasil!",
    message = "Data anda sudah dicatat",
    buttonText = "OK"
}: SuccessModalProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showCheckmark, setShowCheckmark] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset states
            setIsVisible(true);
            setIsAnimating(true);
            setShowCheckmark(false);
            setShowContent(false);
            
            // Staggered animation sequence
            const checkmarkTimer = setTimeout(() => setShowCheckmark(true), 150);
            const contentTimer = setTimeout(() => setShowContent(true), 400);
            const animatingTimer = setTimeout(() => setIsAnimating(false), 600);
            
            // Auto close after 4 seconds
            const autoCloseTimer = setTimeout(() => {
                handleClose();
            }, 4000);
            
            return () => {
                clearTimeout(checkmarkTimer);
                clearTimeout(contentTimer);
                clearTimeout(animatingTimer);
                clearTimeout(autoCloseTimer);
            };
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        // Start exit animation
        setShowContent(false);
        setTimeout(() => setShowCheckmark(false), 100);
        setTimeout(() => setIsAnimating(true), 150);
        
        // Actually close after animation completes
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 400);
    }, [onClose]);

    if (!isVisible) return null;

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
                {/* Top gradient accent */}
                <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
                
                <div className="flex flex-col items-center text-center p-8 space-y-6">
                    {/* Animated checkmark container */}
                    <div className="relative">
                        {/* Outer ring with pulse */}
                        <div 
                            className={`absolute inset-0 w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 transition-all duration-700 ease-out ${
                                showCheckmark ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                            }`}
                        />
                        
                        {/* Animated pulse rings */}
                        <div 
                            className={`absolute inset-0 w-24 h-24 rounded-full bg-green-200 dark:bg-green-800/40 transition-all duration-1000 ${
                                showCheckmark ? 'animate-ping opacity-30' : 'opacity-0'
                            }`}
                            style={{ animationDuration: '1.5s' }}
                        />
                        
                        {/* Inner circle with icon */}
                        <div 
                            className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-500 ease-out ${
                                showCheckmark ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'
                            }`}
                        >
                            <CheckCircle 
                                className={`w-12 h-12 text-white transition-all duration-300 delay-200 ${
                                    showCheckmark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                                }`}
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>
                    
                    {/* Title and message with staggered fade */}
                    <div 
                        className={`space-y-3 transition-all duration-500 ease-out delay-100 ${
                            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                    >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {title}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                            {message}
                        </p>
                    </div>
                    
                    {/* Button with slide up animation */}
                    <button 
                        onClick={handleClose}
                        className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98] ${
                            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: showContent ? '200ms' : '0ms' }}
                    >
                        {buttonText}
                    </button>
                </div>
                
                {/* Subtle bottom decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-50/50 dark:from-green-900/10 to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default SuccessModal;
