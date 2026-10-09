"use client";

import GuideRoute from "@/components/auth/GuideRoute";

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuideRoute>{children}</GuideRoute>;
}
