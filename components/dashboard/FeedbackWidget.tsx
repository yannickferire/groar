"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { MessageEdit01Icon, Bug02Icon, Idea01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

type FeedbackType = "bug" | "feature" | "general";

const TYPES: { value: FeedbackType; label: string; icon: typeof Bug02Icon }[] = [
  { value: "bug", label: "Bug", icon: Bug02Icon },
  { value: "feature", label: "Feature", icon: Idea01Icon },
  { value: "general", label: "Other", icon: MessageEdit01Icon },
];

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, page: pathname }),
      });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setMessage("");
        setType("general");
      }, 1500);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background text-sm font-medium shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
      >
        <HugeiconsIcon icon={MessageEdit01Icon} size={16} strokeWidth={2} />
        Feedback
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { if (!sending) { setOpen(false); setSent(false); setMessage(""); setType("general"); } }}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mb-3">
                  <HugeiconsIcon icon={Tick01Icon} size={24} strokeWidth={2} />
                </div>
                <p className="font-heading font-bold text-lg">Thanks for your feedback!</p>
                <p className="text-sm text-muted-foreground mt-1">We&apos;ll look into it.</p>
              </div>
            ) : (
              <div className="p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Send feedback</h2>

                {/* Type selector */}
                <div className="flex gap-2 mb-4">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        type === t.value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <HugeiconsIcon icon={t.icon} size={14} strokeWidth={2} />
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === "bug"
                      ? "What went wrong? Steps to reproduce..."
                      : type === "feature"
                        ? "What would you like to see?"
                        : "Tell us what's on your mind..."
                  }
                  rows={4}
                  maxLength={5000}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60"
                  autoFocus
                />

                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    {message.length > 0 && `${message.length}/5000`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setOpen(false); setMessage(""); setType("general"); }}
                      disabled={sending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!message.trim() || sending}
                    >
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
