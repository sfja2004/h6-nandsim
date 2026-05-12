import { useEffect, type ReactElement, type RefObject } from "react";
import { type Editor } from "./editor/Editor";
import { V2 } from "./editor/V2";

type Props = { editor: Editor; canvasRef: RefObject<HTMLCanvasElement | null> };

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
          width={1000}
          height={1000}
          style={{ width: 1000, height: 1000, backgroundColor: "black" }}
          tabIndex={0}
          onMouseDown={(ev) => {
            const pos = V2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.mouseDown(pos);
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onMouseUp={(ev) => {
            const pos = V2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.mouseUp(pos);
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onMouseMove={(ev) => {
            const deltaPos = V2(ev.movementX, ev.movementY);
            const pos = V2(ev.nativeEvent.offsetX, ev.nativeEvent.offsetY);
            editor.mouseMove(deltaPos, pos);
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onKeyDown={(ev) => {
            editor.keyDown(ev.key);
          }}
          onKeyUp={(ev) => {
            editor.keyUp(ev.key);
          }}
        />
      </div>
    </>
  );
}

export default Canvas;
