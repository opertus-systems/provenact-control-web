import { HeroSection } from "../../components/sections/hero-section";

export default function AboutPage() {
  return (
    <main className="page shell-stack">
      <HeroSection
        content={{
          chip: "About",
          title: "Built for verifiable execution with explicit trust boundaries.",
          description:
            "Provenact Control is an experimental scaffold around core Provenact verification and runtime primitives, designed for teams that prioritize evidence over claims."
        }}
      />

      <section className="grid two-up">
        <article className="card">
          <h2>Mission</h2>
          <p>
            Provide a narrow, inspectable surface for manifest/receipt validation and control-plane workflows while
            preserving core runtime trust boundaries.
          </p>
        </article>
        <article className="card">
          <h2>Approach</h2>
          <p>
            Treat OpenAPI, schemas, and deterministic failure modes as first-class interfaces so security engineering,
            platform, and development teams can reason about behavior before adoption.
          </p>
        </article>
      </section>
    </main>
  );
}
