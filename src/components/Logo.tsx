import { Link } from "react-router-dom";

interface LogoProps {
  compact?: boolean;
  to?: string;
}

export function Logo({ compact = false, to = "/" }: LogoProps) {
  return (
    <Link className="brand" to={to} aria-label="TrackVitta home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      {!compact && <span>TrackVitta</span>}
    </Link>
  );
}
