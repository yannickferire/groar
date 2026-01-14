import Logo from "./Logo";

export default function Header() {
  return (
    <header className="mt-2 flex items-center justify-between px-6 py-4 border-b-2 border-foreground rounded-full">
      <Logo />
    </header>
  );
}
