import Link from "next/link";
import { FaqSection } from "../components/sections/faq-section";
import { platformFaqs } from "../lib/site-content";

export default function Home() {
  return (
    <main className="page shell-stack">
      <section className="hero">
        <p className="chip">Provenact</p>
        <h1>Stop Guessing What Your Agents Really Did.</h1>
        <p className="lede">
          Verifiable, policy-bounded execution with auditable receipts for secure autonomous actions.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary" href="/docs#quickstart">
            Try the Quickstart
          </Link>
        </div>
        <p className="small">Provenact makes agent actions provable without replacing your existing agent stack.</p>
      </section>

      <section className="sticky-cta">
        <p>Ready to test verifiable execution?</p>
        <Link className="btn btn-primary" href="/docs#quickstart">
          Run a Verified Execution
        </Link>
      </section>

      <section className="card">
        <p className="chip">The Agent Problem</p>
        <h2>Where Provenact sits</h2>
        <div className="agent-problem-grid">
          <pre className="code-block agent-diagram">{`[Agent]
   |
   | proposes action
   v
[Provenact]
  - verify skill
  - enforce policy
  - constrain execution
  - emit receipt
   |
   v
[World]`}</pre>
          <div className="agent-problem-copy">
            <p>Agents never run arbitrary code.</p>
            <p>They can only invoke pre-approved, immutable skills.</p>
          </div>
        </div>
      </section>

      <section className="grid two-up">
        <article className="card">
          <p className="chip">Why You Should Care</p>
          <h3>When execution is opaque, security has no ground truth.</h3>
          <ul className="signal-list">
            <li>Ad-hoc execution paths and opaque scripts.</li>
            <li>Silent permission sprawl.</li>
            <li>Post-incident reconstruction from incomplete logs.</li>
            <li>Weak reproducibility of what actually ran.</li>
          </ul>
        </article>
        <article className="card">
          <p className="chip">Outcome</p>
          <h3>Agent execution becomes bounded and evidentiary.</h3>
          <ul className="signal-list">
            <li>Every action is bounded by explicit capabilities.</li>
            <li>Every execution is provable via cryptographic receipts.</li>
            <li>Every failure is deterministic and explainable.</li>
            <li>Runs can be replayed and audited with evidence.</li>
          </ul>
        </article>
      </section>

      <section className="grid three-up">
        <article className="card">
          <p className="chip">Prove What Ran</p>
          <h3>Receipts over logs</h3>
          <p>Generate cryptographic receipts tied to skill artifacts, inputs, and policy outcomes.</p>
        </article>
        <article className="card">
          <p className="chip">Prevent Over-Reach</p>
          <h3>Explicit capability ceilings</h3>
          <p>Block undeclared or disallowed actions before execution starts.</p>
        </article>
        <article className="card">
          <p className="chip">Audit With Confidence</p>
          <h3>Deterministic failure semantics</h3>
          <p>Replace ambiguous incident narratives with reproducible verification evidence.</p>
        </article>
      </section>

      <section className="card trust-signals">
        <p className="chip">Trust Signals</p>
        <h2>Security engineers can verify claims directly.</h2>
        <ul className="signal-list">
          <li>Open-source repository with inspectable code and OpenAPI contract.</li>
          <li>v0.1 baseline released with explicit stability notes.</li>
          <li>Conformance vectors and receipt verification workflows in-repo.</li>
          <li>Threat model and compatibility policy documented in core repo.</li>
        </ul>
      </section>

      <section className="card trust-signals">
        <p className="chip">What Provenact Is Not</p>
        <h2>A narrow trust boundary beats a wide promise.</h2>
        <ul className="signal-list">
          <li>Not an agent framework.</li>
          <li>Not a scheduler or orchestrator.</li>
          <li>Not a model runtime.</li>
          <li>Not a blockchain.</li>
          <li>Not a centralized execution platform.</li>
        </ul>
        <div className="cta-row">
          <Link href="/docs#quickstart" className="btn btn-primary">
            Run Quickstart
          </Link>
          <Link href="/security" className="btn btn-secondary">
            Review Security
          </Link>
        </div>
      </section>

      <section className="card">
        <p className="chip">Next Step</p>
        <h2>Run one skill, verify one receipt, and inspect the evidence yourself.</h2>
        <div className="cta-row">
          <Link href="/docs#quickstart" className="btn btn-primary">
            Start Quickstart
          </Link>
        </div>
      </section>

      <FaqSection title="Common Questions" items={platformFaqs} />
    </main>
  );
}
