"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

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

type StaggerContainerProps<T extends keyof JSX.IntrinsicElements = "div"> = HTMLMotionProps<T> & {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  as?: T;
};

export function StaggerContainer<T extends keyof JSX.IntrinsicElements = "div">({
  children,
  staggerDelay = 0.12,
  delayChildren = 0,
  as,
  ...props
}: StaggerContainerProps<T>) {
  const Component = as ? (motion as Record<string, typeof motion.div>)[as] : motion.div;

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

type StaggerItemProps<T extends keyof JSX.IntrinsicElements = "div"> = HTMLMotionProps<T> & {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  as?: T;
};

export function StaggerItem<T extends keyof JSX.IntrinsicElements = "div">({
  children,
  direction = "up",
  distance = 24,
  as,
  ...props
}: StaggerItemProps<T>) {
  const directions = {
    up: { translateY: distance },
    down: { translateY: -distance },
    left: { translateX: distance },
    right: { translateX: -distance },
    none: {},
  };

  const Component = as ? (motion as Record<string, typeof motion.div>)[as] : motion.div;

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
