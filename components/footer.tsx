import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <p className="footer-title">Provenact Control</p>
          <p className="footer-copy">
            Experimental control-plane scaffold for core Provenact verification and execution workflows.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/security">Security</Link>
          <Link href="/contact">Contact</Link>
          <a href="https://github.com/opertus-systems/provenact-control-web" target="_blank" rel="noreferrer">
            Web Repo
          </a>
          <a href="https://github.com/opertus-systems/provenact-control" target="_blank" rel="noreferrer">
            API Repo
          </a>
          <a
            href="https://github.com/opertus-systems/provenact-control/blob/main/openapi.yaml"
            target="_blank"
            rel="noreferrer"
          >
            API Spec
          </a>
          <Link href="/docs#quickstart">Quickstart</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
