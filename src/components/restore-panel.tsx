"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroupStore } from "@/lib/group-store";
import { hydrateOfficeLists, listMissingRemote, lookupRestore, restoreOne, type RestoreItem } from "@/lib/restore";
import { useStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function RestorePanel() {
  const { payouts, hiddenIds, addPayout } = useStore();
  const { campaigns, rememberCampaign } = useGroupStore();
  const [paste, setPaste] = useState("");
  const [items, setItems] = useState<RestoreItem[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const apply = { addPayout, rememberCampaign };

  async function scan() {
    setBusy("scan");
    setError("");
    setNote("");
    try {
      const found = await listMissingRemote({
        payoutIds: payouts.map((p) => p.id),
        hiddenIds,
        campaignIds: campaigns.map((c) => c.id),
      });
      setItems(found);
      setNote(
        found.length
          ? `이 화면에 없는 자료 ${found.length}건을 찾았습니다.`
          : "자료함에 있는 링크는 이미 이 화면에 있습니다. 카톡 링크를 붙여 넣어도 됩니다."
      );
    } catch {
      setError("자료함을 열지 못했습니다. 연결을 확인하고 다시 찾아 주세요.");
    } finally {
      setBusy("");
    }
  }

  async function bring(item: RestoreItem) {
    setBusy(item.id);
    setError("");
    try {
      await restoreOne(item, apply);
      setItems((prev) => (prev ? prev.filter((row) => row.id !== item.id) : prev));
      setNote(`${item.title} 링크를 이 화면으로 가져왔습니다.`);
    } catch {
      setError("가져오지 못했습니다. 링크가 지워졌는지 확인해 주세요.");
    } finally {
      setBusy("");
    }
  }

  async function bringAll(rows: RestoreItem[]) {
    setBusy("all");
    setError("");
    try {
      for (const row of rows) await restoreOne(row, apply);
      setItems([]);
      setNote(`${rows.length}건을 이 화면으로 가져왔습니다.`);
    } catch {
      setError("일부 자료를 가져오지 못했습니다. 다시 찾아 주세요.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section id="restore" className="space-y-3 rounded-2xl border bg-card px-4 py-4">
      <div>
        <h2 className="text-lg font-bold">예전 링크 복원</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          다른 컴퓨터에서 만들었거나 이 브라우저 목록에서 빠진 링크를 자료함에서 다시 가져옵니다.
          카톡에 보낸 주소를 붙여 넣어도 됩니다. 삭제 버튼으로 지운 건 자료함에서도 사라져 복원할 수
          없습니다.
        </p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          const raw = paste.trim();
          if (!raw) return;
          setBusy("paste");
          setError("");
          setNote("");
          try {
            const found = await lookupRestore(raw);
            if (!found) {
              setError("그 주소의 자료를 찾지 못했습니다. 링크가 맞는지 확인해 주세요.");
              return;
            }
            await restoreOne(found, apply);
            setPaste("");
            setItems((prev) => (prev ? prev.filter((row) => row.id !== found.id) : prev));
            setNote(`${found.title} 링크를 이 화면으로 가져왔습니다.`);
          } catch {
            setError("가져오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
          } finally {
            setBusy("");
          }
        }}
      >
        <Input
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="자료 링크 또는 아이디"
          aria-label="복원할 링크"
        />
        <Button type="submit" size="sm" disabled={Boolean(busy) || !paste.trim()}>
          {busy === "paste" ? "가져오는 중…" : "링크로 가져오기"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void scan()}>
          {busy === "scan" ? "찾는 중…" : "자료함에서 찾기"}
        </Button>
        {items && items.length > 1 ? (
          <Button
            type="button"
            size="sm"
            disabled={Boolean(busy)}
            onClick={() => void bringAll(items)}
          >
            {busy === "all" ? "가져오는 중…" : `없는 자료 ${items.length}건 모두 가져오기`}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[color:var(--gold-ink)]">
                    {item.kind === "payout" ? "파트너 지급" : "여행자 자료"}
                    {item.hidden ? " · 이 화면에서 지움" : ""}
                  </p>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(busy)}
                  onClick={() => void bring(item)}
                >
                  {busy === item.id ? "가져오는 중…" : "가져오기"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function CloudHydrate() {
  const path = usePathname();
  const publicPage = path.startsWith("/p/") || path.startsWith("/g/");
  const { ready, payouts, hiddenIds, addPayout } = useStore();
  const { ready: groupReady, campaigns, rememberCampaign } = useGroupStore();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (publicPage || !ready || !groupReady || done) return;
    let cancelled = false;
    hydrateOfficeLists({
      payoutIds: payouts.map((p) => p.id),
      hiddenIds,
      campaignIds: campaigns.map((c) => c.id),
      addPayout,
      rememberCampaign,
    })
      .catch(() => 0)
      .finally(() => {
        if (!cancelled) setDone(true);
      });
    return () => {
      cancelled = true;
    };
    // 첫 동기화만. 함수·목록이 바뀔 때마다 다시 부르지 않습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicPage, ready, groupReady, done]);

  return null;
}
