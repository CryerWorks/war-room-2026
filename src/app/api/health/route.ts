import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Health check — tests database connectivity.
// No auth required — this is a monitoring endpoint.
// Only queries the shared "domains" table (RLS allows authenticated reads).
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("domains").select("*");

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "connected",
      domains: data,
      count: data?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
