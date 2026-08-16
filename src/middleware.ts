import { NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth";

const authPages = new Set(["/login", "/register"]);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth?.user?.id);
  const isAppRoute = pathname.startsWith("/app");
  const isAuthPage = authPages.has(pathname);

  if (isAppRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};
