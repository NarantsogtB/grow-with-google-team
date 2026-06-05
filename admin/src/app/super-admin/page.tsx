import { redirect } from "next/navigation";

export default function SuperAdminRootPage() {
  redirect("/super-admin/login");
}
