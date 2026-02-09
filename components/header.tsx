import Link from "next/link";

const nav = [
  { href: "/#products", label: "Products" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/security", label: "Security" },
  { href: "/docs", label: "Docs" },
  { href: "https://github.com/opertus-systems/provenact-control-web", label: "Web Repo", external: true },
  { href: "https://github.com/opertus-systems/provenact-control", label: "API Repo", external: true },
  {
    href: "https://github.com/opertus-systems/provenact-control/blob/main/openapi.yaml",
    label: "API Spec",
    external: true
  }
];

export function Header() {
  return (
    <header className="site-header">
      <div className="shell">
        <div className="header-row">
          <Link href="/" className="brand">
            Provenact Control
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {nav.map((item) => (
              item.external ? (
                <a key={item.href} href={item.href} className="nav-link" target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              )
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/contact" className="btn btn-secondary">
              Contact
            </Link>
            <a
              className="btn btn-primary"
              href="https://github.com/opertus-systems/provenact-control-web"
              target="_blank"
              rel="noreferrer"
            >
              Inspect Source
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
