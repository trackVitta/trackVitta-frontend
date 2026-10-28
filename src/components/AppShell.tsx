import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../services/session";
import { getInitials } from "../utils/format";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const session = getSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobileOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-head">
          <Logo to="/app" />
          <button
            className="icon-button sidebar-close"
            type="button"
            onClick={() => setMobileOpen(false)}
          >
            <Icon name="x" />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>

        <nav className="side-nav">
          <p>Workspace</p>
          <NavLink to="/app" end onClick={() => setMobileOpen(false)}>
            <Icon name="grid" />
            Overview
          </NavLink>
          <NavLink to="/app" onClick={() => setMobileOpen(false)}>
            <Icon name="briefcase" />
            Businesses
          </NavLink>
        </nav>

        <div className="sidebar-note">
          <span><Icon name="sparkles" /></span>
          <strong>Keep it simple</strong>
          <p>Your people and spaces, organized in one view.</p>
        </div>

        <div className="sidebar-account">
          <span className="avatar">{getInitials(session?.email ?? "TN")}</span>
          <span className="account-copy">
            <strong>{session?.email.split("@")[0]}</strong>
            <small>{session?.email}</small>
          </span>
          <button className="icon-button" type="button" onClick={logout}>
            <Icon name="logout" />
            <span className="sr-only">Log out</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="app-stage">
        <header className="mobile-header">
          <button
            className="icon-button"
            type="button"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" />
            <span className="sr-only">Open navigation</span>
          </button>
          <Logo compact to="/app" />
          <span className="avatar avatar-small">
            {getInitials(session?.email ?? "TN")}
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}
