export type EvidenceRole = {
  company: string;
  title: string;
  years: string;
  bullets: string[];
};

export const verifiedProfile = {
  skills: [
    "typescript", "javascript", "python", "react", "html", "css", "sql", "postgresql",
    "mysql", "api integration", "automation", "debugging", "git", "github", "documentation",
    "meta ads", "google ads", "retargeting", "lookalike audiences", "wordpress", "shopify",
    "content strategy", "copywriting", "editing", "video production", "youtube", "reporting",
    "project management", "stakeholder collaboration", "lithography", "photoresist", "wet etch",
    "dry etch", "metrology", "cleanroom", "sop", "ehs", "merchandising", "inventory",
    "route planning", "customer service", "spanish",
  ],
  roles: [
    {
      company: "Library Labs",
      title: "AI Media Generation / Software Development / Automation",
      years: "2023–Present",
      bullets: [
        "Built and automated production workflows to improve repeatability and reduce manual overhead.",
        "Delivered full-stack prototypes using React, TypeScript, JavaScript, HTML/CSS, and Python.",
        "Supported debugging and iterative improvements with documentation, validation, and change coordination.",
      ],
    },
    {
      company: "Orange Line Media",
      title: "Marketing / Content Campaigns",
      years: "2016–2020",
      bullets: [
        "Planned multi-channel content and marketing campaigns across messaging, creative, publishing, and reporting.",
        "Managed Meta Ads and Google Ads, including retargeting and lookalike strategy.",
        "Managed annual budgets in the $40K–$100K range and tracked sales, traffic, and engagement KPIs.",
      ],
    },
    {
      company: "Toppan Photomasks",
      title: "Lithography / Dry Etch Technician",
      years: "2019–2023",
      bullets: [
        "Executed quality-controlled procedures in a high-compliance manufacturing environment.",
        "Supported lithography, photoresist coating, wet etch, dry etch, chamber cleans, and contamination control.",
        "Performed CD metrology checks, documented results, and flagged out-of-spec conditions.",
      ],
    },
    {
      company: "Meta",
      title: "Policy Advisor / Ads Policy Advisor",
      years: "2016–2018",
      bullets: [
        "Supported high-volume operational workflows with escalations and cross-functional coordination.",
        "Advised on advertising policy and supported issue triage and escalation workflows.",
        "Tested creative and targeting approaches, troubleshooting delivery issues and translating findings into guidance.",
      ],
    },
    {
      company: "Lamorne Morris",
      title: "Video Marketing Campaign",
      years: "2017",
      bullets: [
        "Executed promotional strategy and distribution for a YouTube campaign that reached 4.1M+ views.",
        "Coordinated rollout assets and monitored audience signals to guide iteration.",
      ],
    },
  ] satisfies EvidenceRole[],
} as const;
