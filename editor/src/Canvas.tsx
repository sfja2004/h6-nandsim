import { useEffect, type ReactElement, type RefObject } from "react";
import { type Editor } from "./editor/Editor";
import { v2 } from "./editor/V2";

type Props = {
  editor: Editor;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

function Canvas({ editor, canvasRef }: Props): ReactElement {
  useEffect(() => {
    if (!canvasRef.current) return;

    editor.render(canvasRef.current);
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
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onMouseUp={(ev) => {
            const pos = v2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.events.send({ tag: "MouseUp", pos });
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onMouseMove={(ev) => {
            const deltaPos = v2(ev.movementX, ev.movementY);
            const pos = v2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.events.send({ tag: "MouseMove", pos, deltaPos });
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onMouseLeave={(ev) => {
            editor.events.send({ tag: "MouseLeave" });
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onKeyDown={(ev) => {
            editor.events.send({ tag: "KeyDown", key: ev.key });
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onKeyUp={(ev) => {
            editor.events.send({ tag: "KeyUp", key: ev.key });
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
        />
      </div>
    </>
  );
}

export default Canvas;
