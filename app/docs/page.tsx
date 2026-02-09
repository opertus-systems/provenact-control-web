"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_PROVENACT_API_BASE_URL ?? "http://localhost:8080";
const proxyBase = "/api/openapi/proxy";
const openApiSpecUrl = "/openapi.yaml";
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <p className="small">Loading interactive API reference...</p>
});

const defaults = {
  hash: `{
  "payload": "hello provenact"
}`,
  manifest: `{
  "manifest": {
    "name": "echo.minimal",
    "version": "0.1.0",
    "entrypoint": "run",
    "artifact": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "capabilities": [],
    "signers": ["alice.dev"]
  },
  "policy": {
    "version": 1,
    "trusted_signers": ["alice.dev", "opertus.systems"],
    "capability_ceiling": {
      "fs": {
        "read": ["/data", "/opt/provenact/public"],
        "write": ["/tmp"]
      },
      "net": ["https://api.open-meteo.com", "https://api.github.com"],
      "env": ["HOME", "PATH"],
      "exec": false,
      "time": false
    }
  }
}`,
  receipt: `{
  "receipt": {
    "artifact": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "inputs_hash": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "outputs_hash": "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    "caps_used": ["env:HOME"],
    "timestamp": 1738600999,
    "receipt_hash": "sha256:ba1b6579a010096532ca31c2680f7345bda8beb5dd290a427d101e3b584c50e7"
  }
}`
};

type EndpointState = {
  body: string;
  loading: boolean;
  result: string;
};

