import { describe, expect, it } from "vitest";
import { analyzeJob, analysisInputSchema } from "./ats";

const base = {
  company: "Example",
  title: "Automation Engineer",
  location: "Remote",
  sourceUrl: "",
};

describe("ATS analysis", () => {
  it("rejects incomplete job descriptions", () => {
    expect(analysisInputSchema.safeParse({ ...base, jdText: "too short" }).success).toBe(false);
  });

  it("matches only verified capabilities", () => {
    const result = analyzeJob({
      ...base,
      jdText: "We need a TypeScript and React engineer with Python automation, API integration, debugging, documentation, stakeholder collaboration, and GitHub delivery experience. This person will create reliable production workflows and collaborate across teams.",
    });
    expect(result.matchedTerms).toEqual(expect.arrayContaining(["TypeScript", "React", "Python"]));
    expect(result.summary).toContain("verified capabilities");
  });

  it("flags hard requirements that are not verified", () => {
    const result = analyzeJob({
      ...base,
      jdText: "A bachelor’s degree is required. Candidates must hold a Top Secret security clearance and have 12+ years experience managing enterprise infrastructure, Kubernetes platforms, compliance programs, and large engineering organizations.",
    });
    expect(result.risks.join(" ")).toMatch(/bachelor/i);
    expect(result.risks.join(" ")).toMatch(/clearance/i);
    expect(result.risks.join(" ")).toMatch(/12\+ years/i);
  });
});
