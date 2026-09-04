import { Suspense } from "react";
import LoginForm from "@/components/login/login-form";

// Static branding now — this page represents the Smart Team And Rota (STAR)
// platform itself, not any one business, so it no longer looks up an
// organization's own name/logo the way it briefly did as a single-tenant
// stopgap. No per-request data fetch happens here anymore, so this page
// can be fully static.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}