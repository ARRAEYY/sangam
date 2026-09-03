import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Link2,
  Menu,
  Sparkles,
  UsersRound,
  X
} from "lucide-react";
import { SangamEmblem } from "../components/SangamLogo.jsx";
import "./Landing.css";

// Sample Data mimicking the DB for the landing showcase
const projects = [
  { number: "01", title: "The local food atlas", meta: "Research / Storytelling", copy: "A living map of the recipes, people, and places that make campus feel like home.", skills: ["Research", "Figma"], initials: "MS", tone: "rose" },
  { number: "02", title: "Night bus radio", meta: "Audio / Culture", copy: "A late-evening audio guide to the ideas, music, and conversations that move across campus.", skills: ["Audio", "Branding"], initials: "RD", tone: "blue" },
  { number: "03", title: "Pocket climate lab", meta: "Data / Climate", copy: "Making everyday energy choices visible through a small, playful campus experiment.", skills: ["Python", "Climate"], initials: "IR", tone: "sand" },
];

const talent = [
  { name: "Anika Menon", detail: "B.Des · Interaction design", signal: "Turns fuzzy ideas into clear, generous experiences.", skills: ["Figma", "Research"], tone: "rose" },
  { name: "Kabir Sethi", detail: "B.Tech · Computer science", signal: "Builds calm systems for complicated problems.", skills: ["React", "Python"], tone: "blue" },
  { name: "Sana Iqbal", detail: "B.A. · Sociology", signal: "Asks better questions, then gets people in the room.", skills: ["Community", "Writing"], tone: "sand" },
];

const opportunities = [
  { icon: BriefcaseBusiness, type: "Internship", title: "Build the next campus experience", detail: "Design systems / 6 weeks", color: "rose" },
  { icon: Sparkles, type: "Hackathon", title: "A better way to share a table", detail: "Product / This weekend", color: "blue" },
  { icon: CalendarDays, type: "Event", title: "Open studio: first drafts", detail: "Community / Thursday, 6pm", color: "sand" },
];

// Reusable Scroll Hook for Animations
function useActiveSection() {
  const [activeSection, setActiveSection] = useState(0);
  useEffect(() => {
    const sections = document.querySelectorAll(".snap-section");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(Number(entry.target.dataset.index));
          entry.target.setAttribute("data-active", "true");
        } else {
          entry.target.setAttribute("data-active", "false");
        }
      });
    }, { threshold: 0.35 });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return activeSection;
}

