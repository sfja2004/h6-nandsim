import { useState, type ReactElement } from "react";
import "./App.css";
import Canvas from "./Canvas";
import { Editor } from "./Editor";
import Toolbar from "./Toolbar";

function App(): ReactElement {
  const [editor] = useState(new Editor());

  return (
    <>
      <h1>nandsim</h1>
      <Canvas editor={editor} />
      <Toolbar editor={editor} />
    </>
  );
}

export default App;
