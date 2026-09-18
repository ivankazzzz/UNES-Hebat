import { ReactNode, useState, useEffect, useCallback } from "react";
import Header from "./Header";
import SidebarNavigation from "./SidebarNavigation";
import DockNavigation from "./DockNavigation";
import { X } from "lucide-react";
import { refreshSessionTimestamp } from "@/lib/auth";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Refresh session timestamp pada aktivitas user
  const handleUserActivity = useCallback(() => {
    refreshSessionTimestamp();
  }, []);

  useEffect(() => {
    // Refresh session saat Layout dimount (user navigasi ke halaman baru)
    refreshSessionTimestamp();

    // Listen untuk aktivitas user dan refresh session
    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    
    // Debounce untuk tidak terlalu sering update
    let timeout: ReturnType<typeof setTimeout>;
    const debouncedHandler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleUserActivity, 1000); // Debounce 1 detik
    };

    events.forEach(event => {
      window.addEventListener(event, debouncedHandler, { passive: true });
    });

    return () => {
      clearTimeout(timeout);
      events.forEach(event => {
        window.removeEventListener(event, debouncedHandler);
      });
    };
  }, [handleUserActivity]);

  return (
    <div className="min-h-screen bg-corporate-gray">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 z-40">
        <SidebarNavigation />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 z-50 lg:hidden transform transition-transform duration-300 ease-in-out
        shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute right-2 top-2 z-50 lg:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarNavigation />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Page Content */}
        <main className="flex-1 p-0 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <DockNavigation />
      </div>
    </div>
  );
}