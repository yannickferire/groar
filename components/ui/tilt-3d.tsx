"use client";

import { useRef, useCallback, useState, type ReactNode, type CSSProperties } from "react";

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
}

export function Tilt3D({
  children,
  className = "",
  style,
  maxTilt = 8,
  scale = 1.02,
  speed = 300,
  glare = false,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    const rect = rectRef.current;
    if (!el || !rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - y) * maxTilt * 2;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    if (glare && glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,230,140,0.5) 0%, transparent 55%)`;
    }
  }, [maxTilt, scale, glare]);

  const handleMouseEnter = useCallback(() => {
    rectRef.current = ref.current?.getBoundingClientRect() ?? null;
    setHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
    rectRef.current = null;
    if (ref.current) {
      ref.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)",
        transition: hovering ? `transform ${speed * 0.5}ms ease-out` : `transform ${speed}ms ease-out`,
        transformStyle: "preserve-3d",
        willChange: hovering ? "transform" : "auto",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: hovering ? 0.25 : 0,
            transition: `opacity ${speed}ms ease-out`,
          }}
        />
      )}
    </div>
  );
}
