/**
 * GET /api/health
 */
export function GET() {
  return Response.json({
    status: "ok",
    service: "meai",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
