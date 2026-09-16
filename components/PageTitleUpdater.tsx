"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ROUTE_TITLES: Record<string, string> = {
  "": "Home",
  about: "About",
  services: "Services",
  insights: "Insights",
  products: "Products",
  "products/rapid-fs": "RapidFS",
  contact: "Contact",
  login: "Sign In",
  register: "Sign Up",
  dashboard: "Dashboard",
  admin: "Admin Dashboard",
  "admin/home": "Admin Home",
  "admin/about": "Admin About",
  "admin/services": "Admin Services",
  "admin/insights": "Admin Insights",
  "admin/insights/new": "New Insight",
  "admin/insight-topics": "Insight Topics",
  "admin/articles": "Admin Articles",
  "admin/articles/new": "New Article",
  "admin/assessments": "Assessments",
  "admin/rulebooks": "Rulebooks",
  "admin/users": "Admin Users",
  "admin/activity-logs": "Activity Logs",
  "admin/my-activity": "My Activity",
};

export default function PageTitleUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Bersihkan segment bahasa (/id atau /en) dari URL
    const segments = pathname.split("/").filter(Boolean);
    const hasLang = segments[0] === "id" || segments[0] === "en";
    const routeSegments = hasLang ? segments.slice(1) : segments;
    const routeKey = routeSegments.join("/");

    let pageName = ROUTE_TITLES[routeKey];

    if (!pageName) {
      if (routeKey.startsWith("insights/")) {
        pageName = "Insight";
      } else if (routeKey.startsWith("dashboard/")) {
        pageName = "Assessment";
      } else if (routeKey.startsWith("admin/")) {
        const last = routeSegments[routeSegments.length - 1];
        pageName = "Admin " + last.charAt(0).toUpperCase() + last.slice(1);
      } else if (routeSegments.length > 0) {
        const first = routeSegments[0];
        pageName = first.charAt(0).toUpperCase() + first.slice(1);
      } else {
        pageName = "Home";
      }
    }

    document.title = `${pageName} | Satubumi`;
  }, [pathname]);

  return null;
}
