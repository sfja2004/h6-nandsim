import { useEffect, useState, type ReactElement } from "react";
import type { Editor } from "./editor/Editor";

type Props = { editor: Editor };

function Tabbar({ editor }: Props): ReactElement {
  const [selectedTool, setSelectedTool] = useState("select");

  return (
    <>
      <div className="Tabbar">
        <button className="active">&lt;unnamed&gt;</button>
        <button>Component one</button>
        <button>Another components</button>
      </div>
    </>
  );
}

export default Tabbar;
