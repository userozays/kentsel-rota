import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_ADI = "krp_oturum";
const ACIK_YOLLAR = ["/giris"];

export async function middleware(istek: NextRequest) {
  const yol = istek.nextUrl.pathname;
  const token = istek.cookies.get(COOKIE_ADI)?.value;

  let gecerli = false;
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      gecerli = true;
    } catch {
      gecerli = false;
    }
  }

  if (ACIK_YOLLAR.some((a) => yol.startsWith(a))) {
    if (gecerli) return NextResponse.redirect(new URL("/", istek.url));
    return NextResponse.next();
  }

  if (!gecerli) {
    const hedef = new URL("/giris", istek.url);
    if (yol !== "/") hedef.searchParams.set("devam", yol);
    return NextResponse.redirect(hedef);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|yuklemeler).*)"],
};
