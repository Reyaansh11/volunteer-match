'use client';
import { useEffect, useRef, type ReactNode } from 'react';

export function FadeIn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = 'true';
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible="false"
      className={`transition-all duration-700 ease-out data-[visible=false]:opacity-0 data-[visible=false]:translate-y-5 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 ${className}`}
    >
      {children}
    </div>
  );
}
