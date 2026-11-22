import { Link } from 'react-router';

interface ErrorStateProps {
  title: string;
  body: string;
  /** Shown as the main button when the failure can be retried. */
  onRetry?: () => void;
}

/** A screen that couldn't load: what happened, a retry when there is one, and a way back. */
function ErrorState({ title, body, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex min-h-[55vh] flex-1 flex-col justify-center">
      <h1 className="animate-rise font-ui text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl animate-rise text-base text-ink-muted [animation-delay:60ms]">
        {body}
      </p>
      <div className="mt-10 flex animate-rise items-center gap-6 [animation-delay:120ms]">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper transition-opacity hover:opacity-85"
          >
            Try again
          </button>
        )}
        <Link to="/dashboard" className="text-sm text-ink-muted underline-offset-4 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default ErrorState;
