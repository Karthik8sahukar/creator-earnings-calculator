"use client";

import { useEffect } from "react";
import { useRecentTools } from "@/hooks/useRecentTools";
import { getToolBySlug } from "@/lib/tools/registry";

interface Props {
  /** The tool slug to record. Must match a registry entry. */
  slug: string;
}

/**
 * ToolVisitTracker — records a tool visit when mounted.
 *
 * Drop this component into any tool page to automatically track
 * the visit in the user's recent tools list.
 *
 * Only records valid registry slugs. Does not render any visible UI.
 *
 * Usage:
 *   <ToolVisitTracker slug="coin-flip" />
 */
export function ToolVisitTracker({ slug }: Props) {
  const { recordVisit } = useRecentTools();

  useEffect(() => {
    // Only record if the slug exists in the registry
    if (getToolBySlug(slug)) {
      recordVisit(slug);
    }
  }, [slug, recordVisit]);

  return null;
}
