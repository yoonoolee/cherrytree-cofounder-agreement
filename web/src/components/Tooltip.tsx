/**
 * Tooltip - explanatory text for a question. Always optional, renders
 * right after the question and before the answer options.
 */
function Tooltip({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="card-hint">{text}</p>;
}

export default Tooltip;
