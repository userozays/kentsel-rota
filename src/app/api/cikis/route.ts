import { NextResponse, type NextRequest } from "next/server";
import { oturumKapat } from "@/lib/oturum";

export async function POST(istek: NextRequest) {
  await oturumKapat();
  return NextResponse.redirect(new URL("/giris", istek.url), { status: 303 });
}
