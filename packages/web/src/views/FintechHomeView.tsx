import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { LOGIN_REDIRECT_URL } from '@/helpers/HelperConstants';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  Server,
  GitBranch,
  Clock,
  Shield,
  Database,
  Code2,
  CheckCircle,
  Globe,
  Cpu,
  BookOpen,
  Terminal,
  Zap,
} from 'lucide-react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const pushGA = (event: string) => {
  if (window.dataLayer) {
    window.dataLayer.push({ event });
  }
};

const APP_ENTRY_ROUTE = '/home';

// ---------------------------------------------------------------------------
// Static workflow preview placeholder
// Replace this component with cyoda_workflow_editor in the next phase.
// ---------------------------------------------------------------------------
const WorkflowEditorPreviewPlaceholder: React.FC = () => {
  const states = [
    { id: 'received', label: 'RECEIVED', color: 'bg-slate-100 text-slate-600 border-slate-300' },
    { id: 'validated', label: 'VALIDATED', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'matched', label: 'MATCHED', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'settled', label: 'SETTLED', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  const historyEntries = [
    { ts: '09:00:01', state: 'RECEIVED', note: 'Trade submitted via API' },
    { ts: '09:00:03', state: 'VALIDATED', note: 'Counterparty verified' },
    { ts: '09:00:07', state: 'MATCHED', note: 'Matched against open order' },
    { ts: '09:00:11', state: 'SETTLED', note: 'Settlement confirmed' },
  ];

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden"
      role="img"
      aria-label="Trade settlement workflow — entity lifecycle states, transitions, and history log"
    >
      {/* Window chrome */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="ml-2 text-xs text-slate-500 font-mono">trade-settlement · lifecycle</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Cyoda Cloud</span>
      </div>

      <div className="p-5">
        {/* Entity model header */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 font-mono mb-1">entity model</p>
          <p className="text-sm font-semibold text-slate-800">TradeSettlement</p>
        </div>

        {/* State nodes */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 font-mono mb-2">lifecycle states</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {states.map((s, i) => (
              <React.Fragment key={s.id}>
                <span className={`px-2.5 py-1 rounded border text-xs font-mono font-medium ${s.color}`}>
                  {s.label}
                </span>
                {i < states.length - 1 && (
                  <ArrowRight size={12} className="text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Transitions */}
        <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
          <p className="text-xs text-slate-400 font-mono mb-2">valid transitions</p>
          <div className="space-y-1.5 text-xs font-mono text-slate-600">
            {[
              'RECEIVED → VALIDATED   (validate)',
              'VALIDATED → MATCHED    (match)',
              'MATCHED → SETTLED      (settle)',
              'MATCHED → FAILED       (fail)',
            ].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <Zap size={10} className="text-blue-400 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History log */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={11} className="text-slate-400" />
            <p className="text-xs text-slate-400 font-mono">state history</p>
          </div>
          <div className="space-y-1.5">
            {historyEntries.map((e) => (
              <div key={e.ts} className="flex items-start gap-2 text-xs">
                <span className="font-mono text-slate-400 shrink-0 w-14">{e.ts}</span>
                <span className="font-mono text-slate-600 shrink-0 w-20">{e.state}</span>
                <span className="text-slate-500">{e.note}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
          Every transition enforced and recorded by the Cyoda runtime.
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FAQ data — 14 items per spec
// ---------------------------------------------------------------------------
const faqs = [
  {
    q: 'Is Cyoda Cloud production-ready?',
    a: 'No. Cyoda Cloud is currently a live beta and free to try. It is intended for development, evaluation, and prototyping, not production workloads requiring uptime guarantees, backups, or SLA-backed support.',
  },
  {
    q: 'Is Cyoda Cloud free?',
    a: 'Yes. Cyoda Cloud is free to try in live beta for development, evaluation, and prototyping.',
  },
  {
    q: 'What are the free tier limits?',
    a: 'The free tier is available for developer evaluation and prototyping. Current reference limits include 20 models, 150 fields per model, 300 cumulative fields, one client node, 5 MB payloads, 2 GB disk usage, 300 API requests per minute, and 300 external calls per minute. Free tier environments are automatically reset after an expiry period. Your account\'s current limits are authoritative in the Cyoda Cloud API.',
  },
  {
    q: 'Is the free tier backed up?',
    a: 'The free beta does not include guaranteed backup or data retention commitments.',
  },
  {
    q: 'Where is Cyoda Cloud hosted?',
    a: 'Cyoda Cloud is hosted in Finland in a Hetzner ISO-certified data centre.',
  },
  {
    q: 'Is my data encrypted?',
    a: 'Data is encrypted in transit. Storage is protected with encrypted hard drives. The free beta does not provide a production SLA or guaranteed backup/retention commitments.',
  },
  {
    q: 'Is my data used to train AI models?',
    a: 'No. Customer data submitted to Cyoda Cloud is not used to train AI models.',
  },
  {
    q: 'Can Cyoda staff access my environment?',
    a: 'Access is restricted, logged, and monitored. Break-glass access may be used for operational support where required.',
  },
  {
    q: 'How does Cyoda Cloud authentication work?',
    a: 'Cyoda Cloud uses JWT-based authentication. Users and technical clients can authenticate through Cyoda-managed identity flows or trusted OIDC providers, depending on the environment. Access to platform features is bounded by the account subscription tier and entitlements.',
  },
  {
    q: 'Can I move from Cyoda Cloud to self-hosted or Enterprise Cyoda?',
    a: 'Yes. The same entity models, lifecycle definitions, and API work across Cyoda Cloud, the open-source runtime, and Enterprise Cyoda. You can move between deployment options without rewriting your application.',
  },
  {
    q: 'What is the difference between Cyoda Cloud, open-source Cyoda, and Enterprise Cyoda?',
    a: 'Cyoda Cloud is the hosted free-to-try runtime in live beta, suitable for development and evaluation. The open-source Cyoda runtime is available under Apache 2.0 for self-hosted use. Enterprise Cyoda adds production deployment options, SLA-backed support, and horizontal scalability.',
  },
  {
    q: 'What does the AI assistant do?',
    a: 'The AI assistant helps you draft entity models, generate workflow JSON, edit existing workflows, explain invalid transitions, and generate service code in Python or Java. It accelerates modelling and development. Direct import of generated workflows into the runtime is not currently supported.',
  },
  {
    q: 'Does the AI assistant replace the runtime?',
    a: 'No. The AI assistant accelerates modelling, but Cyoda remains the deterministic runtime that enforces valid state transitions and records history.',
  },
  {
    q: 'Which languages does the AI assistant support?',
    a: 'The AI assistant currently generates service code in Python and Java.',
  },
];

// ---------------------------------------------------------------------------
// FAQ accordion item
// ---------------------------------------------------------------------------
const FAQItem: React.FC<{ question: string; answer: string; index: number }> = ({
  question,
  answer,
  index,
}) => {
  const [open, setOpen] = useState(false);
  const id = `faq-${index}`;
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
        className="faq-question w-full flex items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors bg-transparent cursor-pointer"
        style={{ color: '#0f172a' }}
      >
        <span style={{ color: 'inherit' }}>{question}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-slate-500" style={{ color: '#64748b' }} />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-500" style={{ color: '#64748b' }} />
        )}
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-btn`}
          className="faq-answer pb-5 text-sm text-slate-700 leading-7"
          style={{ color: '#334155' }}
        >
          {answer}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main landing page component
// ---------------------------------------------------------------------------
const FintechHomeView: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  // During Auth0 callback or while auth state resolves, show a neutral loading
  // screen instead of the marketing page to avoid a visible flash.
  if (isLoading || isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <img src="/cyoda.svg" alt="Cyoda" className="h-8 mb-4" />
        <p className="text-sm text-slate-500">Opening Cyoda Cloud…</p>
      </div>
    );
  }

  const handleOpenCyodaCloud = async (
    event?: React.MouseEvent<HTMLElement>,
    source = 'unknown CTA'
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    console.log('[CyodaCloud CTA] clicked', {
      source,
      isAuthenticated,
      isLoading,
      pathname: window.location.pathname,
    });

    if (isLoading) {
      console.log('[CyodaCloud CTA] auth still loading; ignoring click');
      return;
    }

    if (isAuthenticated) {
      console.log('[CyodaCloud CTA] authenticated; navigating to /home');
      navigate(APP_ENTRY_ROUTE);
      return;
    }

    try {
      localStorage.setItem(LOGIN_REDIRECT_URL, APP_ENTRY_ROUTE);
      localStorage.setItem('LOGIN_REDIRECT_URL', APP_ENTRY_ROUTE);
    } catch (error) {
      console.error('[CyodaCloud CTA] failed to store return target', error);
    }

    try {
      console.log('[CyodaCloud CTA] unauthenticated; starting Auth0 login');
      await loginWithRedirect({
        appState: { returnTo: APP_ENTRY_ROUTE },
      });
    } catch (error) {
      console.error('[CyodaCloud CTA] loginWithRedirect failed', error);
    }
  };

  return (
    <div className="cyoda-cloud-page" style={{ color: '#0f172a' }}>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:border focus:border-slate-300 focus:px-4 focus:py-2 focus:rounded-md focus:text-blue-700 focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>

      {/* ── Public navigation ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand group — logo contains "CYODA"; adjacent text adds "Cloud" only */}
          <a
            href="/"
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Cyoda Cloud home"
          >
            <img src="/cyoda.svg" alt="Cyoda" className="h-6" />
            <span className="text-sm font-semibold text-slate-900">Cloud</span>
          </a>

          {/* Desktop nav links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
            <a
              href="https://docs.cyoda.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => pushGA('docs_click')}
            >
              Docs
            </a>
            <a
              href="https://github.com/Cyoda-platform/cyoda-go"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => pushGA('github_click')}
            >
              GitHub
            </a>
            <a
              href="https://cyoda.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => pushGA('open_source_click')}
            >
              Open Source
            </a>
            <a
              href="https://cyoda.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => pushGA('enterprise_click')}
            >
              Enterprise
            </a>
          </nav>

          {/* Auth CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={(event) => handleOpenCyodaCloud(event, 'header open app')}
                disabled={isLoading}
                className="text-sm font-medium px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Open Cyoda Cloud
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    pushGA('sign_in_click');
                    handleOpenCyodaCloud(event, 'header sign in');
                  }}
                  disabled={isLoading}
                  className="hidden sm:block text-sm font-semibold border border-slate-400 hover:border-slate-600 bg-white px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  style={{ color: '#1e293b' }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    pushGA('try_cyoda_cloud_free_click');
                    handleOpenCyodaCloud(event, 'header try free');
                  }}
                  disabled={isLoading}
                  className="text-sm font-medium px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  style={{ color: '#ffffff' }}
                >
                  Try Cyoda Cloud, free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main id="main-content">

        {/* ── Hero ── */}
        <section
          aria-labelledby="hero-heading"
          className="relative bg-white border-b border-slate-100 overflow-hidden"
        >
          {/* Background SVG — slightly more visible */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: 'url(/cyoda-cloud-hero-background.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
              opacity: 0.45,
            }}
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: copy */}
              <div>
                <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-4">
                  Live beta · Free to try
                </p>
                <h1
                  id="hero-heading"
                  className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 leading-tight mb-6"
                >
                  Host Cyoda for free while you build event-driven, stateful systems with history.
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  Cyoda Cloud is the hosted Cyoda runtime for developers building entity workflows,
                  lifecycle transitions, event-driven processing, and traceable state history. It is
                  free to try in live beta, with best-efforts support and no production SLA.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      pushGA('try_cyoda_cloud_free_click');
                      handleOpenCyodaCloud(event, 'hero try free');
                    }}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    style={{ color: '#ffffff' }}
                  >
                    Try Cyoda Cloud, free
                    <ArrowRight size={16} />
                  </button>
                  <a
                    href="https://cyoda.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    onClick={() => pushGA('open_source_click')}
                  >
                    Run Cyoda yourself
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Right: workflow editor preview placeholder */}
              {/* Replace with cyoda_workflow_editor in the next phase */}
              <div className="hidden lg:block">
                <WorkflowEditorPreviewPlaceholder />
              </div>
            </div>
          </div>
        </section>

        {/* ── Developer quick path ── */}
        <section aria-labelledby="quickstart-heading" className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <h2 id="quickstart-heading" className="text-lg font-semibold text-slate-900 mb-6">
              Start with the free beta
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: '01',
                  title: 'Create a free account',
                  desc: 'Sign up through Auth0. No credit card required. Your environment is provisioned automatically.',
                  cta: (
                    <button
                      type="button"
                      onClick={(event) => {
                        pushGA('try_cyoda_cloud_free_click');
                        handleOpenCyodaCloud(event, 'quickstart try free');
                      }}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      style={{ color: '#ffffff' }}
                    >
                      Try Cyoda Cloud, free
                      <ArrowRight size={13} />
                    </button>
                  ),
                },
                {
                  step: '02',
                  title: 'Define entity models',
                  desc: 'Use the hosted UI or API to define entity models, lifecycle states, and valid transitions. The AI assistant can draft models from a description.',
                  cta: (
                    <a
                      href="https://docs.cyoda.net/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => pushGA('docs_click')}
                    >
                      Read the docs <ExternalLink size={13} />
                    </a>
                  ),
                },
                {
                  step: '03',
                  title: 'Connect your compute',
                  desc: 'Attach Python or Java processors to handle transitions. Cyoda enforces valid state changes and records every transition with a full history trail.',
                  cta: (
                    <a
                      href="https://github.com/Cyoda-platform/cyoda-go"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => pushGA('github_click')}
                    >
                      View on GitHub <ExternalLink size={13} />
                    </a>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col"
                >
                  <span className="text-xs font-mono text-slate-500">{item.step}</span>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{item.desc}</p>
                  <div className="mt-4">{item.cta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What Cyoda Cloud is ── */}
        <section aria-labelledby="what-heading" className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">
                  How it works
                </p>
                <h2 id="what-heading" className="text-2xl font-bold text-slate-900 mb-4">
                  Every state transition is enforced and recorded.
                </h2>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Cyoda Cloud gives you a managed Cyoda environment without installing the runtime or
                  operating a cluster. Define entity models, enforce lifecycle transitions, connect
                  external compute, and inspect state history from the hosted UI and APIs.
                </p>
                <ul className="space-y-3 text-sm text-slate-600">
                  {[
                    { icon: GitBranch, text: 'Define lifecycle states and valid transitions per entity type' },
                    { icon: Shield, text: 'Invalid transitions rejected at the runtime, not the application layer' },
                    { icon: Clock, text: 'Full state history queryable from the API' },
                    { icon: Database, text: 'Connect external compute as event-driven processors' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <Icon size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Server, title: 'Hosted runtime', desc: 'Managed Cyoda environment without installing the runtime or operating a cluster.' },
                  { icon: Cpu, title: 'Lifecycle enforcement', desc: 'Entity model rules enforced at the runtime level on every state change.' },
                  { icon: Clock, title: 'Traceable history', desc: 'Every transition recorded with timestamps and context, queryable via API.' },
                  { icon: Globe, title: 'API-first', desc: 'Full platform surface accessible via the same Cyoda API across Cloud, self-hosted, and Enterprise.' },
                  { icon: Database, title: 'External compute', desc: 'Connect Python or Java processors to handle entity events and lifecycle transitions.' },
                  { icon: CheckCircle, title: 'Proven runtime', desc: 'Cyoda is proven in regulated markets and has been live since 2017.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                    <Icon size={18} className="text-blue-600 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── AI assistant ── */}
        <section aria-labelledby="ai-heading" className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">
                  Built-in feature
                </p>
                <h2 id="ai-heading" className="text-2xl font-bold text-slate-900 mb-4">
                  AI assistant
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  The built-in AI assistant helps you draft entity models, generate workflow JSON,
                  edit existing workflows, explain invalid transitions, and work with Java or Python
                  service patterns. The assistant accelerates modelling, but Cyoda remains the
                  deterministic runtime that enforces valid state transitions and records history.
                </p>
                <p className="text-sm text-slate-600">
                  The assistant is a feature of Cyoda Cloud, not a replacement for the runtime or
                  your application code.
                </p>
              </div>
              <div>
                <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-4">
                  What the assistant can do
                </p>
                <div className="space-y-3">
                  {[
                    'Draft entity models from a description',
                    'Generate workflow JSON for lifecycle definitions',
                    'Edit existing workflows and explain invalid transitions',
                    'Generate service processors in Python or Java',
                    'Run tests against generated code',
                  ].map((cap) => (
                    <div key={cap} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle size={15} className="text-blue-600 mt-0.5 shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
                  <Code2 size={12} className="inline mr-1.5 text-slate-500" />
                  Currently supports Python and Java service generation. Direct import of generated
                  workflows into the runtime is a planned feature.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Three ways to use Cyoda ── */}
        <section aria-labelledby="ways-heading" className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <h2 id="ways-heading" className="text-2xl font-bold text-slate-900 mb-2">
              Three ways to use Cyoda
            </h2>
            <p className="text-slate-600 mb-8 text-sm">
              The same entity models, lifecycle definitions, and API work across all three. You can
              move between deployment options without rewriting your application.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {/* Run it yourself */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col">
                <Terminal size={20} className="text-slate-600 mb-4" />
                <h3 className="text-base font-semibold text-slate-900 mb-2">Run it yourself</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  Use the open-source Cyoda runtime locally or in your own environment. Available
                  under Apache 2.0.
                </p>
                <div className="mt-5 space-y-2">
                  <a
                    href="https://cyoda.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => pushGA('open_source_click')}
                  >
                    cyoda.org <ExternalLink size={13} />
                  </a>
                  <a
                    href="https://github.com/Cyoda-platform/cyoda-go"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => pushGA('github_click')}
                  >
                    GitHub <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Cyoda Cloud */}
              <div className="bg-blue-600 rounded-lg border border-blue-700 p-6 flex flex-col text-white">
                <Server size={20} className="text-blue-200 mb-4" />
                <h3 className="text-base font-semibold mb-2">Cyoda Cloud</h3>
                <p className="text-sm text-blue-100 leading-relaxed flex-1">
                  Use the hosted Cyoda runtime in live beta. Free to try for development, evaluation,
                  and prototyping.
                </p>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={(event) => {
                      pushGA('try_cyoda_cloud_free_click');
                      handleOpenCyodaCloud(event, 'cloud card try free');
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-2 rounded-md bg-white text-blue-700 text-sm font-medium hover:bg-blue-50 transition-colors"
                    style={{ color: '#1d4ed8' }}
                  >
                    Try Cyoda Cloud, free
                  </button>
                </div>
              </div>

              {/* Enterprise Cyoda */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col">
                <Shield size={20} className="text-slate-600 mb-4" />
                <h3 className="text-base font-semibold text-slate-900 mb-2">Enterprise Cyoda</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  Use Cyoda with enterprise deployment, support, and production architecture options,
                  including self-hosted, dedicated cloud, and supported on-premise deployments.
                  Enterprise Cyoda is horizontally scalable and highly available.
                </p>
                <div className="mt-5">
                  <a
                    href="https://cyoda.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => pushGA('enterprise_click')}
                  >
                    cyoda.com <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Free beta expectations ── */}
        <section aria-labelledby="beta-heading" className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">
                Free tier
              </p>
              <h2 id="beta-heading" className="text-2xl font-bold text-slate-900 mb-4">
                Free beta expectations
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8">
                Cyoda Cloud is free to try during live beta. The free tier is intended for
                evaluation, prototyping, and developer testing. It is not a production service and
                does not include an SLA, guaranteed retention, or guaranteed backups.
              </p>
              <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Reference limits</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    ['Models', '20'],
                    ['Fields per model', '150'],
                    ['Cumulative fields', '300'],
                    ['Client nodes', '1'],
                    ['Payload size', '5 MB'],
                    ['Disk usage', '2 GB'],
                    ['API requests', '300 / min'],
                    ['External calls', '300 / min'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between text-sm border-b border-slate-100 pb-2"
                    >
                      <span className="text-slate-600">{label}</span>
                      <span className="font-mono text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-4">
                  Free tier environments are automatically reset after an expiry period. Your
                  account's current limits are authoritative in the Cyoda Cloud API at{' '}
                  <span className="font-mono">/account</span> and{' '}
                  <span className="font-mono">/account/subscriptions</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'Free to try',
                  'Live beta',
                  'Best-efforts support',
                  'No production SLA',
                  'Not intended for production workloads',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-medium"
                    style={{ color: '#374151' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section aria-labelledby="faq-heading" className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="grid lg:grid-cols-3 gap-12">
              <div>
                <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">
                  FAQ
                </p>
                <h2 id="faq-heading" className="text-2xl font-bold text-slate-900 mb-4">
                  Common questions
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Questions about hosting, security, the free tier, and how the AI assistant fits
                  into Cyoda.
                </p>
                <a
                  href="https://docs.cyoda.net/cyoda-cloud/identity-and-entitlements/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => pushGA('docs_click')}
                >
                  Identity and entitlements docs <ExternalLink size={13} />
                </a>
              </div>
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg px-6 divide-y divide-slate-200">
                {/* FAQPage JSON-LD */}
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'FAQPage',
                      mainEntity: faqs.map((faq) => ({
                        '@type': 'Question',
                        name: faq.q,
                        acceptedAnswer: { '@type': 'Answer', text: faq.a },
                      })),
                    }),
                  }}
                />
                {faqs.map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section aria-labelledby="cta-heading" className="bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
            <h2 id="cta-heading" className="text-2xl font-bold text-slate-900 mb-4">
              Start building with hosted Cyoda today.
            </h2>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
              Free to try in live beta. No credit card required. The same entity models and API work
              whether you stay on Cyoda Cloud or move to self-hosted or Enterprise later.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={(event) => {
                  pushGA('try_cyoda_cloud_free_click');
                  handleOpenCyodaCloud(event, 'final try free');
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                style={{ color: '#ffffff' }}
              >
                Try Cyoda Cloud, free
                <ArrowRight size={16} />
              </button>
              <a
                href="https://docs.cyoda.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                onClick={() => pushGA('docs_click')}
              >
                <BookOpen size={15} />
                Read the docs
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Site links row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm text-slate-600">
            <a
              href="https://docs.cyoda.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
              onClick={() => pushGA('docs_click')}
            >
              Docs
            </a>
            <a
              href="https://github.com/Cyoda-platform/cyoda-go"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
              onClick={() => pushGA('github_click')}
            >
              GitHub
            </a>
            <a
              href="https://cyoda.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
              onClick={() => pushGA('open_source_click')}
            >
              Open Source
            </a>
            <a
              href="https://cyoda.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
              onClick={() => pushGA('enterprise_click')}
            >
              Enterprise
            </a>
          </div>
          {/* Legal row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-200 pt-5">
            <p className="shrink-0">© 2026 Cyoda. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a
                href="https://cyoda.com/privacy-policy#:~:text=Cookie-,Preferences,-Cookie%20Policy"
                className="hover:text-blue-600 transition-colors"
              >
                Cookie Preferences
              </a>
              <a
                href="https://cyoda.com/cookie-policy"
                className="hover:text-blue-600 transition-colors"
              >
                Cookie Policy
              </a>
              <a
                href="https://cyoda.com/privacy-policy"
                className="hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="https://cyoda.com/terms-of-service"
                className="hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FintechHomeView;
