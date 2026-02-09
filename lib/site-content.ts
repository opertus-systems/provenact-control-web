import { MarketingIconName } from "../components/icons/marketing-icons";

export type HeroContent = {
  chip: string;
  title: string;
  description: string;
};

export type FeatureItem = {
  icon: MarketingIconName;
  title: string;
  body: string;
};

export type PricingTier = {
  name: string;
  price: string;
  note: string;
  features: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const company = {
  name: "Provenact Control",
  supportEmail: "opensource@opertus.systems",
  salesEmail: "opensource@opertus.systems"
};

export const homeHero: HeroContent = {
  chip: "Open-Source Provenact Control (Experimental)",
  title: "Verifiable execution substrate + control-plane API for immutable skills.",
  description:
    "Provenact is an execution substrate, not an agent framework. Use Provenact Control for verification-oriented APIs while core Provenact provides signing, policy checks, deterministic runtime contracts, and auditable receipts."
};

export const homeFeatures: FeatureItem[] = [
  {
    icon: "shield",
    title: "Deterministic Policy Enforcement",
    body: "Evaluate declared capabilities against explicit policy ceilings and return deterministic deny reasons for auditable control decisions."
  },
  {
    icon: "fingerprint",
    title: "Cryptographic Verification Surface",
    body: "Validate manifests, receipts, registry entries, and hashes through explicit endpoints backed by verifier primitives."
  },
  {
    icon: "users",
    title: "Narrow Trust Boundaries",
    body: "Keep control-plane logic separate from runtime trust boundaries and integrate only the verification surfaces you need."
  }
];

export const productSuite: FeatureItem[] = [
  {
    icon: "shield",
    title: "Provenact Control",
    body: "Experimental control-plane scaffold with package/context APIs and verification endpoints."
  },
  {
    icon: "workflow",
    title: "Provenact Verifier + Runtime",
    body: "Core verification libraries and runtime rules for deterministic, policy-constrained execution."
  },
  {
    icon: "fingerprint",
    title: "CLI Toolchain",
    body: "Pack, sign, verify, inspect, and run workflows with trust-anchor pinning and receipt requirements."
  },
  {
    icon: "rocket",
    title: "Spec + Conformance",
    body: "Normative schemas, threat model, compatibility policy, and test vectors for implementation assurance."
  }
];

export const platformFaqs: FaqItem[] = [
  {
    question: "Can we deploy in our own cloud?",
    answer: "Yes. The control-plane service and web frontend are self-hostable and can run behind your existing edge, auth, and logging controls."
  },
  {
    question: "Is the platform API-first?",
    answer: "Yes. Endpoints are documented in OpenAPI and map to explicit verification or control-plane operations."
  },
  {
    question: "Does this work for regulated environments?",
    answer: "It is designed for explicit capability controls and auditable receipts. You should validate controls against your own regulatory obligations before production adoption."
  }
];

export const featureBlocks = [
  {
    title: "Verification Contract",
    bullets: [
      "Manifest, receipt, and registry-entry verification endpoints",
      "Explicit request/response schemas in OpenAPI",
      "Deterministic failure modes for invalid inputs"
    ]
  },
  {
    title: "Control-Plane Surface",
    bullets: [
      "Owner-scoped package CRUD + version publishing",
      "Context lifecycle and append-only operational logs",
      "Server-rendered authenticated console over API primitives"
    ]
  },
  {
    title: "Operational Constraints",
    bullets: [
      "Health endpoint at /healthz",
      "Experimental status of control-plane scaffold",
      "No managed cloud SLA declared in the current repository"
    ]
  }
];

export const pricingTiers: PricingTier[] = [
  {
    name: "Open Source",
    price: "$0",
    note: "Repository-first adoption",
    features: ["Self-host in your environment", "OpenAPI contract", "Use and modify under project license"]
  },
  {
    name: "Internal Pilot",
    price: "N/A",
    note: "Security-led validation phase",
    features: ["Threat model review", "Policy and key management hardening", "Operational runbook development"]
  },
  {
    name: "Production Rollout",
    price: "N/A",
    note: "Organization-defined controls",
    features: ["Your own authn/authz boundary", "Your own compliance mapping", "Your own support and SLA model"]
  }
];
