export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function GET() {
  // 外部データベースを使わず、直接データを返します
  const dummyStores = [
    {
      id: "1",
      name: "うどん本陣 山田家",
      lat: 34.3427,
      lng: 134.1166,
      category: "gourmet",
      prefecture: "kagawa"
    },
    {
      id: "2",
      name: "道後温泉本館周辺",
      lat: 33.8492,
      lng: 132.7856,
      category: "cafe",
      prefecture: "ehime"
    }
  ];

  return NextResponse.json({ stores: dummyStores }, { status: 200 });
}