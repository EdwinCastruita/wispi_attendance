"use client";

import { BottomNav, SideNav } from "../components/BottomNav";
import { ServiceWorker } from "../components/ServiceWorker";
import { StatusProvider } from "../lib/status-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StatusProvider>
      <ServiceWorker />
      <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
        <SideNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="relative flex flex-1 flex-col overflow-x-clip">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </StatusProvider>
  );
}
