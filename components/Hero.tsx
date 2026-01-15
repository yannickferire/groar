import XLogo from "@/components/icons/XLogo";

export default function Hero() {
  return (
    <section className="max-w-3xl text-balance text-center flex flex-col gap-4 mx-auto">
      <h2 className="text-6xl font-semibold tracking-tight">Make your social metrics Roaaar</h2>
      <p className="text-lg max-w-2xl mx-auto">
        <span className="opacity-60">Turn cold data analytics<br />into high-signal visuals for</span> <XLogo />
      </p>
    </section>
  );
}
