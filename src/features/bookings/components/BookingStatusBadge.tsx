import { Badge } from "@/components/ui/badge";

import { BOOKING_STATUS_LABELS, type BookingDisplayStatus } from "../status";

export function BookingStatusBadge({ status }: { status: BookingDisplayStatus }) {
  const label = BOOKING_STATUS_LABELS[status];
  if (status === "confirmed") return <Badge>{label}</Badge>;
  if (status === "held") return <Badge variant="outline">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}
