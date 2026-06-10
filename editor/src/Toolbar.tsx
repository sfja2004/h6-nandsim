import { useEffect, useState, type ReactElement, type RefObject } from "react";
import type { Editor } from "./editor/Editor";

type Props = { editor: Editor; canvasRef: RefObject<HTMLCanvasElement | null> };

function Toolbar({ editor, canvasRef }: Props): ReactElement {
  const [selectedTool, setSelectedTool] = useState("select");

  useEffect(() =>
    editor.events.subscribe(["ShowSelectedTool"], (ev) => {
      setSelectedTool(ev.tool);
    }),
  );

  return (
    <>
      <div className="Toolbar">
        {editor.tools().map((tool, key) => (
          <button
            key={`${key}`}
            className={selectedTool === tool ? "active" : ""}
            onClick={() => {
              editor.events.send({ tag: "SelectTool", tool });
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
