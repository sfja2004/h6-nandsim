import { useEffect, useState, type ReactElement, type RefObject } from "react";
import type { Editor } from "./Editor";

type Props = { editor: Editor; canvasRef: RefObject<HTMLCanvasElement | null> };

function useUpdate(): [number, () => void] {
  const [value, setValue] = useState(0);
  return [value, () => setValue(value + 1)] as const;
}

function Toolbar({ editor, canvasRef }: Props): ReactElement {
  const [uid, update] = useUpdate();

  useEffect(() => {
    const handle = editor.addUpdateAction(() => update());
    return () => editor.removeUpdateAction(handle);
  });

  return (
    <>
      <div className="Toolbar">
        {editor.tools().map((tool, key) => (
          <button
            key={`${uid}${key}`}
            className={editor.selectedTool() === tool ? "active" : ""}
            onClick={() => {
              editor.selectTool(tool);
              canvasRef.current?.focus();
            }}
          >
            {tool}
          </button>
        ))}
      </div>
    </>
  );
}

export default Toolbar;
