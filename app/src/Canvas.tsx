import { useEffect, type ReactElement, type RefObject } from "react";
import { type Editor } from "./editor/Editor";
import { v2 } from "./editor/V2";

type Props = {
  editor: Editor;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

function Canvas({ editor, canvasRef }: Props): ReactElement {
  useEffect(() => {
    if (canvasRef.current) {
      editor.render(canvasRef.current);
    }

    const unsubscribe = editor.events.subscribe(["RenderRequest"], (_ev) => {
      if (canvasRef.current) {
        editor.render(canvasRef.current);
      }
    });

    function onResize() {
      if (canvasRef.current) {
        editor.render(canvasRef.current);
      }
    }

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      unsubscribe();
    };
  });

  return (
    <>
      <div className="Canvas">
        <canvas
          ref={canvasRef}
          style={{ backgroundColor: "black" }}
          tabIndex={0}
          onMouseDown={(ev) => {
            const pos = v2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.events.send({ tag: "MouseDown", pos });
          }}
          onMouseUp={(ev) => {
            const pos = v2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.events.send({ tag: "MouseUp", pos });
          }}
          onMouseMove={(ev) => {
            const deltaPos = v2(ev.movementX, ev.movementY);
            const pos = v2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.events.send({ tag: "MouseMove", pos, deltaPos });
          }}
          onMouseLeave={(_ev) => {
            editor.events.send({ tag: "MouseLeave" });
          }}
          onKeyDown={(ev) => {
            editor.events.send({ tag: "KeyDown", key: ev.key });
          }}
          onKeyUp={(ev) => {
            editor.events.send({ tag: "KeyUp", key: ev.key });
          }}
        />
      </div>
    </>
  );
}

export default Canvas;
