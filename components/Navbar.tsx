"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/insights", label: "Insights" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [showNavbar, setShowNavbar] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const currentLang = pathname.split("/")[1] === "id" ? "id" : "en";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      const current = window.scrollY;

      if (current > lastScrollY.current && current > 80) {
        setShowNavbar(false);
        setUserMenuOpen(false);
        setOpen(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("access_token");
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSwitch = (newLang: string) => {
    if (currentLang === newLang) return;
    const segments = pathname.split("/");
    segments[1] = newLang;
    window.location.href = segments.join("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = `/${currentLang}`;
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === `/${currentLang}` || pathname === `/${currentLang}/`;
    }
    return pathname.startsWith(`/${currentLang}${href}`);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const navVisibilityClass = !isMounted
    ? "-translate-y-12 opacity-0"
    : showNavbar
    ? "translate-y-0 opacity-100"
    : "-translate-y-32 opacity-0";

  return (
    <div
      className={`fixed top-4 inset-x-0 z-50 flex justify-center items-start pointer-events-none gap-3 lg:gap-4 px-4 w-full transition-all duration-500 ease-out ${navVisibilityClass}`}
    >
      <header className="bg-white/95 backdrop-blur-md border border-emerald-100/80 rounded-full w-full lg:w-auto h-[60px] flex items-center justify-between px-6 lg:px-8 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.15)] pointer-events-auto transition-all duration-300">
        <Link href={`/${currentLang}`} className="flex items-center group lg:mr-4">
          <Image
            src="/logo.png"
            alt="Satubumi Logo"
            width={1403}
            height={252}
            className="h-6 md:h-7 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            priority
            unoptimized
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-4">
          {navLinks.map((link) => (
            <div key={link.href} className="relative group flex items-center">
              <Link
                href={`/${currentLang}${link.href}`}
                className="px-2 py-1.5 text-[14px] font-bold text-emerald-900 group flex items-center"
              >
                <span className="relative inline-flex flex-col items-center">
                  <span>{link.label}</span>
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] bg-emerald-600 rounded-full transition-all duration-300 ${
                      isActive(link.href)
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`}
                  />
                </span>
              </Link>
            </div>
          ))}

          <div className="w-[1px] h-5 bg-emerald-100 mx-1" />

          <div className="flex items-center bg-white p-1 rounded-full border border-emerald-100/80 shadow-sm">
            <button
              type="button"
              onClick={() => handleLanguageSwitch("en")}
              className={`px-3 py-1 text-[10px] font-extrabold rounded-full transition-all ${
                currentLang === "en"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSwitch("id")}
              className={`px-3 py-1 text-[10px] font-extrabold rounded-full transition-all ${
                currentLang === "id"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              ID
            </button>
          </div>
        </nav>

        <button
          type="button"
          className="lg:hidden p-1.5 text-emerald-900 transition-colors hover:bg-emerald-50 rounded-full"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <div className="hidden lg:flex bg-white/95 backdrop-blur-md border border-emerald-100/80 rounded-full h-[60px] items-center px-1.5 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.15)] pointer-events-auto relative">
        {isLoggedIn === null ? (
          <div className="w-28 h-8 bg-emerald-50 animate-pulse rounded-full m-2" />
        ) : isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full border border-transparent hover:bg-emerald-50/50 transition-all duration-300 group"
            >
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-wider mb-0.5 leading-none">
                  Workspace
                </span>
                <span className="text-[13px] font-bold text-emerald-900 leading-none">
                  Hi, {user?.full_name?.split(" ")[0] || "User"}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                {getInitials(user?.full_name)}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute top-[120%] right-0 w-64 bg-white border border-emerald-100/80 rounded-[1.5rem] p-3 shadow-[0_30px_60px_-15px_rgba(4,43,34,0.15)] animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="px-3 py-3 border-b border-emerald-50 mb-2">
                  <p className="text-[11px] font-bold text-emerald-800/60 uppercase tracking-widest mb-1">
                    Signed in as
                  </p>
                  <p className="text-sm font-bold text-emerald-900 truncate">
                    {user?.email || "user@satubumi.org"}
                  </p>
                </div>

                <Link
                  href={`/${currentLang}/dashboard`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {currentLang === "id" ? "Daftar Assessment" : "My Assessments"}
                </Link>

                {isAdmin && (
                  <Link
                    href={`/${currentLang}/admin`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href={`/${currentLang}/login`}
            className="px-6 py-2 m-1.5 text-[13px] font-extrabold bg-emerald-700 text-white rounded-full hover:bg-emerald-600 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-emerald-600/20"
          >
            Sign In
          </Link>
        )}
      </div>

      {open && showNavbar && (
        <div className="absolute top-[72px] inset-x-4 bg-white/95 backdrop-blur-xl border border-emerald-100/80 rounded-3xl p-5 flex flex-col gap-3 shadow-[0_30px_60px_-15px_rgba(4,43,34,0.15)] pointer-events-auto lg:hidden animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${currentLang}${link.href}`}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-emerald-900 transition-all ${
                  isActive(link.href)
                    ? "bg-emerald-50 border border-emerald-100"
                    : "hover:bg-emerald-50 border border-transparent"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(5,150,105,0.5)]" />
                )}
              </Link>
            ))}
          </div>

          <div className="h-px w-full bg-emerald-50 my-2" />

          <div className="flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-4 px-4 py-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-extrabold text-lg shadow-sm">
                    {getInitials(user?.full_name)}
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-800/60 font-bold uppercase tracking-wider mb-0.5">
                      Signed In
                    </p>
                    <p className="text-[15px] font-bold text-emerald-900">{user?.full_name}</p>
                  </div>
                </div>
                <Link
                  href={`/${currentLang}/dashboard`}
                  onClick={() => setOpen(false)}
                  className="text-center text-white font-extrabold px-4 py-4 bg-emerald-600 rounded-2xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                >
                  {currentLang === "id" ? "Daftar Assessment" : "My Assessments"}
                </Link>
                {isAdmin && (
                  <Link
                    href={`/${currentLang}/admin`}
                    onClick={() => setOpen(false)}
                    className="text-center text-emerald-900 font-extrabold px-4 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-colors shadow-sm"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-center text-rose-600 font-extrabold px-4 py-4 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors shadow-sm"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href={`/${currentLang}/login`}
                className="text-center text-white font-extrabold px-4 py-4 bg-emerald-700 rounded-2xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-600/20"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}