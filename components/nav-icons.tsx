function base(children: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
      {children}
    </svg>
  );
}

export function HomeIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11l8-7 8 7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </>
  );
}

export function CalendarIcon() {
  return base(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
    </>
  );
}

export function UmbrellaIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3C7 3 3 8 3 12h18c0-4-4-9-9-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19a2 2 0 0 1-2 2" />
    </>
  );
}

export function UserIcon() {
  return base(
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </>
  );
}

export function PeopleIcon() {
  return base(
    <>
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
      <path strokeLinecap="round" d="M15 5.5a3 3 0 0 1 0 5.8" />
      <path strokeLinecap="round" d="M17.5 14.3c2 .5 3.5 2.2 3.5 4.7" />
    </>
  );
}

export function SettingsIcon() {
  return base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      />
    </>
  );
}

export function ReportIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  );
}

export function HelpIcon() {
  return base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 1 1 3.5 2.29c-.7.3-1 .9-1 1.71v.5" />
      <path strokeLinecap="round" d="M12 17h.01" />
    </>
  );
}