"use client";

import { PublicPayeeView } from "@/components/public-payee-view";
import { useParams } from "next/navigation";

export default function PublicPayeePage() {
  const { id } = useParams<{ id: string }>();
  return <PublicPayeeView id={id ?? ""} />;
}
