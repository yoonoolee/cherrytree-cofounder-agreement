/**
 * Standard - states the typical/default answer for a question (e.g. "The
 * standard is 4 years with a 1-year cliff"). Always optional, renders after
 * Tooltip and before the answer options.
 */
function Standard({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="card-hint">{text}</p>;
}

export default Standard;
