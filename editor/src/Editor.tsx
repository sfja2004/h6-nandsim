import { useEffect, useRef, type ReactElement } from "react";
import "./Editor.css";

function Editor(): ReactElement {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    let offset = { x: 0, y: 0 };
    let dragging = false;

    const canvas = ref.current;
    const cx = canvas.getContext("2d")!;
    cx.imageSmoothingEnabled = false;

    const render = () => {
      cx.fillStyle = "white";
      cx.fillRect(0, 0, canvas.width, canvas.height);

      const gridSize = { x: 20, y: 20 };
      const dotSize = { x: 4, y: 4 };

      cx.fillStyle = "gray";
      for (let y = 0; y < canvas.width / gridSize.x + 1; ++y) {
        for (let x = 0; x < canvas.height / gridSize.y + 1; ++x) {
          cx.fillRect(
            (offset.x % gridSize.x) + x * gridSize.x - dotSize.x / 2,
            (offset.y % gridSize.y) + y * gridSize.y - dotSize.y / 2,
            dotSize.x,
            dotSize.y,
          );
        }
      }
    };

    function mousedownHandler(ev: MouseEvent) {
      dragging = true;
    }
    function mouseupHandler(ev: MouseEvent) {
      dragging = false;
    }
    function mousemoveHandler(ev: MouseEvent) {
      if (dragging) {
        offset.x += ev.movementX;
        offset.y += ev.movementY;
        render();
      }
    }

    canvas.addEventListener("mousedown", mousedownHandler);
    canvas.addEventListener("mouseup", mouseupHandler);
    canvas.addEventListener("mousemove", mousemoveHandler);

    render();

    return () => {
      canvas.removeEventListener("mousedown", mousedownHandler);
      canvas.removeEventListener("mouseup", mouseupHandler);
      canvas.removeEventListener("mousemove", mousemoveHandler);
    };
  });

  return (
    <>
      <div className="Editor">
        <canvas
          ref={ref}
          width={1000}
          height={1000}
          style={{ width: 1000, height: 1000, backgroundColor: "black" }}
        />
      </div>
    </>
  );
}

export default Editor;
