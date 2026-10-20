import { Badge } from "@/components/ui/badge";

type Props = { status: "open" | "closed" | "cancelled"; seatsLeft: number | null };

export function BatchStatusBadge({ status, seatsLeft }: Props) {
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  if (status === "closed") return <Badge variant="secondary">Closed</Badge>;
  if (seatsLeft === 0) return <Badge variant="secondary">Full</Badge>;
  return <Badge variant="outline">Open</Badge>;
}
