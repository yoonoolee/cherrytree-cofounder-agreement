import type { WebSource } from '@cherrytree/shared';

/** Only http(s) links are rendered: the URLs come from model output. */
function isWebUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** The web pages an answer relied on, shown as links (required for web search output). */
function SourceLinks({ sources }: { sources: readonly WebSource[] }) {
  const links = sources.filter((source) => isWebUrl(source.url));
  if (links.length === 0) return null;
  return (
    <ul aria-label="Sources" className="mt-3 flex flex-col gap-1 text-sm">
      {links.map((source, i) => (
        <li key={i}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:opacity-80"
          >
            {source.title || new URL(source.url).hostname}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default SourceLinks;
