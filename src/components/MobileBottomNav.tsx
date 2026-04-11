"use client";

import type { ReactNode } from "react";

type Item = {
  key: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
  order: string; // tailwind order-* utility
};

export function MobileBottomNav({ items }: { items: Item[] }) {
  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-[200] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-2xl flex-row items-stretch justify-around px-1">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={[
              "min-h-[52px]",
              "flex-1",
              item.order,
              "px-1 py-2",
              "flex flex-col items-center justify-center gap-1",
              "text-[11px] font-bold tracking-wide",
              "transition-colors duration-150",
              item.isActive
                ? "text-[var(--color-nav-active)]"
                : "text-[var(--color-text-secondary)] opacity-80",
            ].join(" ")}
            onClick={item.onClick}
          >
            <span
              className={[
                "text-[20px] leading-none",
                item.isActive ? "opacity-100" : "opacity-70",
              ].join(" ")}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span className="leading-none">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

