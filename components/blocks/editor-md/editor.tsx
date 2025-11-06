"use client";

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState, SerializedEditorState } from "lexical";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { TooltipProvider } from "@/components/ui/tooltip";

import { nodes } from "./nodes";
import { Plugins } from "./plugins";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LoadInitialContent } from "./load-initial";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

// Custom OnChange component that has access to the editor context
function CustomOnChangePlugin({
  onChange,
  onSerializedChange,
  onHtmlChange,
}: {
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  onHtmlChange?: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      ignoreSelectionChange={true}
      onChange={(editorState) => {
        onChange?.(editorState);
        onSerializedChange?.(editorState.toJSON());

        // Generate HTML from the current editor state
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor);
          onHtmlChange?.(htmlString);
        });
      }}
    />
  );
}

// Wrapper component to handle plugins and context
function EditorPlugins({
  onChange,
  onSerializedChange,
  onHtmlChange,
  AiEnabled,
}: {
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  onHtmlChange?: (html: string) => void;
  AiEnabled: boolean;
}) {
  return (
    <>
      <Plugins />
      <CustomOnChangePlugin
        onChange={onChange}
        onSerializedChange={onSerializedChange}
        onHtmlChange={onHtmlChange}
      />
    </>
  );
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  onHtmlChange,
  initialContent,
  AiEnabled,
}: {
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  onHtmlChange?: (html: string) => void;
  initialContent?: string;
  AiEnabled: boolean;
}) {
  return (
    <div className="bg-background rounded-lg border h-[500px]">
      <div className="overflow-auto h-full">
        <LexicalComposer
          initialConfig={{
            ...editorConfig,
            ...(editorState ? { editorState } : {}),
            ...(editorSerializedState
              ? { editorState: JSON.stringify(editorSerializedState) }
              : {}),
          }}
        >
          <LoadInitialContent initialContent={initialContent} />
          <TooltipProvider>
            <EditorPlugins
              onChange={onChange}
              onSerializedChange={onSerializedChange}
              onHtmlChange={onHtmlChange}
              AiEnabled={false}
            />
          </TooltipProvider>
        </LexicalComposer>
      </div>
    </div>
  );
}
