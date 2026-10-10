import type { FastifyInstance } from "fastify";
import { saveReportSchema, type ParameterTrendResponse } from "@hale/shared";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import { reports, reportParameters, focusHabits } from "../../infra/db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { aiProvider } from "../../ai/factory.js";
import { CANONICAL_BIOMARKERS } from "@hale/shared";
import { NotFoundError } from "../../infra/errors.js";

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * POST /v1/reports/extract
   * Multimodal extraction of biomarkers from uploaded PDF or image.
   * Returns extracted parameters without saving (client review screen).
   */
  app.post("/reports/extract", async (request, reply) => {
    let fileBuffer = Buffer.from("sample-report");
    let mimeType = "application/pdf";

    if (request.body && typeof request.body === "object") {
      const b = request.body as Record<string, unknown>;
      if (typeof b.base64 === "string") {
        fileBuffer = Buffer.from(b.base64, "base64");
        mimeType = (b.mimeType as string) || "image/jpeg";
      }
    }

    const extracted = await aiProvider.extractReportDocument(fileBuffer, mimeType);
    return reply.status(200).send(extracted);
  });

  /**
   * POST /v1/reports
   * Save confirmed lab report and optionally add goal-linked focus habits.
   */
  app.post("/reports", async (request, reply) => {
    const body = saveReportSchema.parse(request.body);
    const userId = request.userId;
    const reportId = crypto.randomUUID();

    await db.insert(reports).values({
      id: reportId,
      userId,
      reportDate: body.reportDate,
      label: body.label,
      status: "ready",
    });

    for (const p of body.parameters) {
      await db.insert(reportParameters).values({
        id: crypto.randomUUID(),
        reportId,
        canonicalKey: p.canonicalKey ?? null,
        name: p.name,
        value: p.value,
        unit: p.unit,
        refLow: p.refLow ?? null,
        refHigh: p.refHigh ?? null,
        status: p.status,
      });
    }

    // Add accepted goal-linked habits to user's focus habits
    for (const habitKey of body.acceptedHabitKeys) {
      const biomarker = CANONICAL_BIOMARKERS[habitKey];
      if (biomarker) {
        const param = body.parameters.find((p) => p.canonicalKey === habitKey);
        const isLow = param?.status === "low";
        const h = isLow
          ? biomarker.goalLinkedHabits.whenLow ?? biomarker.goalLinkedHabits.whenHigh
          : biomarker.goalLinkedHabits.whenHigh ?? biomarker.goalLinkedHabits.whenLow;

        if (h) {
          await db.insert(focusHabits).values({
            id: crypto.randomUUID(),
            userId,
            type: `biomarker_${biomarker.key}`,
            title: h.title,
            why: `${biomarker.name} was ${param?.status ?? "flagged"} in your report. ${h.why}`,
            metric: h.metric,
            source: "report",
            active: true,
          });
        }
      }
    }

    return reply.status(201).send({ id: reportId, saved: true });
  });

  /**
   * GET /v1/reports
   * List all reports for current user including parameter breakdown.
   */
  app.get("/reports", async (request, reply) => {
    const userId = request.userId;
    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.reportDate));

    const reportIds = userReports.map((r) => r.id);
    const paramsByReportId = new Map<string, Array<{
      id: string;
      canonicalKey: string | null;
      name: string;
      value: number;
      unit: string;
      refLow: number | null;
      refHigh: number | null;
      status: "low" | "normal" | "high" | "unknown";
    }>>();

    if (reportIds.length > 0) {
      const allParams = await db
        .select()
        .from(reportParameters)
        .where(inArray(reportParameters.reportId, reportIds));

      for (const p of allParams) {
        const arr = paramsByReportId.get(p.reportId) ?? [];
        arr.push({
          id: p.id,
          canonicalKey: p.canonicalKey,
          name: p.name,
          value: p.value,
          unit: p.unit,
          refLow: p.refLow,
          refHigh: p.refHigh,
          status: p.status as "low" | "normal" | "high" | "unknown",
        });
        paramsByReportId.set(p.reportId, arr);
      }
    }

    const result = userReports.map((r) => ({
      id: r.id,
      userId: r.userId,
      reportDate: r.reportDate,
      label: r.label,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      parameters: paramsByReportId.get(r.id) ?? [],
    }));

    return reply.status(200).send(result);
  });

  /**
   * GET /v1/parameters/:key/trend
   * Historical trend sparkline data for a specific biomarker.
   */
  app.get("/parameters/:key/trend", async (request, reply) => {
    const { key } = request.params as { key: string };
    const userId = request.userId;

    const biomarker = CANONICAL_BIOMARKERS[key];
    if (!biomarker) {
      throw new NotFoundError(`Biomarker '${key}'`);
    }

    // Query user's reports and parameters matching this canonical key
    const userReports = await db
      .select({
        reportId: reports.id,
        reportDate: reports.reportDate,
      })
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(reports.reportDate);

    const history = [];
    for (const r of userReports) {
      const params = await db
        .select()
        .from(reportParameters)
        .where(
          and(
            eq(reportParameters.reportId, r.reportId),
            eq(reportParameters.canonicalKey, key)
          )
        );

      if (params.length > 0 && params[0]) {
        history.push({
          date: r.reportDate,
          value: params[0].value,
          unit: params[0].unit,
          status: params[0].status,
          reportId: r.reportId,
        });
      }
    }

    const response: ParameterTrendResponse = {
      canonicalKey: biomarker.key,
      name: biomarker.name,
      standardUnit: biomarker.standardUnit,
      explanation: biomarker.explanation,
      refLow: biomarker.referenceRange.low,
      refHigh: biomarker.referenceRange.high,
      history,
    };

    return reply.status(200).send(response);
  });
}
