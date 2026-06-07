"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide navbar on auth pages
  if (pathname?.startsWith("/auth/")) {
    return null;
  }

  const isAdmin = session?.user && (session.user as any).role === "admin";

  const navLinks = isAdmin ? [
    { href: "/dashboard", label: "My Dashboard" },
  ] : [];

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <div className="navbar-logo" style={{ display: "flex", alignItems: "center" }}>
            <span className="gradient-text" style={{ fontSize: "30px", fontWeight: 800, fontFamily: "Outfit, sans-serif" }}>
              FluentVerify
            </span>
          </div>

          {/* Nav Links */}
          <ul className="navbar-nav">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={pathname === link.href ? "active" : ""}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {session?.user && (session.user as any).role === "admin" && (
              <>
                <li>
                  <Link
                    href="/admin"
                    className={pathname === "/admin" ? "active" : ""}
                  >
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/questions"
                    className={pathname === "/admin/questions" ? "active" : ""}
                  >
                    Question Sets
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Actions */}
          <div className="navbar-actions">
            {session ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {isAdmin && (
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    {session.user?.name || session.user?.email}
                  </span>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn btn-ghost btn-sm"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
