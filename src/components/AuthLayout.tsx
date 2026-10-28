import type { ReactNode } from "react";
import heroImage from "../assets/hero.png";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <Logo to="/login" />

        <div className="auth-story">
          <span className="auth-kicker">
            <Icon name="sparkles" />
            Built for growing local businesses
          </span>
          <h1>
            Every member.
            <br />
            One calm place.
          </h1>
          <p>
            Run memberships, business spaces, and daily operations without
            losing the human details.
          </p>

          <div className="visual-board">
            <div className="visual-orbit" />
            <img src={heroImage} alt="" />
            <div className="floating-card floating-card-top">
              <span className="card-icon"><Icon name="users" /></span>
              <span>
                <strong>128 members</strong>
                <small>Across 3 active spaces</small>
              </span>
            </div>
            <div className="floating-card floating-card-bottom">
              <span className="status-dot" />
              <span>
                <strong>Everything in sync</strong>
                <small>Updated just now</small>
              </span>
            </div>
          </div>
        </div>

        <p className="auth-footnote">
          Thoughtful operations for gyms, classes, rentals, and more.
        </p>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
