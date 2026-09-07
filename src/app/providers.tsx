"use client";

import { GroupStoreProvider } from "@/lib/group-store";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <GroupStoreProvider>{children}</GroupStoreProvider>
    </StoreProvider>
  );
}
