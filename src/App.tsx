import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Validator } from "./components/Validator";
import { SupportedProviders } from "./components/SupportedProviders";
import { PROVIDERS } from "@/lib/providers";

export function App() {
  useEffect(() => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.warning("This page is not on a secure origin. Do not paste real keys.");
    }
  }, []);

  return (
    <>
      <div className="min-h-[100dvh] flex flex-col relative overflow-hidden">
        <BackdropGlow />
        <Header />
        <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 sm:py-16 space-y-12 relative">
          <Hero />
          <Validator />
          <div id="providers" className="scroll-mt-16"><SupportedProviders /></div>
        </main>
        <Footer />
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}

function BackdropGlow() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{
          background:
            "radial-gradient(50% 80% at 50% 0%, color-mix(in oklch, var(--color-accent), transparent 82%) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </>
  );
}

function Header() {
  return (
    <header className="border-b border-[var(--color-border)] relative">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_14px_var(--color-accent)]" aria-hidden />
          <span className="font-medium tracking-tight">akv</span>
          <span className="text-[var(--color-text-mute)] text-sm hidden sm:inline">
            / AI Key Validator
          </span>
        </div>
        <a
          href="#providers"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("providers")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors mono"
        >
          {PROVIDERS.length} providers ↓
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 pt-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border-hi)] bg-[var(--color-surface)]/70 backdrop-blur text-[11px] text-[var(--color-text-dim)] mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
        real-time · no signup · zero storage
      </div>
      <h1 className="text-[2.75rem] sm:text-[3.75rem] font-medium tracking-[-0.035em] leading-[1] pb-1">
        Validate AI API keys
        <br />
        <span className="text-[var(--color-text-dim)] italic font-normal" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>
          against every provider that matters.
        </span>
      </h1>
      <p className="text-sm sm:text-base text-[var(--color-text-dim)] max-w-xl leading-relaxed">
        Paste one key or five hundred. We ping each provider's auth endpoint and return the raw result in seconds. From a GitHub Actions runner you control.
      </p>
    </div>
  );
}


function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-16">
      <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-[var(--color-text-mute)] flex flex-wrap gap-4 justify-between">
        <span>Keys go directly from your browser to your own GitHub Actions runner. No third-party backend.</span>
        <span className="mono">v2.0.0</span>
      </div>
    </footer>
  );
}
