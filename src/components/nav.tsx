"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/profile", label: "Dashboard" },
  { href: "/checkin", label: "Diary" },
  { href: "/community", label: "Resources" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image src="/vera-logo-new.png" alt="Vera" width={1200} height={480} className="h-11 w-auto rounded-lg" priority />
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
