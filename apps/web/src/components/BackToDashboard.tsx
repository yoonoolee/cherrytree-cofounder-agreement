import { Link } from 'react-router';

/** The way back from a project screen to the dashboard. */
function BackToDashboard() {
  return (
    <Link
      to="/dashboard"
      className="text-[0.8125rem] text-ink-muted transition-colors hover:text-ink"
    >
      <span aria-hidden>← </span>Dashboard
    </Link>
  );
}

export default BackToDashboard;
