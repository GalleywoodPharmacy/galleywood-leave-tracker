/**
 * Who's covering a leave request (or one day of it) — either a real staff
 * account, or a free-text name for someone outside the system entirely
 * (a locum, family cover, etc.). Kept dependency-free so it's safe to
 * import from client components as well as server code.
 */
export type CoverInfo = { type: "staff"; userId: string; name: string } | { type: "external"; name: string };