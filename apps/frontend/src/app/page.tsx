import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Globe2,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Star,
  Search,
  MoreHorizontal,
  Clock3,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import SiteHeader from "./components/site-header";

const faqs = [
  ["What is a virtual phone number?", "A virtual phone number is a number managed through an online service rather than a physical SIM in your device. Availability and supported features vary by country and provider."],
  ["Which countries and features are available?", "The marketplace will show options when connected providers report inventory. SMS, voice, rental terms, and local requirements vary by market."],
  ["Can I receive SMS and calls?", "Capabilities depend on the specific number. Check the listed features before choosing; we only intend to show capabilities confirmed by the provider."],
  ["How do I get started?", "Create an account to access your workspace. Number inventory and account features will appear as the platform's provider integrations become available."],
];

const networkLogos = [
  { name: "Ethio Telecom", src: "/images/networks/ethio-telecom.svg", glow: "#28a960" },
  { name: "Airtel", src: "/images/networks/airtel.svg", glow: "#e42529" },
  { name: "Safaricom", src: "/images/networks/safaricom.svg", glow: "#21a447" },
  { name: "MTN", src: "/images/networks/mtn.svg", glow: "#ffcc00" },
  { name: "Twilio", src: "/images/networks/twilio.svg", glow: "#f22f46" },
  { name: "Telnyx", src: "/images/networks/telnyx.svg", glow: "#00a879" },
  { name: "Vonage", src: "/images/networks/vonage.svg", glow: "#111827" },
];

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden bg-white text-[#101a31]">
      <SiteHeader />

      <section className="hero-section relative isolate overflow-hidden text-white">
        <div className="network-scene" aria-hidden="true">
          <div className="hero-particles hero-particles-one" />
          <div className="hero-particles hero-particles-two" />
          <div className="hero-halo hero-halo-blue" />
          <div className="hero-halo hero-halo-purple" />
          <div className="network-grid" />
          <div className="network-glow network-glow-a" />
          <div className="network-glow network-glow-b" />
          <svg className="network-lines" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice">
            <path d="M760 620 890 480 1010 500 1110 345 1250 360 1380 200" />
            <path d="M690 520 810 380 970 390 1060 250 1210 260 1340 120" />
            <path d="M830 700 940 590 1080 600 1180 470 1320 485 1440 350" />
            <path d="M960 760 1060 660 1180 670 1280 570 1420 590" />
            <path d="M880 480 810 380 760 260 650 210" />
            <circle cx="890" cy="480" r="5" /><circle cx="1010" cy="500" r="5" /><circle cx="1110" cy="345" r="5" /><circle cx="1250" cy="360" r="5" /><circle cx="970" cy="390" r="5" /><circle cx="1060" cy="250" r="5" /><circle cx="1210" cy="260" r="5" /><circle cx="1180" cy="470" r="5" />
          </svg>
          <div className="signal-ring signal-ring-one" /><div className="signal-ring signal-ring-two" />
          <span className="network-tag network-tag-one"><span /> SIGNAL ACTIVE</span>
          <span className="network-tag network-tag-two"><Globe2 size={13} /> 120+ MARKETS</span>
          <div className="scene-overlay" />
        </div>
        <div className="hero-inner relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[.96fr_1.04fr] lg:gap-12 lg:px-10 lg:py-28">
          <div className="hero-copy">
            <div className="hero-eyebrow mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3.5 py-2 text-[11px] font-semibold tracking-wide text-blue-100 backdrop-blur-sm"><span className="live-dot" /> A new way to stay connected</div>
            <h1 className="hero-headline max-w-3xl text-[2.7rem] font-semibold leading-[1.08] tracking-[-.045em] sm:text-6xl lg:text-[4.35rem]">Global reach.<br /><span className="hero-gradient-text">One simple number.</span></h1>
            <p className="hero-description mt-6 max-w-xl text-base leading-7 text-blue-100/75 sm:text-lg sm:leading-8">Manage virtual phone numbers, messages, and rentals in one clear workspace—built for a world that never stands still.</p>
            <div className="hero-actions mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="button-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white">Get Started <ArrowRight size={16} /></Link>
              <a href="#features" className="button-ghost inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white">Explore Features <ArrowDown size={15} /></a>
            </div>
            <div className="hero-social-proof mt-9" aria-label="Customer satisfaction">
              <div className="customer-avatars" aria-hidden="true">
                <img src="https://images.unsplash.com/photo-1642257859842-c95f9fa8121d?auto=format&fit=crop&w=96&h=96&q=80" alt="" />
                <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=96&h=96&q=80" alt="" />
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80" alt="" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80" alt="" />
              </div>
              <div className="social-proof-copy">
                <div className="customer-stars" aria-hidden="true"><Star /><Star /><Star /><Star /><Star /></div>
                <span>Global connectivity</span>
              </div>
            </div>
          </div>
          <div className="hero-visual relative mx-auto w-full max-w-[520px]">
            <div className="visual-orbit visual-orbit-a" /><div className="visual-orbit visual-orbit-b" />
            <div className="connect-card connect-card-top"><span className="connect-icon"><Globe2 size={16} /></span><span><b>Global reach</b><small>Explore supported markets</small></span><ArrowUpRight size={16} className="ml-auto text-blue-300" /></div>
            <div className="phone-card">
              <div className="phone-top"><span className="phone-camera" /><span className="phone-status">9:41 <span>●●●</span></span></div>
              <div className="phone-content"><div className="phone-heading"><div><small>YOUR WORKSPACE</small><h3>Stay connected.</h3></div><span className="phone-avatar">VP</span></div>
                <div className="phone-number"><div className="flex items-center gap-3"><span className="number-icon"><Smartphone size={17} /></span><span><small>ACTIVE NUMBER</small><b>+1 (•••) •••-2840</b></span></div><span className="status-pill"><i />Active</span></div>
                <div className="phone-message"><span className="message-icon"><MessageSquareText size={16} /></span><div><div className="flex items-center justify-between"><b>New message</b><small>Now</small></div><p>Your workspace is ready when you are.</p></div><span className="message-unread" /></div>
                <div className="phone-nav"><span><Layers3 size={15} />Home</span><span><Globe2 size={15} />Numbers</span><span><MessageSquareText size={15} />Inbox</span><span><Wallet size={15} />Wallet</span></div>
              </div>
            </div>
            <div className="connect-card connect-card-bottom"><span className="secure-icon"><LockKeyhole size={15} /></span><span><b>One clear workspace</b><small>Your numbers, all in sync</small></span><span className="sync-dots"><i /><i /><i /></span></div>
            <div className="visual-spark spark-one" /><div className="visual-spark spark-two" />
          </div>
        </div>
        <div className="hero-bottom-fade" />
      </section>

      <section id="networks" className="network-strip" aria-label="Telecom networks">
        <div className="network-marquee"><div className="network-track">{[...networkLogos, ...networkLogos].map((logo, index) => <div className="network-name" key={`${logo.name}-${index}`} style={{ "--logo-glow": logo.glow } as React.CSSProperties}><img src={logo.src} alt={index < networkLogos.length ? logo.name : ""} aria-hidden={index >= networkLogos.length} /></div>)}</div></div>
      </section>

      <section id="features" className="features-section section-pad">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="section-heading features-heading mx-auto max-w-3xl text-center"><span className="section-kicker">OUR FEATURES</span><h2 className="section-title">Everything connected.<br /><span>Nothing complicated.</span></h2><p className="section-description mx-auto">A focused set of tools for the everyday essentials of managing your virtual numbers and communications.</p></div>
          <div className="features-grid mt-14">
            <article className="feature-card feature-card-markets"><div className="feature-preview market-preview" aria-hidden="true"><div className="preview-topline"><span>GLOBAL COVERAGE</span><span className="preview-live"><i /> LIVE</span></div><div className="map-canvas"><div className="map-grid" /><svg viewBox="0 0 520 195" className="world-map" role="presentation"><path d="m40 55 22-18 37-8 20 10 25-4 12 17-12 12-24 2-8 17-19 4-7 20-20 4-13-15-18-3-8-19-17-2zm135-22 25-13 40 4 17 14 28-2 19 14-7 16-20 1-12 20-18 5-8 24-15 12-14-13 3-20-17-10-10-20-17-8zm71 102 20-11 28 7 13 16-9 22-17 8-18-15zm66-94 24-11 37 2 26 11 39-5 28 15-13 13-30-3-15 16-24 3-11 17-24-3-11-18-21-6-11-18-22 2z" /></svg><span className="map-pin pin-one">NYC</span><span className="map-pin pin-two">LON</span><span className="map-pin pin-three">ADD</span><span className="map-pin pin-four">SIN</span><div className="availability-float"><span className="availability-pulse" /><span><b>United States</b><small>24 numbers available</small></span><ArrowUpRight size={14} /></div></div><div className="map-footer"><span><i className="map-legend-dot" /> 120+ markets</span><span>Explore coverage <ArrowRight size={12} /></span></div></div><div className="feature-copy"><div><span className="feature-number">01 / DISCOVER</span><h3>Reach more markets</h3><p>Explore virtual number availability across supported countries and regions.</p></div><Link className="feature-link" href="/register" aria-label="Explore number availability"><ArrowRight size={16} /></Link></div></article>
            <article className="feature-card feature-card-inbox"><div className="feature-preview inbox-preview" aria-hidden="true"><div className="inbox-toolbar"><div><span className="inbox-window-dot" /><span className="inbox-window-dot" /><span className="inbox-window-dot" /></div><span>MESSAGES <b>04</b></span><MoreHorizontal size={17} /></div><div className="inbox-message"><span className="message-avatar avatar-violet">AM</span><div className="inbox-message-main"><div className="inbox-sender"><b>Amara M.</b><time>2 min ago</time></div><p>Your verification code is <strong>482 196</strong></p><small>+1 (415) ••• 0824</small></div><i className="inbox-unread" /></div><div className="inbox-message"><span className="message-avatar avatar-blue">JD</span><div className="inbox-message-main"><div className="inbox-sender"><b>Jordan Davis</b><time>18 min ago</time></div><p>Thanks, I’ll be there shortly.</p><small>+44 20 •••• 6710</small></div></div><div className="inbox-composer"><span>Reply to this conversation…</span><span className="composer-send"><ArrowRight size={13} /></span></div></div><div className="feature-copy"><div><span className="feature-number">02 / STAY IN SYNC</span><h3>One clear inbox</h3><p>Keep incoming messages connected to the numbers and rentals you manage.</p></div><Link className="feature-link" href="/dashboard" aria-label="Explore your inbox"><ArrowRight size={16} /></Link></div></article>
            <article className="feature-card feature-card-control"><div className="feature-preview control-preview" aria-hidden="true"><div className="control-topline"><div><span>WORKSPACE OVERVIEW</span><b>Good morning, Alex</b></div><span className="control-avatar">A</span></div><div className="control-metrics"><div><small>ACTIVE RENTALS</small><b>08 <i>+2</i></b></div><div><small>ACCOUNT BALANCE</small><b>$248.50</b></div></div><div className="activity-row"><span className="activity-icon"><Smartphone size={13} /></span><span><b>Number rental renewed</b><small>United Kingdom · +44 20 •••• 6710</small></span><span className="status-active"><i /> Active</span></div><div className="activity-row"><span className="activity-icon activity-icon-purple"><CheckCircle2 size={13} /></span><span><b>Payment received</b><small>Wallet top-up · 5 minutes ago</small></span><span className="status-complete">Complete</span></div></div><div className="feature-copy"><div><span className="feature-number">03 / KEEP CONTROL</span><h3>Built around control</h3><p>See account activity, rental status, and important updates in one workspace.</p></div><Link className="feature-link" href="/dashboard" aria-label="Explore your workspace"><ArrowRight size={16} /></Link></div></article>
            <article className="feature-card feature-card-speed"><div className="feature-preview speed-preview" aria-hidden="true"><div className="speed-sidebar"><span className="speed-brand"><RadioTower size={13} /></span><span className="speed-nav-item speed-nav-active"><Layers3 size={13} /></span><span className="speed-nav-item"><Globe2 size={13} /></span><span className="speed-nav-item"><MessageSquareText size={13} /></span><span className="speed-nav-item"><Wallet size={13} /></span></div><div className="speed-main"><div className="speed-header"><span className="speed-search"><Search size={12} /> Search anything… <kbd>⌘ K</kbd></span><span className="speed-avatar">A</span></div><div className="speed-greeting"><small>MONDAY, OCTOBER 21</small><b>Your workspace, at a glance.</b></div><div className="quick-actions"><span><i className="quick-action-blue"><Globe2 size={14} /></i><b>Find a number</b><small>Browse availability</small><ArrowUpRight size={12} /></span><span><i className="quick-action-purple"><MessageSquareText size={14} /></i><b>View inbox</b><small>3 unread messages</small><ArrowUpRight size={12} /></span></div><div className="speed-recent"><span>RECENT ACTIVITY</span><span><Clock3 size={12} /> Rental renewed <small>2m</small></span></div></div></div><div className="feature-copy"><div><span className="feature-number">04 / MOVE QUICKLY</span><h3>Made to move quickly</h3><p>Find the information you need with a focused, straightforward experience.</p></div><Link className="feature-link" href="/dashboard" aria-label="Explore your workspace"><ArrowRight size={16} /></Link></div></article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="journey-section">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="journey-heading"><div><span className="section-kicker">HOW IT WORKS</span><h2>From first click<br />to <span>fully connected.</span></h2><p>A straightforward path to the tools and information you need, every step of the way.</p></div><Link href="/register" className="journey-cta">Create your account <ArrowRight size={16} /></Link></div>
          <div className="journey-steps">
            <article className="journey-step"><div className="journey-preview signup-preview" aria-hidden="true"><div className="preview-chrome"><span><i /><i /><i /></span><small>CREATE YOUR ACCOUNT</small><LockKeyhole size={13} /></div><div className="signup-form"><span className="signup-heading">Your workspace starts here</span><span className="signup-field">Full name <b>Alex Morgan</b></span><span className="signup-field">Email address <b>alex@example.com</b></span><span className="signup-submit">Create account <ArrowRight size={11} /></span></div><div className="signup-success"><span><Check size={11} /></span><b>Account created</b></div></div><div className="journey-step-copy"><span className="journey-step-number">01</span><div><h3>Create your account</h3><p>Set up your workspace in a few simple steps.</p></div><ArrowUpRight size={15} className="journey-arrow" /></div></article>
            <article className="journey-step journey-step-featured"><div className="journey-preview availability-preview" aria-hidden="true"><div className="preview-chrome"><span><i /><i /><i /></span><small>NUMBER MARKETPLACE</small><Globe2 size={13} /></div><div className="availability-heading"><span>Popular markets</span><small>View all <ArrowRight size={10} /></small></div><div className="country-option"><span className="country-flag">🇺🇸</span><span><b>United States</b><small>SMS · Voice</small></span><span className="country-availability"><i /> 24 numbers</span></div><div className="country-option"><span className="country-flag">🇬🇧</span><span><b>United Kingdom</b><small>SMS · Voice</small></span><span className="country-availability"><i /> 12 numbers</span></div><div className="country-option"><span className="country-flag">🇪🇹</span><span><b>Ethiopia</b><small>SMS</small></span><span className="country-availability"><i /> 08 numbers</span></div><div className="market-footer"><span>120+ markets</span><span>Updated just now</span></div></div><div className="journey-step-copy"><span className="journey-step-number">02</span><div><h3>Explore availability</h3><p>Browse markets and capabilities reported by connected providers.</p></div><ArrowUpRight size={15} className="journey-arrow" /></div></article>
            <article className="journey-step"><div className="journey-preview workspace-preview" aria-hidden="true"><div className="preview-chrome"><span><i /><i /><i /></span><small>YOUR WORKSPACE</small><MoreHorizontal size={14} /></div><div className="workspace-summary"><span><small>ACTIVE NUMBERS</small><b>03 <i>+1 this week</i></b></span><span className="workspace-summary-icon"><Smartphone size={14} /></span></div><div className="workspace-number"><span className="number-badge"><Smartphone size={12} /></span><span><b>+1 (415) ••• 0824</b><small>United States · SMS</small></span><span className="rental-status"><i /> Active</span></div><div className="workspace-activity"><span className="activity-avatar">AM</span><span><b>New message received</b><small>Verification code · just now</small></span><span className="activity-unread" /></div></div><div className="journey-step-copy"><span className="journey-step-number">03</span><div><h3>Manage with clarity</h3><p>Keep your active numbers and incoming activity organized.</p></div><ArrowUpRight size={15} className="journey-arrow" /></div></article>
          </div>
        </div>
      </section>

      <section className="why-section section-pad">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="why-heading mx-auto max-w-3xl text-center">
            <span className="why-badge"><RadioTower size={13} /> ALWAYS IN SYNC</span>
            <h2 className="section-title">Why choose us</h2>
            <p className="section-description mx-auto">Your numbers. Your messages. One simple platform.</p>
            <p className="why-intro">Virtual connectivity shouldn’t be complicated. We make it easy to discover virtual phone numbers, receive SMS messages, and manage everything from one reliable workspace.</p>
          </div>
          <div className="why-benefits">
            <article className="why-benefit"><div className="why-benefit-visual"><span className="why-benefit-icon"><Globe2 size={25} /></span><span className="why-orbit-dot" /><span className="why-mini-label">GLOBAL REACH</span></div><div className="why-benefit-copy"><span className="why-benefit-number">01 / CONNECT</span><h3>🌍 Global Connectivity</h3><p>Explore virtual phone numbers from different countries and find the right option for your needs.</p></div></article>
            <article className="why-benefit"><div className="why-benefit-visual"><span className="why-management-stack"><Smartphone size={22} /><Check size={15} /></span><span className="why-mini-label">SIMPLE BY DESIGN</span></div><div className="why-benefit-copy"><span className="why-benefit-number">02 / MANAGE</span><h3>⚡ Simple Number Management</h3><p>Browse, access, and manage your virtual numbers without unnecessary steps or complicated tools.</p></div></article>
            <article className="why-benefit"><div className="why-benefit-visual"><span className="why-message-bubble"><MessageSquareText size={24} /><i /></span><span className="why-mini-label">ONE CLEAR INBOX</span></div><div className="why-benefit-copy"><span className="why-benefit-number">03 / RECEIVE</span><h3>💬 Messages in One Place</h3><p>Keep track of incoming SMS messages and stay organized with a clear, centralized dashboard.</p></div></article>
          </div>
        </div>
      </section>

      <section className="supported-section py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10"><div><span className="section-kicker text-cyan-300">SUPPORTED NETWORKS</span><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">A growing world of connectivity.</h2></div><p className="max-w-xl text-sm leading-6 text-blue-100/65">Availability is determined by connected providers and changes by country, number type, and supported capabilities. Check the marketplace for current options.</p><Link href="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#122143] hover:bg-blue-50">Explore availability <ArrowRight size={15} /></Link></div>
      </section>

      <section id="faq" className="section-pad bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-10"><div><span className="section-kicker">FREQUENTLY ASKED QUESTIONS</span><h2 className="section-title mt-4">Good to <span>know.</span></h2><p className="section-description">A few answers to help you get oriented.</p><a href="mailto:hello@virtualphone.example" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Still have a question? <ArrowUpRight size={14} /></a></div><div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div></div>
      </section>

      <section className="cta-section px-5 py-16 sm:px-8 sm:py-20"><div className="cta-card mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] px-7 py-12 text-center text-white sm:px-12 sm:py-16"><div className="cta-decoration" /><span className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-blue-100"><span className="live-dot" /> YOUR NEXT CONNECTION STARTS HERE</span><h2 className="relative mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">Make room for <span className="hero-gradient-text">what’s next.</span></h2><p className="relative mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100/70 sm:text-base">Create your account and explore a more organized way to manage virtual connectivity.</p><div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="button-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white">Get started <ArrowRight size={15} /></Link><Link href="/login" className="button-ghost inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white">Log in to your account</Link></div></div></section>

      <footer className="site-footer border-t border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_.8fr_.8fr] lg:px-10"><div><Link className="flex w-fit items-center gap-3 font-semibold tracking-tight" href="/"><span className="brand-mark grid size-9 place-items-center rounded-xl text-white"><RadioTower size={18} /></span><span>Virtual<span className="text-blue-600">Phone</span></span></Link><p className="mt-4 max-w-sm text-xs leading-6 text-slate-500">A clearer way to manage virtual phone numbers and stay connected across markets.</p></div><div><h3 className="footer-heading">Explore</h3><div className="mt-4 grid gap-3 text-xs text-slate-500"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#networks">Networks</a><a href="#faq">FAQ</a></div></div><div><h3 className="footer-heading">Your account</h3><div className="mt-4 grid gap-3 text-xs text-slate-500"><Link href="/register">Create account</Link><Link href="/login">Log in</Link><Link href="/dashboard">Workspace</Link><a href="mailto:hello@virtualphone.example">Contact</a></div></div></div>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-slate-100 px-5 py-5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span>© {new Date().getFullYear()} Virtual Phone. All rights reserved.</span><span>Availability depends on provider inventory and supported regions.</span></div>
      </footer>
    </main>
  );
}
