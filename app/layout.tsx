import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth-provider";
import ToastProvider from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "STAR — Smart Team and Rota",
  description: "Staff leave requests, approvals, calendar and shift coverage — powered by STAR (Smart Team and Rota).",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "STAR",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}