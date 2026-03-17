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
      className="md:hidden fixed bottom-0 left-0 right-0 z-[150] border-t border-[var(--color-border)] bg-[var(--color-nav-bg)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-2xl flex-row items-stretch justify-around px-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={[
              "min-h-[44px]",
              "flex-1",
              item.order,
              "px-2 py-2",
              "flex flex-col items-center justify-center gap-1",
              "text-xs font-semibold",
              item.isActive
                ? "text-[var(--color-nav-active)]"
                : "text-[var(--color-text-secondary)]",
            ].join(" ")}
            onClick={item.onClick}
          >
            <span className="text-base leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span className="leading-none">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

