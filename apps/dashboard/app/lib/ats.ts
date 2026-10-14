import { z } from "zod";
import { verifiedProfile, type EvidenceRole } from "./profile";

export const analysisInputSchema = z.object({
  company: z.string().trim().max(200).default(""),
  title: z.string().trim().min(2).max(200),
  location: z.string().trim().max(200).default(""),
  sourceUrl: z.union([z.literal(""), z.url().max(2000)]).default(""),
  jdText: z.string().trim().min(120).max(50_000),
}).strict();

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "because", "been", "being", "but", "can", "company",
  "from", "have", "into", "job", "more", "our", "role", "that", "the", "their", "this", "those",
  "through", "using", "we", "will", "with", "work", "you", "your", "years", "including", "required",
  "preferred", "responsibilities", "requirements", "skills", "experience", "team", "teams", "ability",
  "collaborate", "create", "maintain", "need", "person", "reliable", "integrations",
]);

const LABELS: Record<string, string> = {
  typescript: "TypeScript", javascript: "JavaScript", python: "Python", react: "React", sql: "SQL",
  postgresql: "PostgreSQL", mysql: "MySQL", "api integration": "API integration", "meta ads": "Meta Ads",
  "google ads": "Google Ads", wordpress: "WordPress", shopify: "Shopify", youtube: "YouTube",
  github: "GitHub", ehs: "EHS", sop: "SOP",
};

function label(term: string) {
  return LABELS[term] ?? term.replace(/\b\w/g, (character) => character.toUpperCase());
}

function tokenize(value: string) {
  return value.toLowerCase().match(/[a-z][a-z0-9+#-]{2,}/g) ?? [];
}

function roleScore(role: EvidenceRole, jdTokens: Set<string>) {
  const roleTokens = new Set(tokenize(`${role.title} ${role.bullets.join(" ")}`));
  let score = 0;
  for (const token of roleTokens) if (jdTokens.has(token)) score += 1;
  return score;
}

function importantJdTerms(jdText: string) {
  const counts = new Map<string, number>();
  for (const token of tokenize(jdText)) {
    if (STOP_WORDS.has(token) || token.length < 4) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 24)
    .map(([term]) => term);
}

export function analyzeJob(input: z.infer<typeof analysisInputSchema>) {
  const normalizedJd = input.jdText.toLowerCase();
  const jdTokens = new Set(tokenize(input.jdText));
  const matched = verifiedProfile.skills.filter((skill) => normalizedJd.includes(skill));
  const profileTokens = new Set(tokenize(`${verifiedProfile.skills.join(" ")} ${verifiedProfile.roles.flatMap((role) => role.bullets).join(" ")}`));
  const missing = importantJdTerms(input.jdText).filter((term) => !profileTokens.has(term)).slice(0, 10);

  const risks: string[] = [];
  if (/bachelor(?:['’]s|s)? degree.{0,24}(required|minimum)|required.{0,24}bachelor/i.test(input.jdText)) {
    risks.push("A required bachelor’s degree is not present in the verified profile.");
  }
  if (/security clearance|secret clearance|top secret|ts\/sci/i.test(input.jdText)) {
    risks.push("No security clearance is present in the verified profile.");
  }
  const yearRequirements = [...input.jdText.matchAll(/(\d{1,2})\+?\s+years?(?:\s+of)?\s+experience/gi)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  const highestYears = yearRequirements.length ? Math.max(...yearRequirements) : 0;
  if (highestYears >= 10) risks.push(`The posting asks for ${highestYears}+ years; verify the exact relevant tenure before claiming it.`);
  if (risks.length === 0) risks.push("No obvious hard-gate conflict was detected; a human must still verify every requirement.");

  const evidence = [...verifiedProfile.roles]
    .map((role) => ({ role, score: roleScore(role, jdTokens) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ role }) => ({ company: role.company, title: `${role.title} · ${role.years}`, bullets: role.bullets }));

  const skillCoverage = matched.length / Math.max(8, Math.min(18, matched.length + missing.length));
  const evidenceStrength = evidence.reduce((total, item) => total + roleScore({ ...item, years: "" }, jdTokens), 0);
  const score = Math.max(20, Math.min(96, Math.round(32 + skillCoverage * 52 + Math.min(12, evidenceStrength) - risks.length * 4)));
  const verdict = score >= 78 && risks.length <= 1 ? "STRONG_MATCH" : score >= 58 ? "REVIEW" : "GAP";

  return {
    score,
    verdict,
    matchedTerms: matched.slice(0, 16).map(label),
    missingTerms: missing.map(label),
    risks,
    summary: matched.length
      ? `${matched.length} verified capabilities align with the posting. Use the evidence below as source material, not as permission to invent or inflate experience.`
      : "The posting has limited overlap with the verified profile. Review the gaps before spending time on a tailored résumé.",
    evidence,
    metadata: { analyzedAt: new Date().toISOString(), mode: "stateless-preview" },
  } as const;
}
