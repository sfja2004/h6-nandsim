import { useState, type ReactElement } from "react";
import "./style.css";
import Canvas from "./Canvas";
import { Editor } from "./Editor";
import Toolbar from "./Toolbar";

function App(): ReactElement {
  const [editor] = useState(new Editor());

  return (
    <>
      <h1>nandsim</h1>
      <div className="Editor">
        <Toolbar editor={editor} />
        <Canvas editor={editor} />
      </div>
    </>
  );
}

export default App;
