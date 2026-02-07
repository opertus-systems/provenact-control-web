import { HeroSection } from "../../components/sections/hero-section";

export default function SecurityPage() {
  return (
    <main className="page shell-stack">
      <HeroSection
        content={{
          chip: "Security",
          title: "Security controls mapped to concrete implementation artifacts.",
          description:
            "Use this page as an evidence index. Each control domain points to repository documents or contracts you can inspect directly."
        }}
      />

      <section className="card">
        <p className="chip">Controls Matrix</p>
        <h2>Control objectives, implementation, and evidence</h2>
        <div className="controls-matrix">
          <div className="controls-row controls-head">
            <p>Control domain</p>
            <p>Implementation expectation</p>
            <p>Evidence artifact</p>
          </div>
          <div className="controls-row">
            <p>Trust boundary definition</p>
            <p>Execution substrate scope is explicit; avoid orchestration or model-runtime ambiguity.</p>
            <p>
              <a href="https://github.com/opertus-systems/inactu-cli/blob/main/README.md" target="_blank" rel="noreferrer">
                inactu-cli/README.md
              </a>
            </p>
          </div>
          <div className="controls-row">
            <p>API contract integrity</p>
            <p>Endpoints and schemas are explicit and versioned; no undocumented behaviors.</p>
            <p>
              <a href="https://github.com/opertus-systems/inactu-control/blob/main/openapi.yaml" target="_blank" rel="noreferrer">
                openapi.yaml
              </a>
            </p>
          </div>
          <div className="controls-row">
            <p>Web surface governance</p>
            <p>Web console changes are gated by CI, security checks, and repository policies.</p>
            <p>
              <a href="https://github.com/opertus-systems/inactu-control-web" target="_blank" rel="noreferrer">
                inactu-control-web
              </a>
            </p>
          </div>
          <div className="controls-row">
            <p>Cryptographic verification</p>
            <p>Manifest and receipt verification paths are deterministic and testable.</p>
            <p>
              <a href="https://github.com/opertus-systems/inactu-cli/blob/main/docs/getting-started.md" target="_blank" rel="noreferrer">
                inactu-cli/docs/getting-started.md
              </a>
            </p>
          </div>
          <div className="controls-row">
            <p>Compatibility governance</p>
            <p>Schema and behavior changes follow explicit compatibility policy.</p>
            <p>
              <a
                href="https://github.com/opertus-systems/inactu-spec/blob/main/docs/versioning-policy.md"
                target="_blank"
                rel="noreferrer"
              >
                inactu-spec/docs/versioning-policy.md
              </a>
            </p>
          </div>
          <div className="controls-row">
            <p>Threat-model alignment</p>
            <p>Assumptions and non-goals are documented before production adoption.</p>
            <p>
              <a href="https://github.com/opertus-systems/inactu-cli/blob/main/spec/threat-model.md" target="_blank" rel="noreferrer">
                inactu-cli/spec/threat-model.md
              </a>
            </p>
          </div>
          <div className="controls-row">
            <p>Conformance assurance</p>
            <p>Release gates include vector-driven conformance and verification checks.</p>
            <p>
              <a href="https://github.com/opertus-systems/inactu-spec/blob/main/spec/conformance.md" target="_blank" rel="noreferrer">
                inactu-spec/spec/conformance.md
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="grid two-up">
        <article className="card">
          <h2>Operational hardening checklist</h2>
          <ul className="signal-list">
            <li>Terminate TLS at the edge and enforce authn/authz before forwarding to the API.</li>
            <li>Keep signing keys and trust-anchor material in managed KMS/HSM, outside the service process.</li>
            <li>Treat all inbound payloads as untrusted with strict schema and size controls.</li>
            <li>Capture request IDs and deterministic error payloads for incident reconstruction.</li>
          </ul>
        </article>

        <article className="card">
          <h2>Evidence-first review flow</h2>
          <ul className="signal-list">
            <li>Run quickstart checks and verify endpoint determinism.</li>
            <li>Review threat model and compatibility policies against your risk register.</li>
            <li>Validate key lifecycle, IAM boundaries, and logging retention controls.</li>
            <li>Gate rollout on reproducible conformance checks in CI/CD.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
