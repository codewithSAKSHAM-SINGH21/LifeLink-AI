import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    title: "One-click SOS",
    desc: "Share your live location and record the alert instantly.",
    to: "/sos",
    icon: "SOS",
  },
  {
    title: "Nearby help",
    desc: "Find hospitals and police stations around your position.",
    to: "/help",
    icon: "MAP",
  },
  {
    title: "AI first aid",
    desc: "Get calm, step-by-step emergency guidance in seconds.",
    to: "/assistant",
    icon: "AI",
  },
  {
    title: "Responder profile",
    desc: "Keep blood group, allergies, and contacts ready.",
    to: "/profile",
    icon: "QR",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="page-inner grid items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            Emergency-ready platform
          </div>
          <h1 className="max-w-3xl font-display text-5xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
            One click can save a life.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            LifeLink AI brings SOS alerts, nearby emergency services, responder-ready
            medical details, and first-aid guidance into one fast dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? "/sos" : "/signup"} className="btn-primary px-7">
              {user ? "Open SOS" : "Create account"}
            </Link>
            <Link to={user ? "/assistant" : "/login"} className="btn-dark px-7">
              AI Assistant
            </Link>
          </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-lg">
          <div className="relative min-h-[430px] bg-slate-950 p-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(239,68,68,0.42),transparent_22rem),radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.35),transparent_18rem)]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
            <div className="relative flex h-full min-h-[382px] flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-white/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] backdrop-blur">
                  Live safety hub
                </span>
                <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.9)]" />
              </div>

              <div className="mx-auto grid h-52 w-52 place-items-center rounded-full border border-red-400/30 bg-red-500/10 shadow-[0_0_80px_rgba(220,38,38,0.36)]">
                <div className="pulse-ring grid h-32 w-32 place-items-center rounded-full bg-red-600 font-mono text-3xl font-bold tracking-[0.08em] shadow-2xl shadow-red-600/40">
                  SOS
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {["Location", "Hospitals", "First aid"].map((item) => (
                  <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{item}</p>
                    <p className="mt-2 font-display text-lg font-bold">Ready</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-inner pb-14">
        <div className="mb-6">
          <h2 className="section-title">Your emergency toolkit</h2>
          <p className="muted mt-2">Fast actions, clear information, no clutter.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.title}
              to={user ? f.to : "/login"}
              className="surface group p-5 transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl dark:hover:border-red-500/30"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-slate-950 font-mono text-xs font-bold tracking-[0.08em] text-white shadow-lg shadow-slate-950/10 transition group-hover:bg-red-600 dark:bg-white dark:text-slate-950 dark:group-hover:bg-red-500 dark:group-hover:text-white">
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-slate-950 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
