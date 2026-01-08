export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "疎通テスト成功：Firebaseなし" });
}