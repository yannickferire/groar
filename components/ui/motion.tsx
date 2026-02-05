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
  as?: keyof JSX.IntrinsicElements;
};

export function StaggerContainer({
  children,
  staggerDelay = 0.12,
  delayChildren = 0,
  as,
  ...props
}: StaggerContainerProps) {
  const Component = as ? (motion as unknown as Record<string, typeof motion.div>)[as] : motion.div;

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
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
  formatter?: (value: number) => string;
  className?: string;
};

export function AnimatedCounter({
  value,
  duration = 1.5,
  formatter = (n) => n.toLocaleString("fr-FR"),
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (current) =>
    formatter(Math.round(current))
  );

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: "easeOut",
      });
      return () => controls.stop();
    }
  }, [inView, motionValue, value, duration]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
