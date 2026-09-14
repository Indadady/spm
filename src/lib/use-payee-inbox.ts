"use client";

import { mergePayee, subscribePayees, type InboxStatus } from "@/lib/payee-inbox";
import { useStore } from "@/lib/store";
import type { PayeeProfile } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

function hasPayeeCore(row?: PayeeProfile) {
  if (!row) return false;
  return Boolean(row.name || row.bank || row.account || row.rrn);
}

function hasPayeeImage(row?: PayeeProfile) {
  if (!row) return false;
  return Boolean(
    row.idImageUrl ||
      row.idImageDataUrl ||
      row.passportImageUrl ||
      row.passportImageDataUrl
  );
}

/** 원격에 계좌·주민번호·이미지가 있으면 이 기기에도 남깁니다. 예전엔 이미지만 저장해서 세무 목록이 비었습니다. */
function shouldPersistRemote(remote: PayeeProfile, local?: PayeeProfile) {
  if (!hasPayeeCore(remote) && !hasPayeeImage(remote)) return false;
  if (!local) return true;
  if (!local.bank && remote.bank) return true;
  if (!local.account && remote.account) return true;
  if (!local.rrn && remote.rrn) return true;
  if (!local.name && remote.name) return true;
  if (!hasPayeeImage(local) && hasPayeeImage(remote)) return true;
  if (
    remote.remoteId &&
    remote.remoteId !== local.remoteId &&
    (remote.submittedAt || "") >= (local.submittedAt || "")
  ) {
    return true;
  }
  return false;
}

export function usePayeeInbox(payoutId: string) {
  const { payeeOf, savePayee } = useStore();
  const local = payeeOf(payoutId);
  const [remote, setRemote] = useState<PayeeProfile[]>([]);
  const [status, setStatus] = useState<InboxStatus>("connecting");

  useEffect(() => {
    if (!payoutId) return;
    return subscribePayees(payoutId, (rows, next) => {
      setRemote(rows);
      setStatus(next);
    });
  }, [payoutId]);

  useEffect(() => {
    const row = remote[0];
    if (!row || !shouldPersistRemote(row, local)) return;
    const merged = mergePayee(row, local);
    if (merged) savePayee(payoutId, merged);
  }, [local, payoutId, remote, savePayee]);

  const payee = mergePayee(remote[0], local);
  return { payee, submissions: remote, status, local };
}

/** 세무·홈·보관함처럼 여러 건을 한 화면에서 볼 때 Firebase 제출을 같이 읽습니다. */
export function usePayeeMap(payoutIds: string[]) {
  const { payeeOf, savePayee } = useStore();
  const [remoteById, setRemoteById] = useState<Record<string, PayeeProfile | undefined>>({});
  const idsKey = useMemo(() => [...new Set(payoutIds.filter(Boolean))].sort().join("|"), [payoutIds]);
  const payeeOfRef = useRef(payeeOf);
  const savePayeeRef = useRef(savePayee);
  payeeOfRef.current = payeeOf;
  savePayeeRef.current = savePayee;

  useEffect(() => {
    const ids = idsKey ? idsKey.split("|") : [];
    if (!ids.length) {
      setRemoteById({});
      return;
    }
    const unsubs = ids.map((id) =>
      subscribePayees(id, (rows) => {
        const row = rows[0];
        setRemoteById((prev) => {
          const prevRow = prev[id];
          if (
            prevRow?.remoteId === row?.remoteId &&
            prevRow?.submittedAt === row?.submittedAt &&
            prevRow?.account === row?.account &&
            prevRow?.bank === row?.bank &&
            (prevRow?.idImageUrl || "") === (row?.idImageUrl || "")
          ) {
            return prev;
          }
          return { ...prev, [id]: row };
        });
        const local = payeeOfRef.current(id);
        if (row && shouldPersistRemote(row, local)) {
          const merged = mergePayee(row, local);
          if (merged) savePayeeRef.current(id, merged);
        }
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [idsKey]);

  return (id: string) => mergePayee(remoteById[id], payeeOf(id));
}
