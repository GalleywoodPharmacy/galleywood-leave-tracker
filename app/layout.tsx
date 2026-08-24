import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "Galleywood Pharmacy — Staff Leave & Rota",
  description: "Staff leave requests, approvals, calendar and shift coverage for Galleywood Pharmacy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
