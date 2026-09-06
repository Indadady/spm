"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import type { Lodging, Person, Room } from "@/lib/types";
import { useMemo, useState } from "react";

const capacity: Record<Room["type"], number> = {
  single: 1,
  twin: 2,
  triple: 3,
  quad: 4,
};

const typeLabel: Record<Room["type"], string> = {
  single: "싱글",
  twin: "트윈",
  triple: "트리플",
  quad: "4인",
};

export function RoomBoard({ payoutId, initial }: { payoutId: string; initial: Lodging }) {
  const { lodgingOf, saveLodging, payouts } = useStore();
  const payout = payouts.find((p) => p.id === payoutId);
  const lodging = (payout ? lodgingOf(payout) : undefined) ?? initial;
  const [pick, setPick] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState("호수 ");

  const assigned = useMemo(
    () => new Set(lodging.rooms.flatMap((r) => r.occupantIds)),
    [lodging.rooms]
  );
  const waiting = lodging.people.filter((p) => !assigned.has(p.id));

  function commit(next: Lodging) {
    saveLodging(payoutId, next);
  }

  function assignTo(room: Room) {
    if (!pick) return;
    const cap = capacity[room.type];
    if (room.occupantIds.includes(pick) || room.occupantIds.length >= cap) return;
    commit({
      ...lodging,
      rooms: lodging.rooms.map((r) =>
        r.id === room.id ? { ...r, occupantIds: [...r.occupantIds, pick] } : r
      ),
    });
    setPick(null);
  }

  function removeFrom(room: Room, personId: string) {
    commit({
      ...lodging,
      rooms: lodging.rooms.map((r) =>
        r.id === room.id
          ? { ...r, occupantIds: r.occupantIds.filter((id) => id !== personId) }
          : r
      ),
    });
  }

  function person(id: string): Person | undefined {
    return lodging.people.find((p) => p.id === id);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-semibold tracking-wide text-[color:var(--gold-ink)]">
          숙소
        </p>
        <Input
          value={lodging.name}
          placeholder="숙소명"
          className="mt-1 h-9 text-lg font-bold"
          onChange={(e) => commit({ ...lodging, name: e.target.value })}
        />
        <Input
          value={lodging.address}
          placeholder="주소"
          className="mt-2 h-8"
          onChange={(e) => commit({ ...lodging, address: e.target.value })}
        />
        <Input
          value={lodging.phone ?? ""}
          placeholder="전화"
          className="mt-2 h-8"
          onChange={(e) => commit({ ...lodging, phone: e.target.value })}
        />
        <p className="mt-1 text-sm text-muted-foreground">
          {lodging.checkIn ? `체크인 ${lodging.checkIn}` : null}
          {lodging.checkOut ? ` · 체크아웃 ${lodging.checkOut}` : null}
        </p>
        {lodging.note ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{lodging.note}</p>
        ) : null}
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">미배정 {waiting.length}명</h3>
        <div className="flex flex-wrap gap-2">
          {waiting.length === 0 ? (
            <p className="text-sm text-muted-foreground">모두 객실에 넣었습니다.</p>
          ) : (
            waiting.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPick(p.id === pick ? null : p.id)}
                className={`rounded-full border px-3 py-1.5 text-left text-sm ${
                  pick === p.id
                    ? "border-[color:var(--navy)] bg-[color:var(--navy)] text-white"
                    : "bg-card"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="ml-1 text-xs opacity-80">{p.role}</span>
              </button>
            ))
          )}
        </div>
        {pick ? (
          <p className="mt-2 text-xs text-muted-foreground">
            선택한 사람을 객실 카드에 눌러 넣습니다.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">객실</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {lodging.rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => assignTo(room)}
              className="rounded-2xl border bg-card p-4 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={room.label}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    commit({
                      ...lodging,
                      rooms: lodging.rooms.map((r) =>
                        r.id === room.id ? { ...r, label: e.target.value } : r
                      ),
                    })
                  }
                  className="h-8 max-w-[10rem] font-semibold"
                />
                <span className="text-xs text-muted-foreground">
                  {typeLabel[room.type]} · {room.occupantIds.length}/{capacity[room.type]}
                </span>
              </div>
              <ul className="mt-3 min-h-12 space-y-1">
                {room.occupantIds.length === 0 ? (
                  <li className="text-sm text-muted-foreground">빈 방</li>
                ) : (
                  room.occupantIds.map((id) => {
                    const p = person(id);
                    return (
                      <li key={id} className="flex items-center justify-between text-sm">
                        <span>
                          <b>{p?.name}</b>{" "}
                          <span className="text-muted-foreground">{p?.role}</span>
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          className="text-xs text-muted-foreground underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFrom(room, id);
                          }}
                        >
                          빼기
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="객실 이름"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const label = newRoom.trim() || `호수 미정 ${lodging.rooms.length + 1}`;
              commit({
                ...lodging,
                rooms: [
                  ...lodging.rooms,
                  {
                    id: `r-${Date.now()}`,
                    label,
                    type: "twin",
                    occupantIds: [],
                  },
                ],
              });
              setNewRoom("호수 ");
            }}
          >
            객실 추가
          </Button>
        </div>
      </section>
    </div>
  );
}
