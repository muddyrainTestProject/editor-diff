import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { useState, useEffect, useMemo } from "react";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { HtmlDiff } from "./HtmlDiff.ts";
function App() {
  const [editor, setEditor] = useState<IDomEditor | null>(null); // TS 语法
  const [list, setList] = useState<
    {
      content: string;
      diffHtml: string;
      time: number;
      version: number;
    }[]
  >([]); // TS 语法
  // 编辑器内容
  const [html, setHtml] = useState("");
  const [oldHtml, setOldHtml] = useState("");
  const [isNeed, setIsNeed] = useState(true);
  const [currentVersion, setCurrentVersion] = useState(-1);
  const [isShowHistory, setIsShowHistory] = useState(false);
  useEffect(() => {
    const html = window.localStorage.getItem("html");
    const list = window.localStorage.getItem("list");
    const currentVersion = window.localStorage.getItem("currentVersion");
    setTimeout(() => {
      setHtml(html || "");
      setOldHtml(html || "");
      setCurrentVersion(currentVersion ? Number(currentVersion) : -1);
      setList(list ? JSON.parse(list) : []);
    }, 50);
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
    setHtml(html);
    setOldHtml(html);
    window.localStorage.setItem("html", html);
    if (!isNeed) return;
    const newList = [
      {
        time: Date.now(),
        content: html,
        diffHtml: diffHtml,
        version: currentVersion + 1,
      },
      ...list,
    ];
    setList(newList);
    setCurrentVersion((currentVersion) => {
      window.localStorage.setItem("currentVersion", String(currentVersion + 1));
      return currentVersion + 1;
    });
    window.localStorage.setItem("list", JSON.stringify(newList));
  };
  const currentHtml = useMemo(() => {
    if (currentVersion === -1) return html;
    const item = list.find((item) => item.version === currentVersion);
    if (isShowHistory) {
      return item?.diffHtml || html;
    }
    return item?.content || html;
  }, [html, currentVersion, list, isShowHistory]);
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
      <button
        onClick={() => {
          setList([]);
          window.localStorage.removeItem("html");
          window.localStorage.removeItem("list");
          window.localStorage.removeItem("currentVersion");
          setHtml("");
          setOldHtml("");
          setCurrentVersion(0);
        }}
      >
        清除记录
      </button>
      <span>当前版本：{currentVersion > -1 ? currentVersion : "未发布"}</span>
      <div
        style={{
          display: "flex",
        }}
      >
        <div style={{ border: "1px solid #ccc", zIndex: 100 }}>
          <Toolbar
            editor={editor}
            defaultConfig={toolbarConfig}
            mode="default"
            style={{ borderBottom: "1px solid #ccc" }}
          />
          <Editor
            defaultConfig={editorConfig}
            value={currentHtml}
            onCreated={setEditor}
            onChange={(editor) => {
              setHtml(editor.getHtml());
            }}
            mode="default"
            style={{ height: "500px", overflowY: "hidden" }}
          />
        </div>
        <div
          style={{
            width: 360,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 25,
              padding: "10px 20px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>历史版本</h2>
            <button
              onClick={() => {
                setCurrentVersion(list[0]?.version);
                setIsShowHistory(false);
                editor?.enable();
              }}
            >
              关闭
            </button>
          </div>
          <ul>
            {list.map((item) => (
              <li
                key={item.time}
                style={{
                  cursor: "pointer",
                  borderBottom: "1px solid #ccc",
                  padding: "10px",
                }}
                onClick={() => {
                  setCurrentVersion(item.version);
                  setIsShowHistory(true);
                  editor?.disable();
                }}
              >
                <div>版本：{item.version}</div>
                <div>时间：{new Date(item.time).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default App;
