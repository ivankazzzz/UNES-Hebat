import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-champagne-gold rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animation: `float ${10 + particle.id * 0.5}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

interface HoverEffectProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  glow?: boolean;
}

export function HoverEffect({ children, className = "", scale = 1.05, glow = true }: HoverEffectProps) {
  return (
    <div className={`group relative transition-transform duration-300 ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-champagne-gold opacity-0 group-hover:opacity-20 rounded-xl blur-xl transition-opacity duration-300" />
      )}
      <div className="relative transform group-hover:scale-105 transition-transform duration-300">
        {children}
      </div>
    </div>
  );
}

interface RippleProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function RippleEffect({ children, className = "", color = "champagne-gold" }: RippleProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const createRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseDown={createRipple}
    >
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute bg-champagne-gold rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
      {children}
    </div>
  );
}

interface TypewriterProps {
  text: string;
  delay?: number;
  className?: string;
}

export function TypewriterEffect({ text, delay = 50, className = "" }: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

interface PulseProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function PulseEffect({ children, className = "", intensity = "medium" }: PulseProps) {
  const intensityMap = {
    low: "animate-pulse",
    medium: "animate-bounce",
    high: "animate-spin",
  };

  return (
    <div className={`${intensityMap[intensity]} ${className}`}>
      {children}
    </div>
  );
}

interface SlideInProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  className?: string;
}

export function SlideInEffect({ 
  children, 
  direction = "up", 
  delay = 0, 
  className = "" 
}: SlideInProps) {
  const directionClasses = {
    left: "translate-x-full",
    right: "-translate-x-full",
    up: "translate-y-full",
    down: "-translate-y-full",
  };

  return (
    <div 
      className={`
        transform transition-all duration-700 ease-out
        ${directionClasses[direction]}
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        animation: `slideIn 0.7s ease-out ${delay}ms forwards`,
      }}
    >
      {children}
    </div>
  );
}

interface GlowTextProps {
  children: React.ReactNode;
  color?: string;
  intensity?: "low" | "medium" | "high";
  className?: string;
}

export function GlowText({ 
  children, 
  color = "champagne-gold", 
  intensity = "medium", 
  className = "" 
}: GlowTextProps) {
  const intensityMap = {
    low: "shadow-sm",
    medium: "shadow-lg",
    high: "shadow-2xl",
  };

  return (
    <span 
      className={`
        ${intensityMap[intensity]}
        transition-all duration-300 hover:scale-105
        ${className}
      `}
      style={{
        textShadow: `0 0 ${intensity === 'low' ? '10px' : intensity === 'medium' ? '20px' : '30px'} rgba(var(--${color}), 0.5)`,
      }}
    >
      {children}
    </span>
  );
}

interface CounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function AnimatedCounter({ 
  from, 
  to, 
  duration = 2000, 
  className = "", 
  suffix = "" 
}: CounterProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      setCount(Math.floor(from + (to - from) * progress));

      if (now < endTime) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return (
    <span className={className}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}
