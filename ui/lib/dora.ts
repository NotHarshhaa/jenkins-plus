import type { Build, DORAMetrics, DORABand, DORADataPoint } from "@/types/jenkins";

export function computeDeployFrequency(builds: Build[]): {
  value: number;
  unit: "day" | "week" | "month";
  dataPoints: DORADataPoint[];
} {
  const successful = builds.filter((b) => b.result === "SUCCESS" && !b.building);
  if (successful.length === 0) {
    return { value: 0, unit: "month", dataPoints: [] };
  }

  const sorted = [...successful].sort((a, b) => a.timestamp - b.timestamp);
  const oldest = sorted[0].timestamp;
  const newest = sorted[sorted.length - 1].timestamp;
  const rangeMs = Math.max(newest - oldest, 1);
  const rangeDays = rangeMs / (1000 * 60 * 60 * 24);

  const deploysPerDay = successful.length / Math.max(rangeDays, 1);

  let value: number;
  let unit: "day" | "week" | "month";
  if (deploysPerDay >= 1) {
    value = Math.round(deploysPerDay * 10) / 10;
    unit = "day";
  } else if (deploysPerDay * 7 >= 1) {
    value = Math.round(deploysPerDay * 7 * 10) / 10;
    unit = "week";
  } else {
    value = Math.round(deploysPerDay * 30 * 10) / 10;
    unit = "month";
  }

  const dataPoints = buildDailyDataPoints(successful);
  return { value, unit, dataPoints };
}

export function computeLeadTime(builds: Build[]): {
  hours: number;
  dataPoints: DORADataPoint[];
} {
  const successful = builds.filter((b) => b.result === "SUCCESS" && !b.building);
  if (successful.length === 0) return { hours: 0, dataPoints: [] };

  const totalMs = successful.reduce((sum, b) => sum + (b.duration ?? 0), 0);
  const avgMs = totalMs / successful.length;
  const hours = Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10;

  const dataPoints = successful.slice(-30).map((b) => ({
    date: new Date(b.timestamp).toISOString().slice(0, 10),
    value: Math.round((b.duration / (1000 * 60 * 60)) * 10) / 10,
  }));

  return { hours, dataPoints };
}

export function computeCFR(builds: Build[]): {
  rate: number;
  dataPoints: DORADataPoint[];
} {
  const finished = builds.filter((b) => !b.building && b.result !== null);
  if (finished.length === 0) return { rate: 0, dataPoints: [] };

  const failed = finished.filter(
    (b) => b.result === "FAILURE" || b.result === "UNSTABLE"
  );
  const rate = Math.round((failed.length / finished.length) * 1000) / 10;

  const dataPoints = buildDailyDataPoints(failed, (date) => {
    const dayFinished = finished.filter(
      (b) => new Date(b.timestamp).toISOString().slice(0, 10) === date
    ).length;
    const dayFailed = failed.filter(
      (b) => new Date(b.timestamp).toISOString().slice(0, 10) === date
    ).length;
    return `${dayFinished > 0 ? Math.round((dayFailed / dayFinished) * 100) : 0}`;
  });

  return { rate, dataPoints };
}

export function computeMTTR(builds: Build[]): {
  hours: number;
  dataPoints: DORADataPoint[];
} {
  const failed = builds.filter((b) => b.result === "FAILURE" && !b.building);
  if (failed.length === 0) return { hours: 0, dataPoints: [] };

  const sorted = [...builds].sort((a, b) => a.timestamp - b.timestamp);
  const recoveries: number[] = [];

  for (const fail of failed) {
    const recovery = sorted.find(
      (b) =>
        b.result === "SUCCESS" &&
        b.timestamp > fail.timestamp &&
        !b.building
    );
    if (recovery) {
      recoveries.push(recovery.timestamp - fail.timestamp);
    }
  }

  if (recoveries.length === 0) return { hours: 0, dataPoints: [] };

  const avgMs = recoveries.reduce((s, v) => s + v, 0) / recoveries.length;
  const hours = Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10;

  const dataPoints = recoveries.slice(-30).map((ms, i) => ({
    date: new Date(
      failed[i]?.timestamp ?? Date.now()
    )
      .toISOString()
      .slice(0, 10),
    value: Math.round((ms / (1000 * 60 * 60)) * 10) / 10,
  }));

  return { hours, dataPoints };
}

export function getDORABand(metrics: Omit<DORAMetrics, "band">): DORABand {
  const { deployFrequency, deployFrequencyUnit, leadTimeHours, changeFailureRate, mttrHours } =
    metrics;

  let deployScore = 0;
  const perDay =
    deployFrequencyUnit === "day"
      ? deployFrequency
      : deployFrequencyUnit === "week"
      ? deployFrequency / 7
      : deployFrequency / 30;

  if (perDay >= 1) deployScore = 3;
  else if (perDay >= 1 / 7) deployScore = 2;
  else if (perDay >= 1 / 30) deployScore = 1;

  let leadScore = 0;
  if (leadTimeHours < 1) leadScore = 3;
  else if (leadTimeHours < 24) leadScore = 2;
  else if (leadTimeHours < 168) leadScore = 1;

  let cfrScore = 0;
  if (changeFailureRate <= 5) cfrScore = 3;
  else if (changeFailureRate <= 10) cfrScore = 2;
  else if (changeFailureRate <= 15) cfrScore = 1;

  let mttrScore = 0;
  if (mttrHours < 1) mttrScore = 3;
  else if (mttrHours < 24) mttrScore = 2;
  else if (mttrHours < 168) mttrScore = 1;

  const total = deployScore + leadScore + cfrScore + mttrScore;
  if (total >= 10) return "elite";
  if (total >= 7) return "high";
  if (total >= 4) return "medium";
  return "low";
}

function buildDailyDataPoints(
  builds: Build[],
  valueMapper?: (date: string) => string
): DORADataPoint[] {
  if (builds.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const b of builds) {
    const date = new Date(b.timestamp).toISOString().slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, count]) => ({
      date,
      value: valueMapper ? parseFloat(valueMapper(date)) : count,
    }));
}
