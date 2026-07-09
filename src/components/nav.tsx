"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/intake", label: "Intake" },
  { href: "/profile", label: "Profile" },
  { href: "/checkin", label: "Check-in" },
  { href: "/community", label: "Community" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image src="/vera_logo@2x.png" alt="Vera" width={81} height={49} className="h-16 w-auto" priority />
        </Link>
        <nav className="flex gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
