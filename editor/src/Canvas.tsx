import { useEffect, useRef, type ReactElement } from "react";
import "./Canvas.css";
import { V2, type Editor } from "./Editor";

type Props = { editor: Editor };

function Canvas({ editor }: Props): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    editor.render(ref.current);
  });

  return (
    <>
      <div className="EditorView">
        <canvas
          ref={ref}
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
            editor.mouseMove(V2(ev.movementX, ev.movementY));
            editor.renderIfNeeded(ev.target as HTMLCanvasElement);
          }}
          onKeyDown={(ev) => {
            console.log(ev.key);
          }}
          onKeyUp={(ev) => {
            console.log(ev.key);
          }}
        />
      </div>
    </>
  );
}

export default Canvas;
