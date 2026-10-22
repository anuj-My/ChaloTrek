import { participantsCsv } from "@/features/bookings/export";

// Downloads the batch's participant list as a CSV that opens in Excel.
export async function GET(_request: Request, { params }: RouteContext<"/dashboard/bookings/[batchId]/export">) {
  const { batchId } = await params;
  const { filename, csv } = await participantsCsv(batchId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
