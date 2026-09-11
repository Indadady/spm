"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PassportEnFields({
  idPrefix,
  name,
  passportNo,
  expiry,
  disabled,
  onName,
  onNo,
  onExpiry,
}: {
  idPrefix: string;
  name: string;
  passportNo: string;
  expiry: string;
  disabled?: boolean;
  onName: (value: string) => void;
  onNo: (value: string) => void;
  onExpiry: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-en`}>영문명</Label>
        <Input
          id={`${idPrefix}-en`}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="KIM MIN SU"
          value={name}
          disabled={disabled}
          onChange={(e) => onName(e.target.value.toUpperCase())}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-no`}>여권번호</Label>
        <Input
          id={`${idPrefix}-no`}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="M12345678"
          value={passportNo}
          disabled={disabled}
          onChange={(e) => onNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-exp`}>여권만료일</Label>
        <Input
          id={`${idPrefix}-exp`}
          type="date"
          value={expiry}
          disabled={disabled}
          onChange={(e) => onExpiry(e.target.value)}
        />
      </div>
    </div>
  );
}
