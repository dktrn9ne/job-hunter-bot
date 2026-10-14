export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const workflowConfigured = Boolean(process.env.VERCEL_ENV);

  return Response.json({
    status: "degraded",
    checkedAt: new Date().toISOString(),
    capabilities: {
      atsAnalysis: { status: "ready", mode: "deterministic" },
      persistence: { status: databaseConfigured ? "configured" : "not_configured" },
      documentStorage: { status: blobConfigured ? "configured" : "not_configured" },
      durableWorkflows: { status: workflowConfigured ? "available_not_enabled" : "not_configured" },
      outboundApplications: { status: "disabled", approvalRequired: true },
    },
  });
}
