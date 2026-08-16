import { signIn } from "@/shared/lib/auth";

export async function GET() {
  await signIn("credentials", {
    email: "admin@odonto.demo",
    password: "Demo@123456",
    redirectTo: "/app",
  });
}
