"use client";

import { CloudHydrate } from "@/components/restore-panel";
import { GroupStoreProvider } from "@/lib/group-store";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <GroupStoreProvider>
        <CloudHydrate />
        {children}
      </GroupStoreProvider>
    </StoreProvider>
  );
}
