import { useEffect, useState, type ReactElement, type RefObject } from "react";
import type { Editor } from "./editor/Editor";

type Props = { editor: Editor; canvasRef: RefObject<HTMLCanvasElement | null> };

function Tabbar({ editor, canvasRef }: Props): ReactElement {
  const [updateId, update] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() =>
    editor.events.subscribe(["ShowSelectedTab"], (ev) => {
      setSelectedTab(ev.idx);
      update(updateId + 1);
    }),
  );

  return (
    <>
      <div className="Tabbar">
        <div>
          {editor.availableBoardEditors().map((tab, idx) => (
            <button
              key={`${idx}${updateId}`}
              className={selectedTab === idx ? "active" : ""}
              onClick={() => {
                editor.events.send({ tag: "SelectTab", idx });
              }}
            >
              {tab}
            </button>
          ))}
          <button
            className="add"
            onClick={() => {
              editor.events.send({ tag: "CreateTab" });
              canvasRef.current?.focus();
            }}
          >
            +
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              editor.events.send({ tag: "SaveComponent" });
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              const name = prompt("New component name:");
              if (!name) return;
              editor.events.send({ tag: "RenameComponent", newName: name });
            }}
          >
            Rename
          </button>
          <button
            onClick={() => {
              editor.events.send({ tag: "CloseComponent" });
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export default Tabbar;
