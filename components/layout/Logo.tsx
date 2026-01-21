import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="block">
      <Image
        src="/groar-logo.png"
        alt="Groar"
        width={180}
        height={48}
        priority
        sizes="(max-width: 640px) 140px, 180px"
        className="h-auto w-35 sm:w-45"
      />
    </Link>
  );
}
