import { HeroSection } from "../../../components/sections/hero-section";

export default function PrivacyPage() {
  return (
    <main className="page shell-stack">
      <HeroSection
        content={{
          chip: "Privacy",
          title: "Privacy Policy",
          description:
            "Effective date: February 6, 2026. Baseline policy for the open-source project; replace with counsel-approved terms for production deployments."
        }}
      />

      <section className="grid two-up">
        <article className="card">
          <h2>Data We Process</h2>
          <p>
            The project can process account identifiers, service configuration, verification payloads, and operational
            logs required to operate control-plane APIs.
          </p>
        </article>
        <article className="card">
          <h2>How We Use Data</h2>
          <p>
            Data is used to provide API functionality, enforce security controls, troubleshoot incidents, and support
            auditability. This project does not include a managed cloud data-processing commitment by default.
          </p>
        </article>
      </section>

      <section className="card">
        <h2>Retention and Requests</h2>
        <p>
          We retain customer data according to contractual terms and statutory requirements. Data access and deletion
          requests may be sent to support@provenact.example.
        </p>
      </section>
    </main>
  );
}
