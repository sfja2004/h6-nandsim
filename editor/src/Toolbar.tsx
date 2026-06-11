import { useEffect, useState, type ReactElement, type RefObject } from "react";
import type { Editor } from "./editor/Editor";

type Props = { editor: Editor; canvasRef: RefObject<HTMLCanvasElement | null> };

function Toolbar({ editor, canvasRef }: Props): ReactElement {
  const [updateId, update] = useState(0);
  const [selectedTool, setSelectedTool] = useState("select");

  useEffect(() =>
    editor.events.subscribe(["ShowSelectedTool"], (ev) => {
      update(updateId + 1);
      setSelectedTool(ev.tool);
    }),
  );

  return (
    <>
      <div className="Toolbar">
        <h2>Toolbar</h2>
        <div>
          {editor.availableTools().map((tool, key) => (
            <button
              key={key}
              className={selectedTool === tool ? "active" : ""}
              onClick={() => {
                editor.events.send({ tag: "SelectTool", tool });
                canvasRef.current?.focus();
              }}
              onDoubleClick={() => {
                editor.events.send({ tag: "OpenTabWithTool", tool });
                canvasRef.current?.focus();
              }}
            >
              {tool}
            </button>
          ))}
        </div>
        <div></div>
      </div>
    </>
  );
}

export default Toolbar;
