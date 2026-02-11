import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import siteLogo from "../assets/smart-hr-employee-logo.svg";

const Icon = ({ children }) => (
  <span className="landingIcon" aria-hidden="true">
    {children}
  </span>
);

function MarketingLanding() {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let rafId = 0;
    let rect = null;
    let clientX = 0;
    let clientY = 0;

    const apply = () => {
      rafId = 0;
      if (!rect) rect = el.getBoundingClientRect();

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cx = x - rect.width / 2;
      const cy = y - rect.height / 2;

      el.style.setProperty("--orbAx", `${cx * 0.025}px`);
      el.style.setProperty("--orbAy", `${cy * 0.025}px`);
      el.style.setProperty("--orbBx", `${cx * 0.014}px`);
      el.style.setProperty("--orbBy", `${cy * 0.014}px`);
    };

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(apply);
    };

    const onMove = (e) => {
      rect = el.getBoundingClientRect();
      clientX = e.clientX;
      clientY = e.clientY;
      schedule();
    };

    const onLeave = () => {
      rect = el.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
      schedule();
    };

    // Initialize centered
    onLeave();

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={rootRef} className="landingRoot landingViolet">
      <div className="liveMouseLayer" aria-hidden="true">
        <div className="liveOrb liveOrbA" />
        <div className="liveOrb liveOrbB" />
      </div>

      <header className="landingNav">
        <div className="landingNavInner">
          <div className="landingNavLeft">
            <button type="button" className="landingHamburger" aria-label="Open menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="landingBrand">
              <div className="landingBrandRow">
                <img className="siteLogo" src={siteLogo} alt="Smart HR- Employee" />
                <div className="landingLogo">SmartHR</div>
              </div>
            </div>
          </div>

          <nav className="landingMenu" aria-label="Primary">
            <a className="landingMenuLink" href="#about">About Us</a>
            <a className="landingMenuLink" href="#features">Projects</a>
            <a className="landingMenuLink" href="#highlights">Team</a>
            <a className="landingMenuLink" href="#proof">Blog</a>
          </nav>

          <div className="landingActions">
            <a className="landingCta" href="#contact">Talk to us</a>
            <Link className="landingAuth" to="/login">Sign in</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landingHero" aria-label="Hero">
          <div className="landingHeroBg" aria-hidden="true">
            <div className="violetBlob violetBlobA" />
            <div className="violetBlob violetBlobB" />
            <div className="violetBlob violetBlobC" />
            <div className="violetBlob violetBlobD" />
            <div className="violetHalo violetHaloA" />
            <div className="violetHalo violetHaloB" />
            <div className="violetHalo violetHaloC" />
          </div>
          <div className="landingHeroInner">
            <div className="landingHeroGrid">
              <div className="violetHeroCopy">
                <h1 className="landingTitle">Duis aute irure dolor in reprehenderit.</h1>
                <p className="landingSubtext">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ut labore et dolore
                  magna aliqua. Ut enim minim veniam, quis nostrud exercitation.
                </p>

                <div className="landingCtas">
                  <Link className="landingCta" to="/register">Get started</Link>
                  <a className="landingAuth" href="#features">See projects</a>
                </div>
              </div>

              <div className="violetHeroRight" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="features" className="landingSection" aria-label="Features">
          <div className="landingSectionInner">
            <div className="landingSectionHead">
              <h2 className="landingH2">Features built for operations</h2>
              <p className="landingP">
                Clean workflows, premium visuals, and responsive design — optimized for HR teams and field operations.
              </p>
            </div>

            <div className="landingCardGrid">
              <div className="landingCard">
                <Icon>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2a7 7 0 0 0-7 7v4l-2 3v1h18v-1l-2-3V9a7 7 0 0 0-7-7Z" fill="currentColor" opacity="0.9" />
                    <path d="M9.5 20a2.5 2.5 0 0 0 5 0h-5Z" fill="currentColor" opacity="0.7" />
                  </svg>
                </Icon>
                <div className="landingCardTitle">Notifications</div>
                <div className="landingCardText">Actionable updates for HR when work is completed.</div>
              </div>

              <div className="landingCard">
                <Icon>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h16v12H7l-3 3V4Z" fill="currentColor" opacity="0.9" />
                    <path d="M7 7h10v2H7V7Zm0 4h7v2H7v-2Z" fill="currentColor" opacity="0.65" />
                  </svg>
                </Icon>
                <div className="landingCardTitle">Team chat</div>
                <div className="landingCardText">Employees can send HR queries and driver directions.</div>
              </div>

              <div className="landingCard">
                <Icon>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 16l1.5-6.5A2 2 0 0 1 8.45 8h7.1a2 2 0 0 1 1.95 1.5L19 16" stroke="currentColor" strokeWidth="2" opacity="0.9" />
                    <path d="M7 16v3m10-3v3" stroke="currentColor" strokeWidth="2" opacity="0.7" />
                    <path d="M7 13h10" stroke="currentColor" strokeWidth="2" opacity="0.7" />
                  </svg>
                </Icon>
                <div className="landingCardTitle">Cab bookings</div>
                <div className="landingCardText">HR books cabs; drivers are auto-assigned when available.</div>
              </div>

              <div className="landingCard">
                <Icon>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="2" opacity="0.9" />
                    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" opacity="0.7" />
                  </svg>
                </Icon>
                <div className="landingCardTitle">Work assignments</div>
                <div className="landingCardText">Assign tasks with clarity; track completion with a single click.</div>
              </div>
            </div>
          </div>
        </section>

        <section id="highlights" className="landingSection" aria-label="Service highlights">
          <div className="landingSectionInner">
            <div className="landingSplit">
              <div>
                <h2 className="landingH2">Service highlights</h2>
                <p className="landingP">
                  Built as a clean, ready-to-integrate UI layer with a consistent component style and responsive layout.
                </p>

                <div className="landingBullets">
                  <div className="landingBullet">
                    <div className="landingBulletDot" />
                    <div>
                      <div className="landingBulletTitle">Premium UI</div>
                      <div className="landingBulletText">Rounded corners, soft shadows, and balanced spacing.</div>
                    </div>
                  </div>
                  <div className="landingBullet">
                    <div className="landingBulletDot" />
                    <div>
                      <div className="landingBulletTitle">Responsive by default</div>
                      <div className="landingBulletText">Looks clean on mobile, tablet, and desktop.</div>
                    </div>
                  </div>
                  <div className="landingBullet">
                    <div className="landingBulletDot" />
                    <div>
                      <div className="landingBulletTitle">Clear information architecture</div>
                      <div className="landingBulletText">Navigation and sections aligned to real workflows.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="landingGlass">
                <div className="landingGlassInner">
                  <div className="landingGlassTitle">Designed for corporate teams</div>
                  <div className="landingGlassText">
                    A clean, professional interface that can be integrated into your existing product quickly.
                  </div>
                  <div className="landingGlassGrid">
                    <div className="landingMetric">
                      <div className="landingMetricBig">99.9%</div>
                      <div className="landingMetricSmall">UI consistency</div>
                    </div>
                    <div className="landingMetric">
                      <div className="landingMetricBig">1</div>
                      <div className="landingMetricSmall">shared nav</div>
                    </div>
                    <div className="landingMetric">
                      <div className="landingMetricBig">4</div>
                      <div className="landingMetricSmall">core roles</div>
                    </div>
                    <div className="landingMetric">
                      <div className="landingMetricBig">∞</div>
                      <div className="landingMetricSmall">scalable</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="landingSection" aria-label="Stats and testimonials">
          <div className="landingSectionInner">
            <div className="landingSectionHead">
              <h2 className="landingH2">Proof in the details</h2>
              <p className="landingP">Elegant typography and a stats-first layout for leadership updates.</p>
            </div>

            <div className="landingStats">
              <div className="landingStat">
                <div className="landingStatBig">+42%</div>
                <div className="landingStatSmall">faster booking turnaround</div>
              </div>
              <div className="landingStat">
                <div className="landingStatBig">-30%</div>
                <div className="landingStatSmall">manual follow-ups</div>
              </div>
              <div className="landingStat">
                <div className="landingStatBig">24/7</div>
                <div className="landingStatSmall">role-based visibility</div>
              </div>
            </div>

            <div className="landingQuotes">
              <div className="landingQuote">
                <div className="landingQuoteText">
                  “The dashboard is clean and quick. HR bookings and driver updates are finally in one place.”
                </div>
                <div className="landingQuoteBy">Operations Lead</div>
              </div>
              <div className="landingQuote">
                <div className="landingQuoteText">
                  “The UI feels premium and modern, and it scales nicely across devices.”
                </div>
                <div className="landingQuoteBy">Engineering Manager</div>
              </div>
            </div>
          </div>
        </section>

        <footer id="contact" className="landingFooter" aria-label="Footer">
          <div className="landingFooterInner">
            <div>
              <div className="landingFooterBrand">SmartHR</div>
              <div className="landingFooterText">Corporate-ready UI for workforce operations.</div>
            </div>

            <div className="landingFooterCols">
              <div>
                <div className="landingFooterHead">Social</div>
                <div className="landingFooterLinks">
                  <a className="landingFooterLink" href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                  <a className="landingFooterLink" href="https://x.com" target="_blank" rel="noreferrer">
                    Twitter
                  </a>
                  <a className="landingFooterLink" href="https://github.com" target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                </div>
              </div>

              <div>
                <div className="landingFooterHead">Contact</div>
                <div className="landingFooterText">support@smarthr.example</div>
                <div className="landingFooterText">+1 (555) 010-000</div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default MarketingLanding;
