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
      { error: "Missing Azure DevOps configuration" },
      { status: 500 }
    );
  }

  const auth = Buffer.from(`:${pat}`).toString("base64");

  // WIQL (Work Item Query Language) query to get Tasks
  const wiqlQuery = {
    query: `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo] 
            FROM WorkItems 
            WHERE [System.TeamProject] = '${resolvedParams.id}' 
            AND [System.WorkItemType] = 'Task'
            ORDER BY [System.ChangedDate] DESC`,
  };

  try {
    // Step 1: Execute WIQL query to get work item IDs
    const wiqlUrl = `${baseUrl}/_apis/wit/wiql?api-version=6.0`;

    const wiqlResponse = await fetch(wiqlUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wiqlQuery),
      cache: "no-store",
    });

    if (!wiqlResponse.ok) {
      const text = await wiqlResponse.text();
      throw new Error(`WIQL Query error: ${wiqlResponse.status} ${text}`);
    }

    const wiqlData = await wiqlResponse.json();

    // If no work items found
    if (!wiqlData.workItems || wiqlData.workItems.length === 0) {
      return NextResponse.json({ workItems: [] });
    }

    // Step 2: Get detailed work item information
    const ids = wiqlData.workItems.map((wi: any) => wi.id).join(",");
    const detailsUrl = `${baseUrl}/_apis/wit/workitems?ids=${ids}&api-version=6.0`;

    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
    });

    if (!detailsResponse.ok) {
      const text = await detailsResponse.text();
      throw new Error(
        `Work Items API error: ${detailsResponse.status} ${text}`
      );
    }

    const detailsData = await detailsResponse.json();

    return NextResponse.json({
      count: detailsData.count,
      workItems: detailsData.value,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch work items";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
