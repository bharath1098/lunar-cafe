import { NextRequest, NextResponse } from "next/server";
import { loginStaff } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signStaffToken, staffCookieHeader } from "@/lib/staff-gate";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const ip = clientIp(req);
    const who = String(email || "").trim().toLowerCase();
    if (
      !rateLimit(`login:${who || ip}`, 8, 15 * 60_000) ||
      !rateLimit(`login-ip:${ip}`, 40, 15 * 60_000)
    ) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Wait a few minutes and try again." },
        { status: 429 },
      );
    }
    const user = await loginStaff(who, password);
    const res = NextResponse.json({ user });
    res.headers.append(
      "Set-Cookie",
      staffCookieHeader(signStaffToken({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })),
    );
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
