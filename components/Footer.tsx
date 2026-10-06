"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer() {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] === "id" ? "id" : "en";
  const base = `/${lang}`;

  return (
    <footer className="bg-emerald-950 text-emerald-100/70 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-900/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="mb-6">
              <Image
                src="/logo1.png"
                alt="Satubumi Logo"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
                style={{ height: "40px", width: "auto" }}
                unoptimized
              />
            </div>
            <p className="text-[15px] leading-relaxed max-w-md mb-8">
              Bridging science, nature, communities, and business to create measurable climate
              and sustainability impacts with cutting-edge technology.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-emerald-400 hover:text-white transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-emerald-400 hover:text-white transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-emerald-400 hover:text-white transition-colors">
                <TwitterIcon className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-emerald-400 hover:text-white transition-colors">
                <LinkedinIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase mb-6">
                Company
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href={base} className="text-[14.5px] hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/about`} className="text-[14.5px] hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/services`} className="text-[14.5px] hover:text-white transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/contact`} className="text-[14.5px] hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase mb-6">
                Solutions
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href={`${base}/products`} className="text-[14.5px] hover:text-white transition-colors">
                    Rapid-FS Tool
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/services`} className="text-[14.5px] hover:text-white transition-colors">
                    Consulting
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase mb-6">
                Resources
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href={`${base}/insights`} className="text-[14.5px] hover:text-white transition-colors">
                    Insights
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/contact`} className="text-[14.5px] hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <h4 className="text-white text-xl font-bold mb-4">Get in Touch</h4>
            <p className="text-[15px] leading-relaxed max-w-sm">
              Have questions or need assistance? <br />
              We are here to help!
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase mb-4">
                Address
              </h4>
              <div className="space-y-5 text-[14.5px] leading-relaxed">
                <div>
                  <span className="block text-white mb-1 font-medium">Headquarters</span>
                  Jakarta
                </div>
                <div>
                  <span className="block text-white mb-1 font-medium">Office</span>
                  Menteng, Bogor Barat, Kota Bogor
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div>
                <h4 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase mb-4">
                  Phone
                </h4>
                <p className="text-[14.5px]">+62 (21) 555-0198</p>
              </div>
              <div>
                <h4 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase mb-4">
                  Email
                </h4>
                <a
                  href="mailto:info@satubumi.org"
                  className="text-[14.5px] hover:text-white transition-colors"
                >
                  info@satubumi.org
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-emerald-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[13px] font-medium">
            © {new Date().getFullYear()} Satubumi. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium">
            <Link href={`${base}/contact`} className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}