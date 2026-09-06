"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWon, formatWonInput, parseWonInput } from "@/lib/format";
import { calcTax } from "@/lib/tax";
import type { TaxMethod } from "@/lib/types";
import { useEffect, useState } from "react";

export function GrossAmountField({
  id = "gross",
  value,
  onChange,
  taxMethod,
  days,
  required,
}: {
  id?: string;
  value: number;
  onChange: (n: number) => void;
  taxMethod: TaxMethod;
  days?: number;
  required?: boolean;
}) {
  const [text, setText] = useState(formatWonInput(value));
  useEffect(() => {
    setText(formatWonInput(value));
  }, [value]);

  const tax = calcTax({ method: taxMethod, gross: value, days });

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>원천징수 이전 금액</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          required={required}
          value={text}
          onChange={(e) => {
            const next = parseWonInput(e.target.value);
            setText(e.target.value.replace(/[^\d,]/g, "") === "" ? "" : formatWonInput(next));
            onChange(next);
          }}
          placeholder="2,000,000"
          className="pr-8 text-right tabular-nums"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
          원
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        발주처·견적 금액입니다. 원천 {formatWon(tax.withholding)}을 빼면 실지급{" "}
        <span className="font-semibold text-foreground">{formatWon(tax.net)}</span>
        입니다.
      </p>
    </div>
  );
}
