import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.AZURE_BASE_URL; // ex: https://src.bpk.go.id/AuditManagementSystems
  const pat = process.env.AZURE_PAT;

  if (!baseUrl || !pat) {
    return NextResponse.json(
      { error: "Missing AZURE_BASE_URL or AZURE_PAT" },
      { status: 500 }
    );
  }

  const auth = Buffer.from(`:${pat}`).toString("base64");
  const url = `${baseUrl}/_apis/projects?api-version=6.0`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Azure DevOps API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to connect to Azure DevOps Server" },
      { status: 500 }
    );
  }
}
