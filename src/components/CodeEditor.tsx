"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  // เลขบรรทัดที่มี bug (1-indexed) สำหรับ highlight, -1 = ไม่ระบุ
  bugLineNumber: number;
  // เปิด visual-assist หรือไม่ (เฉพาะ noob/beginner)
  assist: boolean;
  readOnly?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Editor = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Monaco = any;

export default function CodeEditor({
  value,
  onChange,
  bugLineNumber,
  assist,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  // เก็บ collection ของ decoration ไว้เคลียร์/อัปเดตเมื่อเปลี่ยนด่าน
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decorationsRef = useRef<any>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection();
    applyDecorations();
  };

  // วาง decoration highlight บรรทัด bug + ขีดเส้นหยักใต้โค้ดในบรรทัดนั้น
  const applyDecorations = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const collection = decorationsRef.current;
    if (!editor || !monaco || !collection) return;

    // ระดับที่ไม่มี assist หรือไม่ระบุบรรทัด → ไม่ต้อง highlight อะไร
    if (!assist || bugLineNumber < 1) {
      collection.set([]);
      return;
    }

    const model = editor.getModel();
    if (!model || bugLineNumber > model.getLineCount()) {
      collection.set([]);
      return;
    }

    const lineContent = model.getLineContent(bugLineNumber);
    // หา column แรกที่ไม่ใช่ช่องว่าง เพื่อขีดเส้นหยักเฉพาะส่วนที่เป็นโค้ด
    const firstNonSpace = lineContent.search(/\S/);
    const startCol = firstNonSpace >= 0 ? firstNonSpace + 1 : 1;
    const endCol = lineContent.length + 1;

    collection.set([
      {
        // ไฮไลต์ทั้งบรรทัด + แถบสีซ้าย (border-left)
        range: new monaco.Range(bugLineNumber, 1, bugLineNumber, 1),
        options: {
          isWholeLine: true,
          className: "bug-line-highlight",
          linesDecorationsClassName: "bug-line-glyph",
        },
      },
      {
        // เส้นหยักใต้คำในบรรทัด bug
        range: new monaco.Range(bugLineNumber, startCol, bugLineNumber, endCol),
        options: {
          inlineClassName: "bug-word-underline",
        },
      },
    ]);
  };

  // อัปเดต decoration เมื่อเปลี่ยนด่าน/สลับ assist
  useEffect(() => {
    applyDecorations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bugLineNumber, assist, value]);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Editor
        height="320px"
        defaultLanguage="python"
        language="python"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          minimap: { enabled: false },
          glyphMargin: false,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          renderWhitespace: "selection",
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
