import fs from "fs";
import path from "path";
import { campaignLabel, type Utm } from "./utm";

/** First-party campaign log. No third-party analytics script. */
export function recordCampaign(action: string, utm: Utm | null | undefined) {
  const label = campaignLabel(utm);
  if (!label || !utm) return;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({
    at: new Date().toISOString(),
    action,
    label,
    source: utm.source || "",
    medium: utm.medium || "",
    campaign: utm.campaign || "",
  });
  fs.appendFileSync(path.join(dir, "campaigns.ndjson"), `${line}\n`);
}
