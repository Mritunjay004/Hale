import type { FastifyInstance } from "fastify";
import { saveReportSchema, type ParameterTrendResponse } from "@hale/shared";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import { reports, reportParameters, focusHabits } from "../../infra/db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { FakeAIProvider } from "../../ai/fake-provider.js";
import { CANONICAL_BIOMARKERS } from "@hale/shared";
import { NotFoundError } from "../../infra/errors.js";

const aiProvider = new FakeAIProvider();

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * POST /v1/reports/extract
   * Multimodal extraction of biomarkers from uploaded PDF or image.
   * Returns extracted parameters without saving (client review screen).
   */
  app.post("/reports/extract", async (_request, reply) => {
    // For now, accept multipart or JSON payload and use AI provider
    const extracted = await aiProvider.extractReportDocument(
      Buffer.from("dummy-report"),
      "application/pdf"
    );
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
      if (biomarker?.goalLinkedHabits.whenHigh) {
        const h = biomarker.goalLinkedHabits.whenHigh;
        await db.insert(focusHabits).values({
          id: crypto.randomUUID(),
          userId,
          type: `biomarker_${biomarker.key}`,
          title: h.title,
          why: `${biomarker.name} was elevated in your report. ${h.why}`,
          metric: h.metric,
          source: "report",
          active: true,
        });
      }
    }

    return reply.status(201).send({ id: reportId, saved: true });
  });

  /**
   * GET /v1/reports
   * List all reports for current user.
   */
  app.get("/reports", async (request, reply) => {
    const userId = request.userId;
    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));

    return reply.status(200).send(userReports);
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
