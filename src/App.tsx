import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { useState, useEffect } from "react";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { HtmlDiff } from "./HtmlDiff.ts";
function App() {
  // editor 实例
  const [editor, setEditor] = useState<IDomEditor | null>(null); // TS 语法
  // const [editor, setEditor] = useState(null)                   // JS 语法

  // 编辑器内容
  const [html, setHtml] = useState("");
  const [oldHtml, setOldHtml] = useState("");
  const [isNeed, setIsNeed] = useState(false);

  useEffect(() => {
    const html = window.localStorage.getItem("html");
    if (html) {
      setTimeout(() => {
        setHtml(html);
        setOldHtml(html);
      }, 50);
    }
  }, []);

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {}; // TS 语法

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    // TS 语法
    placeholder: "请输入内容...",
  };

  // 及时销毁 editor ，重要！
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);
  const handlePublish = () => {
    const htmlDiff = new HtmlDiff();
    const { diffHtml } = htmlDiff.diff_launch(oldHtml, html);
    setHtml(diffHtml);
    window.localStorage.setItem("html", diffHtml);
  };
  return (
    <>
      <button onClick={handlePublish}> 发布文章</button>
      <label htmlFor="isNeed">
        <input
          type={"checkbox"}
          id={"isNeed"}
          checked={isNeed}
          onChange={(e) => {
            setIsNeed(e.target.checked);
          }}
        />
        <span>是否需要深度解析</span>
      </label>
      <div style={{ border: "1px solid #ccc", zIndex: 100 }}>
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ borderBottom: "1px solid #ccc" }}
        />
        <Editor
          defaultConfig={editorConfig}
          value={html}
          onCreated={setEditor}
          onChange={(editor) => setHtml(editor.getHtml())}
          mode="default"
          style={{ height: "500px", overflowY: "hidden" }}
        />
      </div>
    </>
  );
}

export default App;
