"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Users,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ClipboardList,
  Home,
  Info,
  Briefcase,
  type LucideIcon,
  Newspaper,
  Tag,
  FileText,
  Activity,
  UserCheck,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");
          router.push(`/${lang}/login`);
          return;
        }
        const me = await res.json();
        if (me.role !== "admin" && me.role !== "super_admin") {
          router.push(`/${lang}`);
          return;
        }
        setUser(me);
      } catch {
        router.push(`/${lang}/login`);
      }
    };
    check();
  }, [lang, router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    window.location.href = `/${lang}/login`;
  };

  const switchLang = (next: "id" | "en") => {
    const parts = pathname.split("/");
    if (parts[1] === "id" || parts[1] === "en") parts[1] = next;
    else parts.splice(1, 0, next);
    router.push(parts.join("/") || `/${next}/admin`);
  };

  const userMenuItems: NavItem[] = [];

  if (user?.role === "super_admin") {
    userMenuItems.push({
      href: `/${lang}/admin/users`,
      label: isId ? "Manajemen Pengguna" : "User Management",
      icon: Users,
    });
    userMenuItems.push({
      href: `/${lang}/admin/activity-logs`,
      label: isId ? "Log Semua Aktivitas" : "All Activity Logs",
      icon: Activity,
    });
  }

  userMenuItems.push({
    href: `/${lang}/admin/my-activity`,
    label: isId ? "Aktivitas Saya" : "My Activity",
    icon: UserCheck,
  });

  const navGroups: NavGroup[] = [
    {
      title: isId ? "Utama" : "Main",
      items: [
        {
          href: `/${lang}/admin`,
          label: "Dashboard",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: isId ? "Konten Website" : "Website Content",
      items: [
        {
          href: `/${lang}/admin/home`,
          label: isId ? "Halaman Home" : "Home Page",
          icon: Home,
        },
        {
          href: `/${lang}/admin/about`,
          label: isId ? "Halaman About" : "About Page",
          icon: Info,
        },
        {
          href: `/${lang}/admin/services`,
          label: isId ? "Halaman Services" : "Services Page",
          icon: Briefcase,
        },
      ],
    },
    {
      title: isId ? "Konten Insights" : "Insights Content",
      items: [
        {
          href: `/${lang}/admin/insights`,
          label: isId ? "Artikel" : "Article",
          icon: Newspaper,
        },
        {
          href: `/${lang}/admin/insight-topics`,
          label: isId ? "Topik Artikel" : "Article Topic",
          icon: Tag,
        },
        {
          href: `/${lang}/admin/rulebooks`,
          label: "Rulebook",
          icon: FileText,
        },
      ],
    },
    {
      title: isId ? "Operasional" : "Operations",
      items: [
        {
          href: `/${lang}/admin/assessments`,
          label: isId ? "Semua Assessment" : "All Assessments",
          icon: ClipboardList,
        },
      ],
    },
    {
      title: isId ? "Pengguna" : "User",
      items: userMenuItems,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href || pathname === `${href}/`;
    if (href === `/${lang}/admin`) {
      return pathname === href || pathname === `/${lang}/admin/`;
    }
    return pathname.startsWith(href);
  };

  const getInitials = (name?: string) => {
    if (!name) return "A";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const profileSrc = resolveImageUrl(
    user?.profile_image || user?.avatar || user?.image_url || user?.photo_url,
  );

  const renderNav = (onNavigate?: () => void) =>
    navGroups.map((group, groupIdx) => (
      <div
        key={group.title}
        className="mb-7 animate-in slide-in-from-left-4 fade-in duration-500 fill-mode-both"
        style={{ animationDelay: `${groupIdx * 80}ms` }}
      >
        <p className="px-5 mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-700">
          {group.title}
        </p>
        <div className="space-y-1 px-3">
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold transition-all duration-300 active:scale-95 ${
                  active
                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                    : "text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 hover:translate-x-1"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    active
                      ? "text-emerald-600 scale-110"
                      : "text-slate-700 group-hover:scale-110 group-hover:text-emerald-600"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    ));

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-[280px] flex-col bg-white fixed inset-y-0 left-0 z-40 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-[76px] flex items-center pl-5 pr-8 border-b border-slate-200 shrink-0">
          <Link
            href={`/${lang}/admin`}
            className="flex items-center gap-1 group"
          >
            <Image
              src="/logo.png"
              alt="Satubumi Logo"
              width={140}
              height={36}
              className="h-7 w-auto object-contain transition-transform duration-500 ease-out group-hover:scale-105"
              unoptimized
            />
            <span className="text-emerald-600 font-extrabold text-[20px] tracking-wide -mt-1">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderNav()}
        </nav>

        <div className="shrink-0 border-t-2 border-slate-200 bg-slate-50/80">
          <div className="p-4 flex flex-col gap-1.5">
            <Link
              href={`/${lang}`}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
            >
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
              {isId ? "Lihat Website" : "View Website"}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold text-rose-700 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>

          <div className="px-4 pb-5 flex flex-col items-center justify-center gap-2 border-t border-slate-200/80 pt-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Powered By
            </p>
            <Image
              src="/logo2.png"
              alt="Satubumi Powered By"
              width={100}
              height={24}
              className="h-5 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity"
              unoptimized
            />
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[80%] bg-white flex flex-col z-50 shadow-2xl border-r border-slate-200">
            <div className="h-[76px] flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
              <Link
                href={`/${lang}/admin`}
                className="flex items-center gap-1.5"
                onClick={() => setSidebarOpen(false)}
              >
                <Image
                  src="/logo.png"
                  alt="Satubumi Logo"
                  width={120}
                  height={32}
                  className="h-6 w-auto object-contain"
                  unoptimized
                />
                <span className="text-emerald-600 font-extrabold text-[20px]">
                  Admin
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {renderNav(() => setSidebarOpen(false))}
            </nav>

            <div className="shrink-0 border-t-2 border-slate-200 bg-slate-50/80 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <header className="h-[76px] bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between gap-3 px-6 md:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-800 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2.5 text-[13px] font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80">
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              <span>{isId ? "Panel Admin" : "Admin Workspace"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Lang switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => switchLang("id")}
                className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg ${
                  lang === "id"
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => switchLang("en")}
                className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg ${
                  lang === "en"
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                EN
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 min-w-0 max-w-[70%] sm:max-w-[280px] p-1.5 pr-3 rounded-2xl">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-sm shrink-0">
                  {profileSrc ? (
                    <img
                      src={profileSrc}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[14px] font-extrabold text-slate-800 leading-none truncate">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {String(user.role || "").replace("_", " ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 w-full max-w-[1400px] mx-auto p-6 md:p-10 min-w-0">
          <div
            key={pathname}
            className="animate-in fade-in duration-300 h-full min-w-0"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}