export default function DocsPage() {
  const [hash, setHash] = useState<EndpointState>({ body: defaults.hash, loading: false, result: "" });
  const [manifest, setManifest] = useState<EndpointState>({
    body: defaults.manifest,
    loading: false,
    result: ""
  });
  const [receipt, setReceipt] = useState<EndpointState>({
    body: defaults.receipt,
    loading: false,
    result: ""
  });
  const [cloneCopied, setCloneCopied] = useState(false);
  const [openApiSpec, setOpenApiSpec] = useState("// Loading openapi.yaml...");

  useEffect(() => {
    let cancelled = false;

    async function loadOpenApiSpec() {
      try {
        const response = await fetch(openApiSpecUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const spec = await response.text();
        if (!cancelled) {
          setOpenApiSpec(spec);
        }
      } catch (error) {
        if (!cancelled) {
          setOpenApiSpec(`// Failed to load openapi.yaml: ${(error as Error).message}`);
        }
      }
    }

    loadOpenApiSpec();
    return () => {
      cancelled = true;
    };
  }, []);

  function mapSwaggerRequestToProxy(request: { url: string }) {
    if (request.url.endsWith("/openapi.yaml") || request.url === "/openapi.yaml") {
      return request;
    }

    try {
      const requestUrl = new URL(request.url);
      if (requestUrl.pathname === "/openapi.yaml") {
        return request;
      }
      request.url = `${proxyBase}${requestUrl.pathname}${requestUrl.search}`;
    } catch {
      if (request.url.startsWith("/")) {
        request.url = `${proxyBase}${request.url}`;
      }
    }
    return request;
  }

  async function submit(
    event: FormEvent,
    path: string,
    state: EndpointState,
    setState: (next: EndpointState) => void
  ) {
    event.preventDefault();
    setState({ ...state, loading: true, result: "" });

    let parsed: unknown;
    try {
      parsed = JSON.parse(state.body);
    } catch (error) {
      setState({
        ...state,
        loading: false,
        result: `Invalid JSON: ${(error as Error).message}`
      });
      return;
    }

    try {
      const response = await fetch(`${proxyBase}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
      setState({
        ...state,
        loading: false,
        result: JSON.stringify(
          {
            status: response.status,
            body: payload
          },
          null,
          2
        )
      });
    } catch (error) {
      setState({
        ...state,
        loading: false,
        result: `Request failed: ${(error as Error).message}`
      });
    }
  }

  return (
    <main className="page shell-stack">
      <section className="hero">
        <p className="chip">Docs</p>
        <h1>Provenact Control Plane Docs</h1>
        <p className="lede">
          API contract: <code>openapi.yaml</code>. This interface is designed for deterministic verification and
          auditable outcomes, with explicit request and response schemas for each endpoint.
        </p>
        <p className="small">
          API base: <code>{apiBase}</code>
        </p>
        <div className="cta-row">
          <a
            className="btn btn-secondary"
            href="https://github.com/opertus-systems/provenact-control-web"
            target="_blank"
            rel="noreferrer"
          >
            Web Repo
          </a>
          <a className="btn btn-secondary" href="https://github.com/opertus-systems/provenact-control" target="_blank" rel="noreferrer">
            API Repo
          </a>
          <a
            className="btn btn-secondary"
            href="https://github.com/opertus-systems/provenact-control/blob/main/openapi.yaml"
            target="_blank"
            rel="noreferrer"
          >
            OpenAPI Spec
          </a>
          <a
            className="btn btn-secondary"
            href="https://github.com/opertus-systems/provenact-control/tree/main/examples"
            target="_blank"
            rel="noreferrer"
          >
            Example Payloads
          </a>
        </div>
      </section>

      <section className="card" id="quickstart">
        <div className="quickstart-head">
          <p className="chip">Quickstart</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              await navigator.clipboard.writeText("https://github.com/opertus-systems/provenact-control.git");
              setCloneCopied(true);
              setTimeout(() => setCloneCopied(false), 1500);
            }}
          >
            {cloneCopied ? "Copied Clone URL" : "Copy Clone URL"}
          </button>
        </div>
        <h2>Run a verification-focused API check in 4 steps.</h2>
        <p>
          Start from a clean clone, run the API, then run one command that executes all baseline checks. The command
          exits non-zero on the first failure.
        </p>
        <pre className="code-block">{`# Step 0: clone and install
git clone https://github.com/opertus-systems/provenact-control-web.git
cd provenact-control-web
npm install

# Terminal 1: start API
git clone https://github.com/opertus-systems/provenact-control.git ../provenact-control
cd ../provenact-control
cargo run -p provenact-control --features web --bin provenact-control-web

# Terminal 2: run baseline checks
cd ../provenact-control-web
API_BASE="${apiBase}" npm run quickstart:check`}</pre>
        <div className="grid two-up">
          <article>
            <h3>1. Confirm API is up</h3>
            <pre className="code-block">{`curl -s "$API_BASE/healthz"`}</pre>
          </article>
          <article>
            <h3>2. Hash a payload</h3>
            <pre className="code-block">{`curl -s -X POST "$API_BASE/v1/hash/sha256" \\
  -H "content-type: application/json" \\
  -d '{"payload":"hello provenact"}'`}</pre>
          </article>
          <article>
            <h3>3. Verify a manifest</h3>
            <pre className="code-block">{`curl -s -X POST "$API_BASE/v1/verify/manifest" \\
  -H "content-type: application/json" \\
  -d @examples/verify-manifest-request.json`}</pre>
          </article>
          <article>
            <h3>4. Verify a receipt</h3>
            <pre className="code-block">{`curl -s -X POST "$API_BASE/v1/verify/receipt" \\
  -H "content-type: application/json" \\
  -d @examples/verify-receipt-request.json`}</pre>
          </article>
          <article>
            <h3>Script source</h3>
            <pre className="code-block">{`scripts/quickstart-check.sh`}</pre>
          </article>
        </div>
      </section>

      <section className="grid two-up">
        <article className="card">
          <h2>Security boundary model</h2>
          <p>
            Local examples can run without auth for testing, but production deployments should enforce TLS termination,
            API authentication, tenant authorization, and rate controls at the edge before forwarding requests.
          </p>
          <p>
            Keep signing keys and trust-anchor material outside this service boundary, and pass only data required for
            verification and policy decisions.
          </p>
        </article>
        <article className="card">
          <h2>Determinism and failure semantics</h2>
          <p>
            Validation failures return structured JSON errors and deterministic deny reasons. Treat non-2xx responses
            as explicit control outcomes and retain response payloads for audit and incident reconstruction.
          </p>
          <p>Use request IDs and structured logs to correlate policy evaluations with downstream runtime events.</p>
        </article>
      </section>

      <section className="card">
        <h2>Interactive API Reference</h2>
        <p>
          Includes endpoint notes from OpenAPI and supports live demo calls via <code>Try it out</code> through a
          same-origin proxy.
        </p>
        <div className="swagger-shell">
          <SwaggerUI
            url={openApiSpecUrl}
            docExpansion="list"
            defaultModelsExpandDepth={-1}
            deepLinking
            requestInterceptor={mapSwaggerRequestToProxy}
          />
        </div>
      </section>

      <section className="card">
        <h2>OpenAPI Spec (Raw YAML)</h2>
        <p>Rendered from the repository OpenAPI document for direct copy/paste and contract inspection.</p>
        <details className="yaml-drawer">
          <summary>Show raw YAML</summary>
          <pre className="result">{openApiSpec}</pre>
        </details>
      </section>

      <section className="grid">
        <article className="card">
          <h2>POST /v1/hash/sha256</h2>
          <form onSubmit={(event) => submit(event, "/v1/hash/sha256", hash, setHash)} className="play-form">
            <textarea
              value={hash.body}
              onChange={(event) => setHash({ ...hash, body: event.target.value })}
              spellCheck={false}
              rows={8}
            />
            <button type="submit" className="btn btn-primary" disabled={hash.loading}>
              {hash.loading ? "Running..." : "Send Request"}
            </button>
          </form>
          <pre className="result">{hash.result || "// response appears here"}</pre>
        </article>

        <article className="card">
          <h2>POST /v1/verify/manifest</h2>
          <form
            onSubmit={(event) => submit(event, "/v1/verify/manifest", manifest, setManifest)}
            className="play-form"
          >
            <textarea
              value={manifest.body}
              onChange={(event) => setManifest({ ...manifest, body: event.target.value })}
              spellCheck={false}
              rows={14}
            />
            <button type="submit" className="btn btn-primary" disabled={manifest.loading}>
              {manifest.loading ? "Running..." : "Send Request"}
            </button>
          </form>
          <pre className="result">{manifest.result || "// response appears here"}</pre>
        </article>

        <article className="card">
          <h2>POST /v1/verify/receipt</h2>
          <form onSubmit={(event) => submit(event, "/v1/verify/receipt", receipt, setReceipt)} className="play-form">
            <textarea
              value={receipt.body}
              onChange={(event) => setReceipt({ ...receipt, body: event.target.value })}
              spellCheck={false}
              rows={10}
            />
            <button type="submit" className="btn btn-primary" disabled={receipt.loading}>
              {receipt.loading ? "Running..." : "Send Request"}
            </button>
          </form>
          <pre className="result">{receipt.result || "// response appears here"}</pre>
        </article>
      </section>
    </main>
  );
}
