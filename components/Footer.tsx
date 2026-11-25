import Link from "next/link";
import { PhoneCall } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-semibold">Indic Scam Shield</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            A portfolio project by Aman Nanda. Stateless by design: messages are analysed in memory and never stored.
          </p>
          <p className="mt-3 flex gap-4 text-sm text-muted">
            <a className="hover:text-fg" href="https://github.com/amannanda-22/Indic-Scam-Shield" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="hover:text-fg" href="https://linkedin.com/in/nanda-aman" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </p>
        </div>
        <div className="text-sm">
          <p className="hud-label mb-3">Explore</p>
          <ul className="space-y-2 text-muted">
            <li><Link className="hover:text-fg" href="/analyze">Analyzer</Link></li>
            <li><Link className="hover:text-fg" href="/live">Live system</Link></li>
            <li><Link className="hover:text-fg" href="/benchmark">Honest benchmark</Link></li>
            <li><Link className="hover:text-fg" href="/architecture">Architecture &amp; tech stack</Link></li>
          </ul>
        </div>
        <div className="rounded-2xl border border-danger/30 bg-danger/[0.06] p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-danger">
            <PhoneCall className="h-4 w-4" aria-hidden /> Already lost money?
          </p>
          <p className="mt-2 text-muted">
            Call <span className="font-mono text-fg">1930</span> immediately and report on{" "}
            <a className="text-cyan underline-offset-2 hover:underline" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
              cybercrime.gov.in
            </a>
            . Speed matters.
          </p>
        </div>
      </div>
      <p className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        Screening aid only - it can be wrong and is not legal or financial advice. Advisories are paraphrased; verify at the official sources linked on each card.
      </p>
    </footer>
  );
}
