import { useRef, useState, type ReactElement } from "react";
import "./style.css";
import Canvas from "./Canvas";
import { Editor } from "./editor/Editor";
import Toolbar from "./Toolbar";
import Tabbar from "./Tabbar";

function App(): ReactElement {
  const [editor] = useState(() => new Editor());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <>
      <h1>nandsim</h1>
      <div className="Editor">
        <div>
          <Toolbar editor={editor} canvasRef={canvasRef} />
        </div>
        <main>
          <Tabbar editor={editor} />
          <Canvas editor={editor} canvasRef={canvasRef} />
        </main>
      </div>
    </>
  );
}

export default App;
