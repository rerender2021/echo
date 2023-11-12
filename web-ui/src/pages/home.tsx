import { useEffect, useRef, useState } from "react";
import { socket } from "../lib";
import style from "./home.module.css";
import * as monaco from "monaco-editor";
import { loader, Editor } from "@monaco-editor/react";
import { Alert, Button, Card, Space } from "antd";

loader.config({ monaco });

type ErrorEventType = { log: string; message: string; link?: string };

export default function Home() {
  const refEditor = useRef(null);
  const refSubtitleList = useRef<string[]>([]);
  const refErrors = useRef<ErrorEventType[]>([]);
  const refIsConnectError = useRef<boolean>(false);
  const refLogHistory = useRef<string[]>([]);
  const [updateKey, setUpdateKey] = useState(Date.now());

  useEffect(() => {
    const editor = refEditor.current as any;
    if(refErrors.current.length === 0) {
      editor?.revealLine(editor.getModel().getLineCount() + 10);
    }
  }, [updateKey]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connect");
      refIsConnectError.current = false;
      setUpdateKey(Date.now());
    });

    socket.on("connect_error", (error) => {
      console.error("connect error", { error });
      refIsConnectError.current = true;
      refErrors.current = [];
      setUpdateKey(Date.now());
    });

    const update = (text: string) => {
      if (
        refSubtitleList.current[refSubtitleList.current.length - 1] !== text
      ) {
        const newSubtitleList = [...refSubtitleList.current, text];
        refSubtitleList.current = newSubtitleList;
        setUpdateKey(Date.now());
      }
    };

    let count = Number.MAX_SAFE_INTEGER;
    let prevSubtitle = { zh: "", en: "" };
    let timer: any;
    socket.on("subtitle", (value: { zh: string; en: string }) => {
      const newCount = value?.en?.length ?? 0;
      const isDecreasing = newCount < count;
      console.log("check", { isDecreasing, newCount, count });
      if (isDecreasing && prevSubtitle.en !== value.en) {
        if (prevSubtitle?.en || prevSubtitle?.zh) {
          console.log("new subtitle", { value });
          update(`${prevSubtitle?.en}\n${prevSubtitle?.zh}`);
          clearTimeout(timer);
        }
      }
      count = newCount;
      prevSubtitle = value;
    });

    socket.on("flush", () => {
      update(`${prevSubtitle?.en}\n${prevSubtitle?.zh}`);
    });

    socket.on("echo-error", (value: ErrorEventType) => {
      console.error("echo error", { value });
      refErrors.current = [...refErrors.current, value];
      setUpdateKey(Date.now());
    });

    socket.on("log-history", (value: { logHistory: string[] }) => {
      console.error("log history", { value });
      refLogHistory.current = [...value.logHistory];
      setUpdateKey(Date.now());
    });

  }, []);

  function handleEditorDidMount(editor: any) {
    refEditor.current = editor;
  }

  const editorValue = refErrors.current.length === 0 ? refSubtitleList.current.join("\n\n"): refLogHistory.current.join("\n\n");
  
  return (
    <div className={style.container}>
      <div className={style.header}>
        <a href="https://rerender2021.github.io/products/echo/" target="_blank">
          <img src="/logo.png" alt="logo" className={style.logo}></img>
        </a>
      </div>
      <div className={style.errors}>
        <Space
          direction="vertical"
          size="middle"
          style={{ display: "flex", alignItems: "flex-start" }}
        >
          {refIsConnectError.current && (
            <Alert
              message="Echo 尚未启动, 或无法连接到 Echo。"
              type="error"
              showIcon
            />
          )}
          {refErrors.current.map((each) => {
            return (
              <Alert
                key={each.log}
                message={
                  <>
                    {each.message}
                    {each?.link && (
                      <Button type="link" href={each?.link} target="_blank">
                        查看参考文档
                      </Button>
                    )}
                  </>
                }
                type="error"
                showIcon
              />
            );
          })}
        </Space>
      </div>
      <Card className={style.subtitleList}>
        <Editor
          height="550px"
          defaultLanguage="plaintext"
          value={editorValue}
          onMount={handleEditorDidMount}
          options={{
            wordWrap: "on",
          }}
        />
      </Card>
    </div>
  );
}
