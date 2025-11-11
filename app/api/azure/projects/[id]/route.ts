import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  // Await params if it's a Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;

  const baseUrl = process.env.AZURE_BASE_URL;
  const pat = process.env.AZURE_PAT;

  if (!baseUrl || !pat) {
    return NextResponse.json(
      { error: "Missing AZURE_BASE_URL or AZURE_PAT" },
      { status: 500 }
    );
  }

  const auth = Buffer.from(`:${pat}`).toString("base64");
  const url = `${baseUrl}/_apis/projects/${resolvedParams.id}?api-version=6.0`;

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
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to connect to Azure DevOps Server";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
