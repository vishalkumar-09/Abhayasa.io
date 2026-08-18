import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    {
      status: "UP",
      service: "Abhayasa Frontend",
      timestamp: Date.now()
    },
    { status: 200 }
  );
}
