"use client";

import { Newspaper, BookOpenText, Megaphone } from "lucide-react";

type TabType = "article" | "news" | "rulebook";

interface Props {
  activeTab: TabType;
  setActiveTab: (value: TabType) => void;
}

const TABS: { key: TabType; label: string; Icon: typeof Newspaper }[] = [
  { key: "article", label: "Articles", Icon: Newspaper },
  { key: "news", label: "News", Icon: Megaphone },
  { key: "rulebook", label: "Rulebooks", Icon: BookOpenText },
];

export default function InsightTabs({ activeTab, setActiveTab }: Props) {
  return (
    <div className="inline-flex bg-white/95 backdrop-blur-md border border-stone-200/50 rounded-full p-1.5 shadow-sm">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 ${
            activeTab === key
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-stone-500 hover:text-emerald-700 hover:bg-emerald-50"
          }`}>
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
