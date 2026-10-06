"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  PlusCircle,
  Home as HomeIcon,
  ShieldCheck,
  Unlock,
  Layers,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const cardMotion = `rounded-3xl p-5 sm:p-6 lg:p-5 xl:p-6 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] transition-all duration-300 ${ease} hover:-translate-y-1 hover:shadow-md group active:scale-[0.98]`;

const quickClass = `flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-white hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${ease} group active:scale-[0.98]`;

const quickIconClass = `w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 group-hover:border-emerald-200 group-hover:scale-105 shadow-xs shrink-0 transition-all duration-300 ${ease}`;

export default function AdminDashboardOverview() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    users: 0,
    assessments: 0,
    insights: 0,
    pendingRapidRequests: 0,
    grantedRapidRequests: 0,
  });

  const token = () =>
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  useEffect(() => {
    const initData = async () => {
      const t = token();
      if (!t) {
        router.push(`/${lang}/login`);
        return;
      }

      try {
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!meRes.ok) {
          router.push(`/${lang}/login`);
          return;
        }
        const me = await meRes.json();
        if (me.role !== "admin" && me.role !== "super_admin") {
          router.push(`/${lang}`);
          return;
        }
        setUser(me);

        let usersCount = 0;
        let assessmentsCount = 0;
        let insightsCount = 0;
        let pendingRapidCount = 0;
        let grantedRapidCount = 0;

        try {
          // 1. Fetch Users & Rapid Requests (Accessible by both admin and super_admin)
          let usersRes = await fetch(`${API_URL}/users/`, {
            headers: { Authorization: `Bearer ${t}` },
          });
          if (!usersRes.ok && usersRes.status === 404) {
            usersRes = await fetch(`${API_URL}/users`, {
              headers: { Authorization: `Bearer ${t}` },
            });
          }
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            const list = Array.isArray(usersData)
              ? usersData
              : usersData.users || usersData.items || usersData.data || [];
            usersCount = list.length;
            pendingRapidCount = list.filter(
              (u: any) => u.rapidfs_request_status === "pending" && !u.has_rapidfs_access
            ).length;
            grantedRapidCount = list.filter((u: any) => !!u.has_rapidfs_access).length;
          }

          // 2. Fetch Assessments (endpoint is /api/v1/assessments without trailing slash)
          let assessRes = await fetch(`${API_URL}/assessments`, {
            headers: { Authorization: `Bearer ${t}` },
          });
          if (!assessRes.ok && assessRes.status === 404) {
            assessRes = await fetch(`${API_URL}/assessments/`, {
              headers: { Authorization: `Bearer ${t}` },
            });
          }
          if (assessRes.ok) {
            const assessData = await assessRes.json();
            const assessList = Array.isArray(assessData)
              ? assessData
              : assessData.items || assessData.data || assessData.results || [];
            assessmentsCount = assessList.length;
          }

          // 3. Fetch Insights count
          const articlesRes = await fetch(
            `${API_URL}/articles/?category=insight&lang=${isId ? "id" : "en"}`
          );
          if (articlesRes.ok) {
            const articlesData = await articlesRes.json();
            const artList = Array.isArray(articlesData)
              ? articlesData
              : articlesData.items || articlesData.data || [];
            insightsCount = artList.length;
          }
        } catch (e) {
          console.error("Gagal memuat statistik", e);
        }

        setStats({
          users: usersCount,
          assessments: assessmentsCount,
          insights: insightsCount,
          pendingRapidRequests: pendingRapidCount,
          grantedRapidRequests: grantedRapidCount,
        });
      } catch {
        router.push(`/${lang}/login`);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [lang, router, isId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (isId) {
      if (hour < 11) return "Selamat Pagi";
      if (hour < 15) return "Selamat Siang";
      if (hour < 18) return "Selamat Sore";
      return "Selamat Malam";
    }
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 relative flex items-center justify-center mb-4">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
        </div>
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          {isId ? "Memuat Dashboard..." : "Loading Workspace..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        {/* HERO */}
        <div
          className={`col-span-12 lg:col-span-7 xl:col-span-8 bg-gradient-to-br from-[#042F24] via-[#064233] to-[#03261D] text-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-9 xl:p-10 relative overflow-hidden flex flex-col justify-between shadow-xs transition-all duration-300 ${ease} hover:-translate-y-0.5 hover:shadow-md group`}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[90px] pointer-events-none group-hover:scale-125 group-hover:bg-emerald-400/20 transition-all duration-700 ease-out" />
          <div className="relative z-10 flex items-center justify-between gap-3 mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 font-bold text-[11px] uppercase tracking-widest backdrop-blur-md shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Satubumi Workspace</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-emerald-200/70 text-[12px] font-bold shrink-0">
              <Clock className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString(isId ? "id-ID" : "en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>
          <div className="relative z-10 space-y-2.5 sm:space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight">
              {getGreeting()},{" "}
              <span className="text-emerald-300">{user?.full_name?.split(" ")[0]}</span>!
            </h1>
            <p className="text-emerald-100/70 font-medium text-[13px] sm:text-[15px] max-w-xl leading-relaxed">
              {isId
                ? "Sistem operasional dan analitik platform berjalan normal. Kendalikan konten dan data ekosistem dengan mudah dari sini."
                : "Platform operational and analytics systems are running smoothly. Manage website contents and ecosystem metrics seamlessly."}
            </p>
          </div>
        </div>

        {/* ROLE — emerald soft */}
        <div
          className={`col-span-12 lg:col-span-5 xl:col-span-4 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 lg:p-6 xl:p-8 flex flex-col justify-between transition-all duration-300 ${ease} hover:-translate-y-0.5 hover:shadow-md group active:scale-[0.98] bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50/80 hover:border-emerald-200`}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs transition-all duration-300 ${ease} group-hover:scale-105 shrink-0`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-lg bg-white/90 text-emerald-700 border border-emerald-100 shrink-0">
              Verified
            </span>
          </div>
          <div className="my-5 sm:my-6">
            <p className="text-[11px] sm:text-[12px] font-bold text-emerald-800/50 uppercase tracking-widest mb-1">
              {isId ? "Hak Akses Login" : "Access Permission"}
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-950 uppercase tracking-wide truncate">
              {user?.role?.replace("_", " ")}
            </h3>
            <p className="text-[12px] sm:text-[13px] text-emerald-900/50 font-medium truncate mt-1">
              {user?.email}
            </p>
          </div>
          <div className="pt-3.5 sm:pt-4 border-t border-emerald-100/80 flex items-center justify-between text-[11px] sm:text-[12px] font-bold text-emerald-800/40">
            <span>Status Sistem</span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Online
            </span>
          </div>
        </div>

        {/* ASSESSMENTS — emerald */}
        <Link
          href={`/${lang}/admin/assessments`}
          className={`col-span-12 sm:col-span-6 xl:col-span-3 ${cardMotion} bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200`}
        >
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div
              className={`w-12 h-12 rounded-2xl bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs transition-all duration-300 ${ease} group-hover:scale-105 shrink-0`}
            >
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white/90 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
              <TrendingUp className="w-3 h-3" /> Live Data
            </span>
          </div>
          <div className="my-auto py-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight mb-1">
              {stats.assessments}
            </h3>
            <p className="text-[11px] sm:text-[12px] font-extrabold text-emerald-800/50 uppercase tracking-wider truncate">
              {isId ? "Kalkulasi Rapid-FS" : "Rapid-FS Calculations"}
            </p>
          </div>
          <div className="mt-4 sm:mt-5 pt-3.5 border-t border-emerald-100/80 flex items-center justify-end">
            <div className="text-[12px] sm:text-[13px] font-bold text-emerald-800/60 group-hover:text-emerald-700 flex items-center gap-1.5 transition-colors duration-300">
              <span>{isId ? "Kelola Assessment" : "Manage Assessments"}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>

        {/* RAPID-FS ACCESS REQUESTS — amber/emerald */}
        <Link
          href={`/${lang}/admin/rapid-requests`}
          className={`col-span-12 sm:col-span-6 xl:col-span-3 ${cardMotion} ${
            stats.pendingRapidRequests > 0
              ? "bg-amber-50/70 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
              : "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div
              className={`w-12 h-12 rounded-2xl bg-white border ${
                stats.pendingRapidRequests > 0
                  ? "border-amber-200 text-amber-600"
                  : "border-emerald-100 text-emerald-600"
              } flex items-center justify-center shadow-xs transition-all duration-300 ${ease} group-hover:scale-105 shrink-0`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            {stats.pendingRapidRequests > 0 ? (
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                {isId ? `${stats.pendingRapidRequests} Menunggu` : `${stats.pendingRapidRequests} Pending`}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white/90 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                <Unlock className="w-3 h-3 text-emerald-600" /> {stats.grantedRapidRequests} Aktif
              </span>
            )}
          </div>
          <div className="my-auto py-1">
            <h3
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 ${
                stats.pendingRapidRequests > 0 ? "text-amber-950" : "text-emerald-950"
              }`}
            >
              {stats.pendingRapidRequests > 0
                ? stats.pendingRapidRequests
                : stats.grantedRapidRequests}
            </h3>
            <p
              className={`text-[11px] sm:text-[12px] font-extrabold uppercase tracking-wider truncate ${
                stats.pendingRapidRequests > 0 ? "text-amber-800/70" : "text-emerald-800/50"
              }`}
            >
              {isId
                ? stats.pendingRapidRequests > 0
                  ? "Permintaan Akses"
                  : "Pengguna Akses Penuh"
                : stats.pendingRapidRequests > 0
                ? "Access Requests"
                : "Full Access Users"}
            </p>
          </div>
          <div
            className={`mt-4 sm:mt-5 pt-3.5 border-t flex items-center justify-end ${
              stats.pendingRapidRequests > 0
                ? "border-amber-200/80"
                : "border-emerald-100/80"
            }`}
          >
            <div
              className={`text-[12px] sm:text-[13px] font-bold flex items-center gap-1.5 transition-colors duration-300 ${
                stats.pendingRapidRequests > 0
                  ? "text-amber-800/80 group-hover:text-amber-900"
                  : "text-emerald-800/60 group-hover:text-emerald-700"
              }`}
            >
              <span>{isId ? "Tinjau Permintaan" : "Review Requests"}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>

        {/* ARTICLES / INSIGHTS — sky */}
        <Link
          href={`/${lang}/admin/insights`}
          className={`col-span-12 sm:col-span-6 xl:col-span-3 ${cardMotion} bg-sky-50/70 border border-sky-100 hover:bg-sky-50 hover:border-sky-200`}
        >
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div
              className={`w-12 h-12 rounded-2xl bg-white border border-sky-100 text-sky-600 flex items-center justify-center shadow-xs transition-all duration-300 ${ease} group-hover:scale-105 shrink-0`}
            >
              <FileText className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-white/90 border border-sky-100 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
              CMS Portal
            </span>
          </div>
          <div className="my-auto py-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-sky-950 tracking-tight mb-1">
              {stats.insights > 0 ? stats.insights : "CMS"}
            </h3>
            <p className="text-[11px] sm:text-[12px] font-extrabold text-sky-800/50 uppercase tracking-wider truncate">
              {isId ? "Artikel & Insight" : "Articles & Insights"}
            </p>
          </div>
          <div className="mt-4 sm:mt-5 pt-3.5 border-t border-sky-100/80 flex items-center justify-end">
            <div className="text-[12px] sm:text-[13px] font-bold text-sky-800/60 group-hover:text-sky-700 flex items-center gap-1.5 transition-colors duration-300">
              <span>{isId ? "Buka Insights" : "Open Insights"}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>

        {/* USERS — indigo / HOME — amber */}
        {user?.role === "super_admin" ? (
          <Link
            href={`/${lang}/admin/users`}
            className={`col-span-12 sm:col-span-6 xl:col-span-3 ${cardMotion} bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200`}
          >
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
              <div
                className={`w-12 h-12 rounded-2xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs transition-all duration-300 ${ease} group-hover:scale-105 shrink-0`}
              >
                <Users className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white/90 border border-indigo-100 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                Super Admin
              </span>
            </div>
            <div className="my-auto py-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight mb-1">
                {stats.users}
              </h3>
              <p className="text-[11px] sm:text-[12px] font-extrabold text-indigo-800/50 uppercase tracking-wider truncate">
                {isId ? "Pengguna Terdaftar" : "Registered Users"}
              </p>
            </div>
            <div className="mt-4 sm:mt-5 pt-3.5 border-t border-indigo-100/80 flex items-center justify-end">
              <div className="text-[12px] sm:text-[13px] font-bold text-indigo-800/60 group-hover:text-indigo-700 flex items-center gap-1.5 transition-colors duration-300">
                <span>{isId ? "Kelola Pengguna" : "Manage Users"}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ) : (
          <Link
            href={`/${lang}/admin/home`}
            className={`col-span-12 sm:col-span-6 xl:col-span-3 ${cardMotion} bg-amber-50/70 border border-amber-100 hover:bg-amber-50 hover:border-amber-200`}
          >
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
              <div
                className={`w-12 h-12 rounded-2xl bg-white border border-amber-100 text-amber-600 flex items-center justify-center shadow-xs transition-all duration-300 ${ease} group-hover:scale-105 shrink-0`}
              >
                <HomeIcon className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-white/90 border border-amber-100 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                Website CMS
              </span>
            </div>
            <div className="my-auto py-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-amber-950 tracking-tight mb-1">
                3
              </h3>
              <p className="text-[11px] sm:text-[12px] font-extrabold text-amber-800/50 uppercase tracking-wider truncate">
                {isId ? "Halaman Website" : "Website Pages"}
              </p>
            </div>
            <div className="mt-4 sm:mt-5 pt-3.5 border-t border-amber-100/80 flex items-center justify-end">
              <div className="text-[12px] sm:text-[13px] font-bold text-amber-800/60 group-hover:text-amber-700 flex items-center gap-1.5 transition-colors duration-300">
                <span>{isId ? "Sunting Beranda" : "Edit Home Page"}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        )}

        {/* QUICK ACTIONS — netral */}
        <div className="col-span-12 bg-white border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800">
              {isId ? "Akses Cepat Pintasan" : "Quick Actions Shortcut"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Quick Action: Tulis Artikel Baru -> admin/insights */}
            <Link href={`/${lang}/admin/insights`} className={quickClass}>
              <div className={quickIconClass}>
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[13.5px] sm:text-[14px] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300 ${ease} truncate`}
                >
                  {isId ? "Tulis Artikel Baru" : "Write New Article"}
                </p>
                <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-medium truncate">
                  {isId ? "Publikasikan insight terbaru" : "Publish new updates"}
                </p>
              </div>
            </Link>

            {/* Quick Action: Permintaan Akses Rapid-FS */}
            <Link href={`/${lang}/admin/rapid-requests`} className={quickClass}>
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border flex items-center justify-center shadow-xs transition-all duration-300 ${ease} shrink-0 ${
                  stats.pendingRapidRequests > 0
                    ? "border-amber-200 text-amber-600 group-hover:scale-105"
                    : "border-slate-200 text-slate-500 group-hover:text-emerald-600 group-hover:border-emerald-200 group-hover:scale-105"
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-[13.5px] sm:text-[14px] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300 ${ease} truncate`}
                  >
                    {isId ? "Akses Rapid-FS" : "Rapid-FS Access"}
                  </p>
                  {stats.pendingRapidRequests > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shrink-0">
                      {stats.pendingRapidRequests}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-medium truncate">
                  {isId
                    ? stats.pendingRapidRequests > 0
                      ? `${stats.pendingRapidRequests} perlu persetujuan`
                      : "Kelola izin laporan penuh"
                    : stats.pendingRapidRequests > 0
                    ? `${stats.pendingRapidRequests} awaiting review`
                    : "Manage report access"}
                </p>
              </div>
            </Link>

            {/* Quick Action: Tinjau Assessment */}
            <Link href={`/${lang}/admin/assessments`} className={quickClass}>
              <div className={quickIconClass}>
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[13.5px] sm:text-[14px] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300 ${ease} truncate`}
                >
                  {isId ? "Tinjau Assessment" : "Review Assessments"}
                </p>
                <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-medium truncate">
                  {isId ? "Lihat riwayat kalkulasi" : "View calculation history"}
                </p>
              </div>
            </Link>

            {/* Quick Action: Kelola Pengguna (Super Admin) or Beranda CMS (Admin) */}
            {user?.role === "super_admin" ? (
              <Link href={`/${lang}/admin/users`} className={quickClass}>
                <div className={quickIconClass}>
                  <Users className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[13.5px] sm:text-[14px] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300 ${ease} truncate`}
                  >
                    {isId ? "Kelola Pengguna" : "Manage Users"}
                  </p>
                  <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-medium truncate">
                    {isId ? "Tambah atau hapus akun" : "Add or remove access"}
                  </p>
                </div>
              </Link>
            ) : (
              <Link href={`/${lang}/admin/home`} className={quickClass}>
                <div className={quickIconClass}>
                  <HomeIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[13.5px] sm:text-[14px] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300 ${ease} truncate`}
                  >
                    {isId ? "Sunting Beranda" : "Edit Home Page"}
                  </p>
                  <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-medium truncate">
                    {isId ? "Kelola hero & highlight" : "Manage home content"}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}