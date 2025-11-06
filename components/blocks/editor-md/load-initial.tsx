import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $getRoot, $isElementNode } from "lexical";
import { useEffect, useRef } from "react";
import { $generateNodesFromDOM } from "@lexical/html";

type Props = { initialContent?: string };

export const LoadInitialContent = ({ initialContent }: Props) => {
  const [editor] = useLexicalComposerContext();
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!initialContent || isMountedRef.current) {
      return;
    }

    editor.update(() => {
      // Clear existing content
      $getRoot()
        .getChildren()
        .forEach((n) => n.remove());

      const parser = new DOMParser();
      const dom = parser.parseFromString(initialContent, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);

      // Append nodes directly to root instead of wrapping in paragraph
      if (nodes.length > 0) {
        nodes.forEach((node) => {
          $getRoot().append(node);
        });
      } else {
        // If no nodes were generated, add an empty paragraph
        $getRoot().append($createParagraphNode());
      }
    });

    isMountedRef.current = true;
  }, [editor, initialContent]);

  return null;
};
