import Logo from "./Logo";

export default function Header() {
  return (
    <header className="w-full max-w-4xl mx-auto mt-4 flex items-center justify-between py-4">
      <Logo />
    </header>
  );
}
