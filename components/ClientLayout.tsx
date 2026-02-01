"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";

const SPLASH_SHOWN_KEY = "zelana_splash_shown";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  // Start with null to avoid hydration mismatch
  const [isLoading, setIsLoading] = useState<boolean | null>(null);

  useEffect(() => {
    // Only show splash on homepage and if not already shown this session
    if (isHome) {
      const hasSeenSplash = sessionStorage.getItem(SPLASH_SHOWN_KEY);
      if (!hasSeenSplash) {
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [isHome]);

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isLoading]);

  const handleFinishLoading = () => {
    // Mark as shown for this session
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "true");
    setIsLoading(false);
  };

  // During hydration, render nothing for splash to avoid mismatch
  if (isLoading === null) {
    return (
      <div className={isHome ? "opacity-0" : "opacity-100"}>
        {children}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && isHome && (
          <motion.div
            key="splash"
            exit={{ 
              opacity: 0,
              scale: 1.05,
              filter: "blur(10px)",
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.22, 1, 0.36, 1]
            }}
            className="fixed inset-0 z-[9999]"
          >
            <SplashScreen finishLoading={handleFinishLoading} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content - fade in after splash */}
      <motion.div
        initial={isHome && isLoading ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: isLoading ? 0.3 : 0 }}
      >
        {children}
      </motion.div>
    </>
  );
}
