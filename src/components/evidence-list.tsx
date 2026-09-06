"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import type { EvidenceItem } from "@/lib/types";

export function EvidenceList({
  payoutId,
  items,
}: {
  payoutId: string;
  items: EvidenceItem[];
}) {
  const { evidenceOn, toggleEvidence, ready } = useStore();
  const done = items.filter((i) => evidenceOn(payoutId, i.id)).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        증빙 {done}/{items.length} — 체크는 이 브라우저에만 저장됩니다.
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-xl border bg-card px-3 py-2.5"
          >
            <Checkbox
              checked={ready ? evidenceOn(payoutId, item.id) : false}
              onCheckedChange={() => toggleEvidence(payoutId, item.id)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              {item.hint ? (
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
