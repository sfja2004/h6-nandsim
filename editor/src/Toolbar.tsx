import type { ReactElement } from "react";
import type { Editor } from "./Editor";

type Props = { editor: Editor };

function Toolbar({ editor }: Props): ReactElement {
  return (
    <>
      <div>
        <button onClick={() => editor.selectTool("and")}>and</button>
        <button onClick={() => editor.selectTool("not")}>not</button>
        <button onClick={() => editor.selectTool("pin in")}>pin in</button>
        <button onClick={() => editor.selectTool("pin out")}>pin out</button>
      </div>
    </>
  );
}

export default Toolbar;
