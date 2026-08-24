import Link from "next/link";
import SignOutButton from "./sign-out-button";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leave", label: "My Leave" },
  { href: "/calendar", label: "Calendar" },
  { href: "/coverage", label: "Coverage" },
];

export default function AppNav({ isManager }: { isManager: boolean }) {
  const links = isManager
    ? [...LINKS, { href: "/team", label: "Team & Approvals" }, { href: "/settings", label: "Settings" }]
    : LINKS;

  return (
    <header className="bg-header text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-medium">Galleywood Pharmacy</span>
        <nav className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-white/85 hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <SignOutButton />
    </header>
  );
}
