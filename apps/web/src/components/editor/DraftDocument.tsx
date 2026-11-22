import type { ReactNode } from 'react';
import type { Value } from 'platejs';
import { Plate, PlateContent, type PlateEditor } from 'platejs/react';

interface DraftDocumentProps {
  editor: PlateEditor;
  onChange: (value: Value) => void;
  /** After a mouse or keyboard selection ends. */
  onSelectEnd: () => void;
  /** The comment cards, in the margin beside the page. */
  margin?: ReactNode;
}

/** The agreement as a page on the desk: an editable sheet, with the comments in its margin. */
function DraftDocument({ editor, onChange, onSelectEnd, margin }: DraftDocumentProps) {
  return (
    <Plate editor={editor} onValueChange={({ value }) => onChange(value)}>
      <div
        className={`mx-auto grid w-full gap-[18px] ${
          margin
            ? 'max-w-[720px] xl:max-w-[1038px] xl:grid-cols-[minmax(0,720px)_300px]'
            : 'max-w-[720px]'
        }`}
      >
        <div className="min-w-0 animate-rise border border-sheet-edge bg-sheet shadow-[0_1px_0_rgb(45_42_34/4%),0_22px_48px_rgb(45_42_34/12%)]">
          <PlateContent
            aria-label="Cofounder agreement"
            spellCheck={false}
            onMouseUp={() => setTimeout(onSelectEnd, 0)}
            onKeyUp={(event) => event.shiftKey && onSelectEnd()}
            className="min-h-[880px] px-8 pt-14 pb-18 font-ui text-[0.84375rem] leading-[1.6] text-ink outline-none selection:bg-mark sm:px-16 [&_li]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-[1.2em] [&_ul]:list-disc [&_ul]:pl-[1.2em]"
          />
        </div>
        {margin}
      </div>
    </Plate>
  );
}

export default DraftDocument;
