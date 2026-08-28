"use client";

import { useState } from "react";
import Link from "next/link";
import SignOutButton from "./sign-out-button";
import { HomeIcon, CalendarIcon, UmbrellaIcon, UserIcon, PeopleIcon, SettingsIcon, HelpIcon } from "./nav-icons";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/coverage", label: "Coverage", icon: UmbrellaIcon },
  { href: "/account", label: "Account", icon: UserIcon },
];

const HELP_LINK = { href: "/help", label: "Help", icon: HelpIcon };

export default function AppNav({ isManager }: { isManager: boolean }) {
  const [open, setOpen] = useState(false);
  const links = isManager
    ? [
        ...LINKS,
        { href: "/team", label: "Team & Approvals", icon: PeopleIcon },
        { href: "/settings", label: "Settings", icon: SettingsIcon },
        HELP_LINK,
      ]
    : [...LINKS, HELP_LINK];

  return (
    <header className="bg-header text-white">
      <div className="px-6 py-4 flex items-center justify-between">
        <span className="font-medium">Galleywood Pharmacy</span>

        {/* Desktop nav — hidden below md, everything fits on one line above that */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 text-white/85 hover:text-white transition-colors"
            >
              <link.icon />
              {link.label}
            </Link>
          ))}
          <SignOutButton />
        </nav>

        {/* Mobile menu toggle — hidden at md and above */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden p-1.5 -mr-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown — stacked links + sign out, shown only when toggled open */}
      {open && (
        <nav className="md:hidden flex flex-col gap-1 px-6 pb-4 border-t border-white/10 pt-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 py-2 text-white/85 hover:text-white transition-colors text-sm"
            >
              <link.icon />
              {link.label}
            </Link>
          ))}
          <div className="pt-2" onClick={() => setOpen(false)}>
            <SignOutButton />
          </div>
        </nav>
      )}
    </header>
  );
}