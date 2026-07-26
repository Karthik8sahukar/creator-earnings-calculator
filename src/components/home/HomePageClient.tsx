"use client";

import { type ReactNode } from "react";

import { ToolSearchModal, useToolSearch } from "./ToolSearchModal";
import { AppStoreHero } from "./AppStoreHero";
import { QuickDiscovery } from "./QuickDiscovery";

/**
 * HomePageClient — Client boundary for the homepage.
 *
 * Owns the ToolSearchModal state (open/close) and wires:
 *   - Global Cmd+K / Ctrl+K / "/" shortcut (via useToolSearch hook)
 *   - AppStoreHero search trigger button
 *   - QuickDiscovery (client, tabbed)
 *
 * Server components (CategoryGrid, FeaturedGrid, CollectionSection,
 * TrustStats, WhyBeHumler, LatestBlogs, Faq) are passed in via
 * the `children` slot so they remain server-rendered.
 */
export function HomePageClient({
  children,
}: {
  /** Server-rendered sections below the client sections. */
  children: ReactNode;
}) {
  const { open, onClose, setOpen } = useToolSearch();

  return (
    <>
      {/* Command palette search modal */}
      <ToolSearchModal open={open} onClose={onClose} />

      {/* Hero with search trigger (Tools only — no Creators tab) */}
      <AppStoreHero onSearchOpen={() => setOpen(true)} />

      {/* Quick discovery — tabbed horizontal scroll (client component) */}
      <QuickDiscovery />

      {/* Server-rendered sections passed from the page.
          Wrapped in a div to apply consistent section spacing since
          children are already wrapped in AppShell's space-y. */}
      <div className="contents">
        {children}
      </div>
    </>
  );
}
