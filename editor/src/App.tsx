import { useRef, useState, type ReactElement } from "react";
import "./style.css";
import Canvas from "./Canvas";
import { Editor } from "./editor/Editor";
import Toolbar from "./Toolbar";

function App(): ReactElement {
  const [editor] = useState(() => new Editor());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <>
      <h1>nandsim</h1>
      <div className="Editor">
        <Toolbar editor={editor} canvasRef={canvasRef} />
        <Canvas editor={editor} canvasRef={canvasRef} width={800} height={800} />
      </div>
    </>
  );
}

export default App;
