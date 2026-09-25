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
  X,
  ArrowDown
} from "lucide-react";
import { SangamEmblem } from "../components/ui/SangamLogo.jsx";
import { api } from "../services/api.js";
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



function AnimatedStat({ end, suffix, label, icon: Icon, colorClass, textClass }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="flex items-center gap-4">
      <div className={`flex items-center justify-center w-14 h-14 rounded-full shadow-sm ${colorClass} ${textClass}`}>
        <Icon size={24} />
      </div>
      <div className="flex flex-col justify-center">
        <span className="font-display font-bold text-4xl sm:text-5xl leading-none text-ink tracking-tight">{count}{suffix}</span>
        <span className="text-xs sm:text-sm text-ink-soft uppercase tracking-wider font-bold mt-1.5">{label}</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const activeSection = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [platformStats, setPlatformStats] = useState({ openProjects: 0, totalUsers: 0 });

  useEffect(() => {
    api.getPlatformStats()
      .then((data) => {
        if (data && typeof data.openProjects === 'number') {
          setPlatformStats({ openProjects: data.openProjects, totalUsers: data.totalUsers });
        }
      })
      .catch(() => { /* silently fall back to defaults */ });
  }, []);

  const steps = [
    { title: "Discover", copy: "See the projects, skills, and open calls already taking shape." },
    { title: "Connect", copy: "Find the person whose point of view unlocks your next step." },
    { title: "Collaborate", copy: "Share a brief, make a plan, and let the work get specific." },
    { title: "Build", copy: "Turn a good idea into something the campus can feel." }
  ];

  return (
    <div className="landing-site relative">
      {/* Background Grid Lines */}
      <div className="fixed inset-0 pointer-events-none flex justify-center z-0 overflow-hidden">
        <div className={`w-[min(1400px,calc(100%-8vw))] h-full relative border-l border-r border-dashed transition-colors duration-500 ${activeSection === 6 ? 'border-white/20' : 'border-black/20'}`}>
          <div className={`absolute top-[67px] w-[100vw] left-1/2 -translate-x-1/2 border-t border-dashed transition-colors duration-500 ${activeSection === 6 ? 'border-white/20' : 'border-black/20'}`}></div>
          <div className={`absolute top-[113px] w-[100vw] left-1/2 -translate-x-1/2 border-t border-dashed transition-colors duration-500 ${activeSection === 6 ? 'border-white/20' : 'border-black/20'}`}></div>
        </div>
      </div>

      <header className="landing-nav z-50">
        <div className="w-full h-full flex items-center justify-between">
          <Link to="/" className="public-brand">
            <SangamEmblem size={32} className="text-ink" />
          </Link>
          <nav className={menuOpen ? "is-open" : ""}>
            <a href="#about">About</a>
            <a href="#explore">Opportunities</a>
            <a href="#talent">Find Talent</a>

            <Link to="/auth" className="button button-primary nav-cta">Login <ArrowRight size={16}></ArrowRight></Link>
          </nav>
          <button className="landing-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main>


        {/* Hero Section */}
        <section id="section-0" className="snap-section relative" data-index={0}>
          <div className="snap-content-wrapper relative z-10">
            <div className="landing-hero">
              <div className="hero-copy reveal-element delay-1">
                <h1>Where campus<br /><em>ideas find</em> their<br />people.</h1>

                <div className="hero-actions flex gap-4 mt-8">
                  <Link to="/explore" className="button button-primary">Explore Sangam <ArrowRight size={16} /></Link>
                  <Link to="/talent" className="font-bold text-ink hover:text-maroon transition-colors text-sm flex items-center">Find your team</Link>
                </div>
              </div>
              <div className="hero-network reveal-element delay-2">
                <img src="/hero-image.png" alt="People building together" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#8e9499] font-medium text-[13px] reveal-element delay-3 z-20">
            Scroll to find your people
            <ArrowDown size={20} />
          </div>
        </section>

        {/* The Problem Section */}
        <section id="section-1" className="snap-section" data-index={1}>
          <div className="story-section w-full" id="about">
            <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-16 items-center w-full">
              {/* Left Column */}
              <div className="flex flex-col gap-5 reveal-element delay-2 mt-4 md:mt-8">
                <img src="/about-illustration.png" alt="Video call illustration" className="w-full max-w-[380px] h-auto object-contain drop-shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = "/hero-image.png"; }} />
                <div className="bg-[#e9ded4] rounded-2xl p-6 max-w-[320px]">
                  <h3 className="font-display text-[22px] text-maroon font-semibold leading-[1.15] mb-2">Make the invisible<br/>easy to find.</h3>
                  <p className="text-[#667182] text-[12px] leading-[1.6] mb-4">One calm layer for campus energy where people, projects and possibilities can meet before they become obvious.</p>
                  <Link to="/auth" className="inline-flex items-center gap-2 text-ink font-medium text-[12px] hover:text-maroon transition-colors">Join the network <ArrowRight size={14} /></Link>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col items-end text-right reveal-element delay-1">
                <h2 className="font-display font-normal text-[clamp(32px,4vw,60px)] leading-[1.1] mb-8 text-ink">
                  Good people are<br />
                  <span className="text-maroon">hard to find</span> in a<br />
                  busy place.
                </h2>

                <div className="w-full max-w-[500px] flex flex-col">
                  {/* Item 1 */}
                  <div className="py-5 border-b border-dashed border-black/15">
                    <div className="flex justify-end items-center gap-3 mb-1">
                      <h3 className="font-sans font-medium text-[24px] text-ink">Ideas Stay in notebooks.</h3>
                      <span className="font-display font-bold text-[24px] text-maroon">01</span>
                    </div>
                    <p className="text-[#667182] text-[14px] leading-relaxed pr-10">Because there is no obvious place<br/>to share the half-formed version.</p>
                  </div>

                  {/* Item 2 */}
                  <div className="py-5 border-b border-dashed border-black/15">
                    <div className="flex justify-end items-center gap-3 mb-1">
                      <h3 className="font-sans font-medium text-[24px] text-ink">Talent stays invisible.</h3>
                      <span className="font-display font-bold text-[24px] text-maroon">02</span>
                    </div>
                    <p className="text-[#667182] text-[14px] leading-relaxed pr-10">Because a timetable can't show<br/>thinks in the same direction.</p>
                  </div>

                  {/* Item 3 */}
                  <div className="py-5">
                    <div className="flex justify-end items-center gap-3 mb-1">
                      <h3 className="font-sans font-medium text-[24px] text-ink">Opportunities pass by.</h3>
                      <span className="font-display font-bold text-[24px] text-maroon">03</span>
                    </div>
                    <p className="text-[#667182] text-[14px] leading-relaxed pr-10">Because the best campus moments<br/>move faster than a noticeboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="section-2" className="snap-section" data-index={2}>
          <div className="how-section w-full max-w-[1200px] mx-auto px-4 md:px-0">
            {/* Top Row: Heading & Illustration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-8">
              <div className="reveal-element delay-1">
                <h2 className="font-display font-normal text-[clamp(32px,4vw,60px)] leading-[1.1] mb-4 text-ink">
                  Make the<br />
                  <span className="text-maroon">next step</span><br />
                  visible.
                </h2>
                <p className="text-[#667182] text-[14px] md:text-[15px] leading-relaxed max-w-sm">
                  There is no perfect starting point. Sangam gives every kind of momentum somewhere to go.
                </p>
              </div>
              <div className="reveal-element delay-2 flex justify-center md:justify-end">
                <img src="/third.png" alt="People connecting concepts" className="w-full max-w-[380px] h-auto object-contain" onError={(e) => { e.target.onerror = null; e.target.src = "/hero-image.png"; }} />
              </div>
            </div>

            {/* Bottom Row: Steps */}
            <div className="border-t border-dashed border-black/15 pt-12 reveal-element delay-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((item, index) => (
                  <div key={item.title} className="flex flex-col">
                    <h3 className="font-sans font-medium text-[22px] md:text-[24px] text-ink mb-3 flex gap-2 items-baseline">
                      <span className="font-bold text-[20px] md:text-[22px]">0{index + 1}</span>
                      {item.title}
                    </h3>
                    <p className="text-[#667182] text-[13px] md:text-[14px] leading-relaxed">
                      {item.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Project Showcase Section */}
        <section id="section-3" className="snap-section" data-index={3}>
          <div className="showcase-section w-full max-w-[1200px] mx-auto px-4 md:px-0" id="explore">
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 reveal-element delay-1 border-b border-dashed border-black/15 mb-10">
              <h2 className="font-display font-normal text-[clamp(32px,4vw,60px)] leading-[1.1] text-ink">
                Something worth<br />
                <span className="text-maroon">joining.</span>
              </h2>
              <div className="mt-6 md:mt-0 mb-2 md:mb-4">
                <Link to="/explore" className="text-link">View all projects <ArrowUpRight size={15} /></Link>
              </div>
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
          <div className="talent-section w-full max-w-[1200px] mx-auto px-4 md:px-0" id="talent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 reveal-element delay-1 border-b border-dashed border-black/15 mb-8 items-end">
              <div>
                <h2 className="font-display font-normal text-[clamp(32px,4vw,60px)] leading-[1.15] text-ink">
                  The missing<br />
                  piece <span className="text-maroon">might</span><br />
                  <span className="text-maroon">be closer.</span>
                </h2>
              </div>
              <div className="flex flex-col items-end gap-4 justify-end">
                <img src="/fourth.png" alt="People at whiteboard" className="w-full max-w-[380px] h-auto object-contain" onError={(e) => { e.target.onerror = null; e.target.src = "/hero-image.png"; }} />
                <div className="mb-2">
                  <Link to="/talent" className="text-link">Meet the network <ArrowUpRight size={15} /></Link>
                </div>
              </div>
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

        {/* Community */}
        <section id="section-5" className="snap-section" data-index={5}>
          <div className="community-section w-full max-w-[1200px] mx-auto px-4 md:px-0">
            <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-16 items-center">
              <div className="reveal-element delay-1">
                <h2 className="font-display font-normal text-[clamp(40px,5vw,72px)] leading-[1.1] mb-6 text-ink">
                  A campus<br/>
                  <span className="text-maroon">feels different</span><br/>
                  when you can<br/>
                  see it.
                </h2>
                <p className="text-[#667182] text-[16px] leading-relaxed max-w-md">
                  Every network gives the place a little more shape. Follow the movement without adding to the noise.
                </p>
              </div>
              
              <div className="reveal-element delay-2 flex justify-center md:justify-end">
                <div className="w-full max-w-[460px] bg-[#ebe0d5] rounded-[20px] border-[3px] border-[#3b82f6] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[14px] font-medium text-[#7a2232]">Recent movements</span>
                    <span className="text-[12px] font-medium text-[#7a2232] flex items-center gap-1.5">
                      Updated moments ago <span className="w-2 h-2 rounded-full bg-[#83cc15]"></span>
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-4 mb-6">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-[#f6d4b9] text-[#c74e3a] flex items-center justify-center font-bold text-[15px] flex-shrink-0">
                          AR
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-bold text-[#7a2232] truncate leading-snug">Ishan Chetwani</div>
                          <div className="text-[13px] text-[#4d161f] truncate mt-0.5">B-Tech CS & AI · Class of 2029</div>
                        </div>
                        <div className="text-[13px] font-medium text-[#7a2232] whitespace-nowrap">
                          12 mins
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-5 border-t border-dashed border-black/10 flex justify-between items-center">
                    <div className="bg-[#e2cebc] text-[#ad3a44] text-[13px] font-bold px-4 py-2 rounded-full flex items-center gap-2">
                      <UsersRound size={15} /> 30 students in your network
                    </div>
                    <Link to="/auth" className="bg-[#e2cebc] text-[#ad3a44] text-[13px] font-bold px-5 py-2 rounded-full flex items-center gap-1.5 hover:bg-[#d9c4b1] transition-colors">
                      Connect <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="section-6" className="snap-section relative flex flex-col justify-between overflow-hidden !p-0" data-index={6}>
          {/* Background Gradient */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#e28e6e] via-[#8c2a3e] to-[#3a0d15]"></div>
          <div className="absolute inset-0 z-0 bg-black/5 backdrop-blur-[60px]"></div>

          <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-4 pt-24">
            <h2 className="font-display font-normal text-[clamp(40px,5vw,72px)] text-white text-center leading-[1.15] mb-8">
              Your next team<br />
              is already on campus.
            </h2>
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-white font-medium transition-all backdrop-blur-md text-[16px]">
              Join us now <ArrowUpRight size={18} />
            </Link>
          </div>
          
          <footer className="w-full relative z-10 border-t border-b border-dashed border-white/30 py-6 mb-8 mt-auto px-4 md:px-12">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <Link to="/" className="footer-logo flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                <SangamEmblem size={24} className="text-white" />
              </Link>
              <div className="flex items-center gap-6 md:gap-8 text-white/90 text-[14px] font-medium">
                <a href="#talent" className="hover:text-white transition-colors">Find Talent</a>
                <a href="#explore" className="hover:text-white transition-colors">Opportunities</a>
                <a href="#about" className="hover:text-white transition-colors">About</a>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
