"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, AlertCircle, Home, ShieldCheck, Eye, EyeOff } from "lucide-react";
import en from "../../../../dictionaries/en.json";
import id from "../../../../dictionaries/id.json";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function safeNext(raw: string | null) {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  return raw;
}

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (params?.lang as string) || "en";
  const dict = lang === "id" ? id : en;
  const t = dict.auth;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let message =
          lang === "id" ? "Email atau password salah" : "Invalid email or password";
        if (typeof data.detail === "string") message = data.detail;
        else if (Array.isArray(data.detail)) {
          message = data.detail.map((err: any) => err.msg).join(", ");
        }
        throw new Error(message);
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);

      const next = safeNext(searchParams.get("next"));

      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      if (meRes.ok) {
        const me = await meRes.json();
        if (next) {
          router.push(next);
        } else if (me.role === "admin" || me.role === "super_admin") {
          router.push(`/${lang}/admin`);
        } else if (me.role === "field_officer") {
          router.push(`/${lang}/monitor`);
        } else {
          router.push(`/${lang}/products`);
        }
      } else {
        router.push(next || `/${lang}/products`);
      }
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen flex bg-white font-sans selection:bg-emerald-200 selection:text-emerald-950 overflow-hidden">
      <div className="hidden lg:flex lg:w-[45%] relative bg-emerald-950 overflow-hidden items-end p-10">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2000&auto=format&fit=crop"
          alt="Satubumi Nature"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent"></div>
        <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>

        <div className="relative z-10 w-full max-w-lg mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold text-white uppercase tracking-widest">
              Secure Portal
            </span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Bridging science, nature, and business.
          </h2>
          <p className="text-base text-emerald-100/80 font-medium leading-relaxed max-w-md">
            Akses ke dalam platform Rapid-FS untuk menganalisis dan mengukur potensi
            proyek keberlanjutan Anda.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[55%] h-screen flex flex-col justify-center relative bg-white px-6 sm:px-12 lg:px-20">
        <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>

        <Link
          href={`/${lang}`}
          className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center gap-2.5 text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors z-20 group"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors shadow-sm text-emerald-600">
            <Home className="w-4 h-4" />
          </div>
          <span className="hidden sm:block">Back to Home</span>
        </Link>

        <Link
          href={`/${lang}`}
          className="absolute top-6 right-6 lg:top-8 lg:right-8 hover:scale-105 transition-transform duration-300 z-20"
        >
          <Image
            src="/logo.png"
            alt="Satubumi Logo"
            width={1403}
            height={252}
            className="h-8 w-auto object-contain"
            priority
            unoptimized
          />
        </Link>

        <div className="w-full max-w-[400px] mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
          <div className="mb-8 text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950 mb-2 tracking-tight flex items-center justify-start gap-3 group">
              {t.login_title}
              <div className="w-8 h-8 bg-emerald-50 rounded-[0.6rem] flex items-center justify-center border border-emerald-100 shadow-sm text-emerald-600 transition-transform duration-500 group-hover:rotate-12 group-hover:bg-emerald-100">
                <Lock className="w-4 h-4" strokeWidth={2.5} />
              </div>
            </h1>
            <p className="text-emerald-900/60 font-medium text-[14px]">
              {t.login_subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                {t.email}
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-emerald-950 placeholder:text-emerald-900/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-widest flex justify-between">
                <span>{t.password}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-emerald-950 placeholder:text-emerald-900/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-900/40 hover:text-emerald-600 transition-colors focus:outline-none p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[13px] font-medium flex items-start gap-2 animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" strokeWidth={2.5} />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white text-[15px] font-bold rounded-xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-200 border-t-white rounded-full animate-spin"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    {t.login_btn}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-left">
            <p className="text-[14px] text-emerald-900/60 font-medium">
              {t.no_account}{" "}
              <Link
                href={`/${lang}/register`}
                className="text-emerald-700 font-extrabold hover:text-emerald-600 transition-colors"
              >
                {t.register_btn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}