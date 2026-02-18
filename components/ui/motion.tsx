"use client";

import { motion, HTMLMotionProps, useMotionValue, useTransform, useInView, animate } from "framer-motion";
import { ReactNode, JSX, useEffect, useRef } from "react";

type FadeInProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 24,
  ...props
}: FadeInProps) {
  const directions = {
    up: { translateY: distance },
    down: { translateY: -distance },
    left: { translateX: distance },
    right: { translateX: -distance },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, translateX: 0, translateY: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type FadeInViewProps = FadeInProps & {
  once?: boolean;
  amount?: number;
};

export function FadeInView({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 24,
  once = true,
  amount = 0.5,
  ...props
}: FadeInViewProps) {
  const directions = {
    up: { translateY: distance },
    down: { translateY: -distance },
    left: { translateX: distance },
    right: { translateX: -distance },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, translateX: 0, translateY: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerContainerProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  amount?: number;
  as?: keyof JSX.IntrinsicElements;
};

export function StaggerContainer({
  children,
  staggerDelay = 0.12,
  delayChildren = 0,
  amount = 0.15,
  as,
  ...props
}: StaggerContainerProps) {
  const Component = as ? (motion as unknown as Record<string, typeof motion.div>)[as] : motion.div;

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </Component>
  );
}

type StaggerItemProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  as?: keyof JSX.IntrinsicElements;
};

export function StaggerItem({
  children,
  direction = "up",
  distance = 24,
  as,
  ...props
}: StaggerItemProps) {
  const directions = {
    up: { translateY: distance },
    down: { translateY: -distance },
    left: { translateX: distance },
    right: { translateX: -distance },
    none: {},
  };

  const Component = as ? (motion as unknown as Record<string, typeof motion.div>)[as] : motion.div;

  return (
    <Component
      variants={{
        hidden: { opacity: 0, ...directions[direction] },
        visible: { opacity: 1, translateX: 0, translateY: 0 },
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </Component>
  );
}

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
  /** Starting value for the animation. If not set, defaults to ~80-90% of value (closer for larger numbers). */
  from?: number;
};

function getDefaultFrom(value: number): number {
  if (value <= 5) return 0;
  if (value <= 50) return Math.floor(value * 0.7);
  if (value <= 500) return Math.floor(value * 0.8);
  return Math.floor(value * 0.9);
}

export function AnimatedCounter({
  value,
  duration = 1,
  delay = 0,
  formatter = (n) => n.toLocaleString("fr-FR"),
  className,
  from,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const hasAnimated = useRef(false);

  const startValue = from ?? getDefaultFrom(value);
  const motionValue = useMotionValue(startValue);
  const display = useTransform(motionValue, (current) =>
    formatter(Math.round(current))
  );

  useEffect(() => {
    if (inView) {
      if (hasAnimated.current) {
        // Subsequent updates: animate from current value to new value
        animate(motionValue, value, {
          duration: 0.5,
          ease: "easeOut",
        });
      } else {
        // First animation: start from startValue with optional delay
        motionValue.set(startValue);
        const timeout = setTimeout(() => {
          animate(motionValue, value, {
            duration,
            ease: "easeOut",
          });
          hasAnimated.current = true;
        }, delay * 1000);
        return () => clearTimeout(timeout);
      }
    }
  }, [inView, motionValue, value, duration, startValue, delay]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
