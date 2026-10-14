export type EvidenceRole = {
  company: string;
  title: string;
  years: string;
  bullets: string[];
  source: {
    label: string;
    url: string;
    kind: "portfolio" | "repository";
  };
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
      company: "Proofrail",
      title: "AI Evaluation Prototype",
      years: "2026",
      bullets: [
        "Built a provider-neutral evaluation prototype using repeated trials, controls, criterion-level evidence, and auditable release decisions.",
        "Implemented the prototype with Python, deterministic evaluators, JSON and Markdown reports, tests, and CI.",
        "Published synthetic fixtures, sample evidence, and explicit prototype boundaries for reproducible review.",
      ],
      source: {
        label: "Source, tests, artifacts, and CI",
        url: "https://github.com/dktrn9ne/proofrail-ai-evals",
        kind: "repository",
      },
    },
    {
      company: "OpenClaw / ClawHub",
      title: "Agentic AI Developer / Product Builder",
      years: "2026",
      bullets: [
        "Published reusable agent skills for specialized FiveM development and Mux video workflows.",
        "Designed multi-step tool selection, API-oriented instructions, context management, and failure handling.",
        "Maintained public source repositories that package domain workflows into reusable agent capabilities.",
      ],
      source: {
        label: "Published skill source repository",
        url: "https://github.com/dktrn9ne/MUX-Video-Skill",
        kind: "repository",
      },
    },
    {
      company: "Cadence",
      title: "Founder / Product Builder",
      years: "2026–Present",
      bullets: [
        "Leads product strategy, technical architecture, user experience, demos, ecosystem partnerships, and fundraising for real-time income infrastructure.",
        "Designed product concepts around payroll, stablecoin settlement, XRPL infrastructure, and programmable money flows.",
      ],
      source: {
        label: "Candidate portfolio case study",
        url: "https://www.mauricethomas.online/projects/cadence.html",
        kind: "portfolio",
      },
    },
    {
      company: "Library Labs",
      title: "AI Media Generation / Software Development / Automation",
      years: "2023–Present",
      bullets: [
        "Built and automated production workflows to improve repeatability and reduce manual overhead.",
        "Delivered full-stack prototypes using React, TypeScript, JavaScript, HTML/CSS, and Python.",
        "Supported debugging and iterative improvements with documentation, validation, and change coordination.",
      ],
      source: {
        label: "Candidate portfolio experience",
        url: "https://www.mauricethomas.online/#experience",
        kind: "portfolio",
      },
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
      source: {
        label: "Verified master profile",
        url: "https://www.mauricethomas.online/#experience",
        kind: "portfolio",
      },
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
      source: {
        label: "Candidate portfolio experience",
        url: "https://www.mauricethomas.online/#experience",
        kind: "portfolio",
      },
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
      source: {
        label: "Candidate portfolio experience",
        url: "https://www.mauricethomas.online/#experience",
        kind: "portfolio",
      },
    },
    {
      company: "Lamorne Morris",
      title: "Video Marketing Campaign",
      years: "2017",
      bullets: [
        "Executed promotional strategy and distribution for a YouTube campaign that reached 4.1M+ views.",
        "Coordinated rollout assets and monitored audience signals to guide iteration.",
      ],
      source: {
        label: "Candidate portfolio case study",
        url: "https://www.mauricethomas.online/#work",
        kind: "portfolio",
      },
    },
  ] satisfies EvidenceRole[],
} as const;
