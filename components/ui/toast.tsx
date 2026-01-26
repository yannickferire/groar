"use client";

import { Toaster as SonnerToaster, toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon, Alert01Icon } from "@hugeicons/core-free-icons";

function SuccessIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
      <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={2.5} className="text-primary" />
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
      <HugeiconsIcon icon={Alert01Icon} size={14} strokeWidth={2.5} className="text-destructive" />
    </div>
  );
}

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
      }}
      toastOptions={{
        style: {
          "--normal-bg": "rgba(255, 255, 255, 0.4)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "rgba(255, 255, 255, 0.3)",
          "--success-bg": "rgba(255, 255, 255, 0.4)",
          "--success-text": "var(--foreground)",
          "--success-border": "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        } as React.CSSProperties,
        className: "font-sans text-base font-medium !w-auto",
      }}
    />
  );
}

export function useToast() {
  return {
    showToast: (message: string, type: "success" | "error" = "success") => {
      if (type === "error") {
        toast.error(message, {
          style: {
            "--normal-bg": "var(--destructive)",
            "--normal-text": "#ffffff",
            "--normal-border": "var(--destructive)",
          } as React.CSSProperties,
        });
      } else {
        toast.success(message);
      }
    },
  };
}