function ScrollProgressIndicator({ activeSection, totalSections }) {
  return (
    <div className="scroll-progress" aria-hidden="true">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          className={`scroll-dot ${activeSection === i ? "is-active" : ""}`}
          aria-label={`Scroll to section ${i + 1}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      ))}
    </div>
  );
}

// Interactive SVG Network Visual for the Hero
function NetworkVisual() {
  const [active, setActive] = useState("people");
  const nodes = [
    { id: "people", label: "People", x: 19, y: 28, tone: "node-maroon" },
    { id: "projects", label: "Projects", x: 63, y: 16, tone: "node-blue" },
    { id: "skills", label: "Skills", x: 80, y: 55, tone: "node-sand" },
    { id: "opportunities", label: "Open calls", x: 45, y: 78, tone: "node-rose" },
    { id: "you", label: "You", x: 47, y: 43, tone: "node-you" },
  ];

  return (
    <div className="network-visual" aria-label="Interactive map of people, projects, skills, and opportunities">
      <div className="network-grid" />
      {nodes.map((node) => (
        <button
          key={node.id}
          className={`network-node ${node.tone} ${active === node.id ? "is-active" : ""}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          onMouseEnter={() => setActive(node.id)}
          onFocus={() => setActive(node.id)}
          onClick={() => setActive(node.id)}
        >
          <span className="network-node-dot" />
          <span>{node.label}</span>
        </button>
      ))}
      <svg className="network-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M19 28 L47 43 L63 16 M47 43 L80 55 M47 43 L45 78" />
        <path d="M19 28 L63 16 M63 16 L80 55 M80 55 L45 78" />
      </svg>
      <div className="network-caption">
        <strong>{active === "you" ? "Your next move starts here." : `${nodes.find((node) => node.id === active)?.label} connect the dots.`}</strong>
        <span>Hover to trace the signal.</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const activeSection = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Discover", copy: "See the projects, skills, and open calls already taking shape." },
    { title: "Connect", copy: "Find the person whose point of view unlocks your next step." },
    { title: "Collaborate", copy: "Share a brief, make a plan, and let the work get specific." },
    { title: "Build", copy: "Turn a good idea into something the campus can feel." }
  ];

  return (
    <div className="landing-site">
      <header className="landing-nav">
        <Link to="/" className="public-brand">
          <SangamEmblem size={24} className="text-maroon" />
        </Link>
        <nav className={menuOpen ? "is-open" : ""}>
          <a href="#about">About</a>
          <a href="#explore">Explore</a>
          <a href="#talent">Find talent</a>
          <a href="#opportunities">Opportunities</a>
    
          <Link to="/auth" className="button button-primary nav-cta">Login <ArrowRight size={16}></ArrowRight></Link>
        </nav>
        <button className="landing-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      <main>


        {/* Hero Section */}
        <section id="section-0" className="snap-section" data-index={0}>
          <div className="snap-content-wrapper">
            <div className="landing-hero">
              <div className="hero-copy reveal-element delay-1">
                <h1>Where campus<br /><em>ideas find</em><br />their people.</h1>

                <div className="hero-actions">
                  <Link to="/explore" className="button button-primary">Explore Sangam <ArrowRight size={16} /></Link>
                  <Link to="/talent" className="button button-quiet">Find your team <ArrowUpRight size={16} /></Link>
                </div>
              </div>
              <div className="hero-network reveal-element delay-2">
                <NetworkVisual />
              </div>
              <div className="hero-scroll reveal-element delay-3">
                <ArrowDownRight size={15} /> Scroll to find your people
              </div>
            </div>

          </div>
        </section>

        {/* The Problem Section */}
        <section id="section-1" className="snap-section" data-index={1}>
          <div className="story-section" id="about">
            <div className="story-heading reveal-element delay-1">
              <h2>Good people are<br /><em>hard to find</em> in a<br />busy place.</h2>
            </div>
            <div className="story-grid">
              <div className="problem-list reveal-element delay-2">
                <div className="problem-row">
                  <span>01</span><strong>Ideas stay in notebooks.</strong>
                  <p>Because there is no obvious place to share the half-formed version.</p>
                </div>
                <div className="problem-row">
                  <span>02</span><strong>Talent stays invisible.</strong>
                  <p>Because a timetable can’t show you who thinks in the same direction.</p>
                </div>
                <div className="problem-row">
                  <span>03</span><strong>Opportunities pass by.</strong>
                  <p>Because the best campus moments move faster than a noticeboard.</p>
                </div>
              </div>
              <div className="solution-card reveal-element delay-3">
                <div className="solution-mark"><Link2 size={22} /></div>
                <h3 className="font-display text-[40px] text-white my-4 leading-none">Make the invisible<br /><em className="text-[#f0c7c8] not-italic">easy to find.</em></h3>
                <p className="text-white/70 text-[12px]">One calm layer for campus energy—where people, projects, and possibilities can meet before they become obvious.</p>
                <Link to="/auth" className="inline-flex items-center gap-2 mt-4 text-white font-bold text-[11px]">Join the network <ArrowUpRight size={15} /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="section-2" className="snap-section" data-index={2}>
          <div className="how-section">
            <div className="how-layout">
              <div className="reveal-element delay-1">
                <h2>Make the next<br /><em>step visible.</em></h2>
                <p>There is no perfect starting point. Sangam gives every kind of momentum somewhere to go.</p>
              </div>
              <div className="step-system reveal-element delay-2">
                <div className="step-tabs">
                  {steps.map((item, index) => (
                    <button
                      key={item.title}
                      className={step === index ? "is-active" : ""}
                      onClick={() => setStep(index)}
                    >
                      <span>0{index + 1}</span>{item.title}
                    </button>
                  ))}
                </div>
                <div className="step-panel">
                  <span className="step-number">0{step + 1}</span>
                  <div>
                    <h3>{steps[step].title}<span>/</span></h3>
                    <p>{steps[step].copy}</p>
                  </div>
                  <button className="step-arrow" onClick={() => setStep((step + 1) % steps.length)}>
                    <ChevronRight size={21} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Showcase Section */}
        <section id="section-3" className="snap-section" data-index={3}>
          <div className="showcase-section" id="explore">
            <div className="section-heading-row reveal-element delay-1">
              <div>
                <h2>Something worth<br /><em>joining.</em></h2>
              </div>
              <Link to="/explore" className="text-link">View all projects <ArrowUpRight size={15} /></Link>
            </div>
            <div className="project-showcase">
              {projects.map((project, index) => (
                <article className={`landing-project project-${project.tone} reveal-element delay-2`} key={project.title}>
                  <div className="project-top flex justify-between text-[9px] font-bold tracking-wider text-ink-soft mb-6">
                    <span>PROJECT / {project.number}</span>
                    <span className="bg-[#e8f0e8] text-[#4a7751] px-2 py-1 rounded-full">{index === 0 ? "Open" : index === 1 ? "Seeking co-founder" : "In progress"}</span>
                  </div>
                  <h3 className="font-display text-[22px] leading-tight mb-2">{project.title}</h3>
                  <p className="text-[13px] text-ink-soft leading-relaxed mb-6">{project.copy}</p>
                  <div className="project-bottom flex justify-between items-end mt-auto">
                    <div>
                      <div className="tag-row flex gap-2 mb-3">
                        {project.skills.map((skill) => <span key={skill} className="text-[10px] bg-white border border-[rgba(0,0,0,.05)] px-2 py-1 rounded-md text-ink-soft">{skill}</span>)}
                      </div>
                      <small className="text-[11px] text-ink-soft flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[rgba(0,0,0,.05)] flex items-center justify-center text-[9px] font-bold text-ink">{project.initials}</span>
                        {project.meta}
                      </small>
                    </div>
                    <button className="w-8 h-8 rounded-full border border-[rgba(24,34,50,.1)] flex items-center justify-center hover:bg-maroon hover:text-white transition"><ArrowUpRight size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Talent Showcase Section */}
        <section id="section-4" className="snap-section" data-index={4}>
          <div className="talent-section" id="talent">
            <div className="section-heading-row reveal-element delay-1">
              <div>
                <h2>The missing piece<br /><em>might be closer.</em></h2>
              </div>
              <Link to="/talent" className="text-link">Meet the network <ArrowUpRight size={15} /></Link>
            </div>
            <div className="talent-showcase">
              {talent.map((person) => (
                <article className={`landing-talent bg-white p-6 rounded-[18px] border border-[rgba(24,34,50,.08)] hover:-translate-y-1 transition duration-300 shadow-sm reveal-element delay-2`} key={person.name}>
                  <div className={`talent-avatar w-12 h-12 rounded-full mb-4 flex items-center justify-center font-display text-xl ${person.tone === 'rose' ? 'bg-[#f4e4e4] text-maroon' : person.tone === 'blue' ? 'bg-[#e8eef0] text-[#345b73]' : 'bg-[#f2eadc] text-[#8c6731]'}`}>
                    {person.name.split(" ").map((word) => word[0]).join("")}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-soft mb-2 block">{person.detail}</span>
                  <h3 className="font-display text-[22px] mb-2">{person.name}</h3>
                  <p className="text-[13px] text-ink-soft mb-6">{person.signal}</p>
                  <div className="talent-footer mt-auto flex justify-between items-center pt-4 border-t border-[rgba(24,34,50,.06)]">
                    <div className="tag-row flex gap-1">
                      {person.skills.map((skill) => <span key={skill} className="text-[10px] bg-[rgba(0,0,0,.04)] px-2 py-1 rounded-md text-ink-soft">{skill}</span>)}
                    </div>
                    <Link to="/talent" className="text-[11px] font-bold text-maroon flex items-center gap-1 hover:gap-2 transition-all">Connect <ArrowUpRight size={13} /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Opportunities */}
        <section id="section-5" className="snap-section" data-index={5}>
          <div className="showcase-section" id="opportunities">
            <div className="opportunity-section reveal-element delay-1">
              <div className="opportunity-art">
                <div className="orbit orbit-c"></div>
                <div className="orbit orbit-b"></div>
                <div className="orbit orbit-a"></div>
                <div className="orbit-core"><Sparkles size={24} /></div>
                <div className="orbit-label label-a">Internships</div>
                <div className="orbit-label label-b">Hackathons</div>
                <div className="orbit-label label-c">Events</div>
              </div>
              <div>
                <div className="opportunity-copy">
                  <h2>Not just<br /><em>projects.</em></h2>
                  <p>Somewhere between an invitation and a first step, the next opportunity is waiting.</p>
                  <Link to="/explore" className="button button-primary">See open calls <ArrowRight size={16} /></Link>
                </div>
                <div className="opportunity-list">
                  {opportunities.map((o, i) => {
                    const Icon = o.icon;
                    return (
                      <Link to="/auth" key={i} className="opportunity-row">
                        <div className={`opp-icon ${o.color}`}><Icon size={20} /></div>
                        <span>
                          <small>{o.type}</small>
                          <strong>{o.title}</strong>
                          <em>{o.detail}</em>
                        </span>
                        <ArrowUpRight size={16} className="text-ink-soft" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community */}
        <section id="section-6" className="snap-section" data-index={6}>
          <div className="community-section">
            <div className="community-layout reveal-element delay-1">
              <div>
                <h2>A campus<br />feels<br /><em>different</em><br />when<br />you can see<br />it.</h2>
                <p>Every connection gives the place a little more shape. Follow the movement without adding to the noise.</p>
                <Link to="/auth" className="text-link mt-4">Add your signal <ArrowUpRight size={14} /></Link>
              </div>
              <div className="activity-board">
                <div className="activity-head">
                  Recent movement <span>Updated moments ago <i></i></span>
                </div>
                <div className="activity-list">
                  <div className="activity-row">
                    <div className="activity-avatar rose">N</div>
                    <span><strong>Neel joined</strong><small>The local food atlas</small></span>
                    <time>12 min</time>
                  </div>
                  <div className="activity-row">
                    <div className="activity-avatar blue">A</div>
                    <span><strong>Alisha saved</strong><small>Sangam studio sessions</small></span>
                    <time>1 hr</time>
                  </div>
                  <div className="activity-row">
                    <div className="activity-avatar sand"><UsersRound size={16} /></div>
                    <span><strong>Your profile appeared</strong><small>in 8 searches this week</small></span>
                    <time>Yesterday</time>
                  </div>
                </div>
                <Link to="/auth" className="activity-footer">
                  <span className="flex items-center gap-2"><UsersRound size={14} /> 28 students in your orbit</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="section-7" className="snap-section" data-index={7}>
          <div className="snap-content-wrapper w-full h-full flex flex-col justify-end">
            <div className="final-cta bg-[#7f1d3b] text-center text-white py-24 px-8 mt-auto relative overflow-hidden w-full flex-1 flex flex-col justify-center">

              <div className="relative z-10 reveal-element delay-1">
                <h2 className="font-display text-[clamp(48px,6vw,84px)] my-6 leading-none">Your next team<br />is already <em className="text-[#f2c7c9] not-italic">on campus.</em></h2>
                <Link to="/auth" className="button bg-white text-[#7f1d3b] hover:bg-[#f7ece8]">Join Sangam <ArrowRight size={16} /></Link>
              </div>

            </div>
            <footer className="landing-footer flex items-center justify-between py-8 px-[4vw] text-[10px] text-[#8a9198] w-full">
              <Link to="/" className="public-brand font-display text-[20px] text-ink flex items-center gap-2">
                <SangamEmblem size={20} className="text-maroon" />
              </Link>

              <div className="flex gap-4 font-bold text-ink">
                <Link to="/explore">Explore</Link>
                <Link to="/talent">Talent</Link>
                <Link to="/auth">Join</Link>
                <a href="#about">About</a>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
