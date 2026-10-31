import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tools = [
  { number: "01", title: "Emergency SOS", description: "Save your location with an SOS entry in your account.", href: "/sos", action: "Open SOS" },
  { number: "02", title: "Nearby services", description: "Find hospitals and police stations on a live map.", href: "/help", action: "View map" },
  { number: "03", title: "First aid guidance", description: "Get practical steps while help is on its way.", href: "/assistant", action: "Get guidance" },
  { number: "04", title: "Medical profile", description: "Keep essential details and an emergency QR code close.", href: "/profile", action: "Manage profile" },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <main>
      <section className="hero-wrap">
        <div className="hero page-inner">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-mark" /> Emergency support, within reach</p>
            <h1>When it matters,<br /><em>be ready.</em></h1>
            <p className="hero-lede">LifeLink keeps nearby services, first-aid guidance and essential medical information together in one place.</p>
            <div className="hero-actions">
              <Link to={user ? "/sos" : "/signup"} className="btn-primary">{user ? "Open emergency tools" : "Get started"}<span aria-hidden="true">↗</span></Link>
              <Link to={user ? "/help" : "/login"} className="text-link">{user ? "Find nearby help" : "Sign in to your account"}<span aria-hidden="true">→</span></Link>
            </div>
            <div className="hero-note"><span className="note-rule" />For urgent situations, contact your local emergency number first.</div>
          </div>
          <div className="hero-art" aria-label="LifeLink emergency tools overview">
            <div className="art-topline"><span>LIFELINK / 01</span><span>PERSONAL SAFETY</span></div>
            <div className="art-center">
              <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
              <div className="art-cross">+</div>
              <div className="art-caption"><span>READY WHEN NEEDED</span><strong>Help starts<br />with a connection.</strong></div>
            </div>
            <div className="art-bottom"><span>01 — ALERT</span><span>02 — LOCATE</span><span>03 — RESPOND</span></div>
          </div>
        </div>
      </section>
      <section className="tools-section page-inner">
        <div className="section-heading"><div><p className="eyebrow">A clearer way to respond</p><h2>Everything important,<br className="sm:hidden" /> in one place.</h2></div><p>Simple tools for the moments when clear information matters most.</p></div>
        <div className="tools-grid">
          {tools.map((tool) => <Link key={tool.number} to={user ? tool.href : "/login"} className="tool-card">
            <span className="tool-number">{tool.number}</span><span className="tool-arrow" aria-hidden="true">↗</span>
            <h3>{tool.title}</h3><p>{tool.description}</p><span className="tool-action">{tool.action} <span aria-hidden="true">→</span></span>
          </Link>)}
        </div>
      </section>
      <footer className="site-footer page-inner"><span>LifeLink</span><span>Designed to keep help close at hand.</span></footer>
    </main>
  );
}
