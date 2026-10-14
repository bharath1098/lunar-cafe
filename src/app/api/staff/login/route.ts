import { NextRequest, NextResponse } from "next/server";
import { loginStaff } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await loginStaff(email, password);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
