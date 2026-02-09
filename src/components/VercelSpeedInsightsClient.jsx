"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function VercelSpeedInsightsClient() {
  return (
    <SpeedInsights
      sampleRate={0.2}
      beforeSend={(data) => {
        const url = String(data?.url || "");
        if (url.includes("/admin")) return null; // ไม่เก็บ admin
        return data;
      }}
    />
  );
}
