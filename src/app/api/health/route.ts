import pkg from "../../../../package.json";

export function GET() {
  return Response.json({ ok: true, version: pkg.version, ts: new Date().toISOString() });
}
