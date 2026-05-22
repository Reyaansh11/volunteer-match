import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Service form filling has been retired. Use completion confirmation in the organization dashboard."
    },
    { status: 410 }
  );
}
