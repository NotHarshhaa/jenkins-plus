"use client";

import { useMemo } from "react";
import type { Build, DORAMetrics } from "@/types/jenkins";
import {
  computeDeployFrequency,
  computeLeadTime,
  computeCFR,
  computeMTTR,
  getDORABand,
} from "@/lib/dora";

export function useDORA(builds: Build[]): DORAMetrics {
  return useMemo(() => {
    const { value: deployFrequency, unit: deployFrequencyUnit } =
      computeDeployFrequency(builds);
    const { hours: leadTimeHours } = computeLeadTime(builds);
    const { rate: changeFailureRate } = computeCFR(builds);
    const { hours: mttrHours } = computeMTTR(builds);

    const metrics = {
      deployFrequency,
      deployFrequencyUnit,
      leadTimeHours,
      changeFailureRate,
      mttrHours,
    };

    return {
      ...metrics,
      band: getDORABand(metrics),
    };
  }, [builds]);
}
