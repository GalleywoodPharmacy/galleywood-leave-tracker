import { redirect } from "next/navigation";

export default function LeavePageRedirect() {
  redirect("/dashboard");
}