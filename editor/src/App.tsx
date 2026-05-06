import { type ReactElement } from "react";
import "./App.css";
import Editor from "./Editor";

function App(): ReactElement {
  return (
    <>
      <h1>nandsim</h1>
      <Editor></Editor>
    </>
  );
}

export default App;
