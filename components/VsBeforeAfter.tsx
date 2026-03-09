import Image from "next/image";

export default function VsBeforeAfter({ competitor }: { competitor: string }) {
  return (
    <section className="mb-8 md:mb-10">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="rounded-xl border border-border bg-muted/30 aspect-video flex items-center justify-center p-3 md:p-5">
          <div className="text-center space-y-1.5">
            <p className="text-xl md:text-2xl">😐</p>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{competitor}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground/60">Manual work, generic output</p>
          </div>
        </div>
        <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 aspect-video flex items-center justify-center p-3 md:p-5">
          <div className="text-center space-y-1.5">
            <Image
              src="/groar-logo.png"
              alt="Groar"
              width={80}
              height={22}
              className="h-auto w-20 md:w-24 mx-auto"
            />
            <p className="text-xs md:text-sm font-medium text-emerald-600">Clean, branded visual</p>
            <p className="text-[10px] md:text-xs text-muted-foreground/60">Auto-filled, ready in 10 seconds</p>
          </div>
        </div>
      </div>
    </section>
  );
}
