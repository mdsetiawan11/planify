import { useState } from "react";
import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { AutoLinkPlugin } from "@/components/editor/plugins/auto-link-plugin";
import { CodeActionMenuPlugin } from "@/components/editor/plugins/code-action-menu-plugin";
import { CodeHighlightPlugin } from "@/components/editor/plugins/code-highlight-plugin";
import { ComponentPickerMenuPlugin } from "@/components/editor/plugins/component-picker-menu-plugin";
import { DraggableBlockPlugin } from "@/components/editor/plugins/draggable-block-plugin";
import { FloatingLinkEditorPlugin } from "@/components/editor/plugins/floating-link-editor-plugin";
import { FloatingTextFormatToolbarPlugin } from "@/components/editor/plugins/floating-text-format-plugin";
import { ImagesPlugin } from "@/components/editor/plugins/images-plugin";
import { LinkPlugin } from "@/components/editor/plugins/link-plugin";
import { ListMaxIndentLevelPlugin } from "@/components/editor/plugins/list-max-indent-level-plugin";
import { AlignmentPickerPlugin } from "@/components/editor/plugins/picker/alignment-picker-plugin";
import { BulletedListPickerPlugin } from "@/components/editor/plugins/picker/bulleted-list-picker-plugin";
import { CheckListPickerPlugin } from "@/components/editor/plugins/picker/check-list-picker-plugin";
import { CodePickerPlugin } from "@/components/editor/plugins/picker/code-picker-plugin";
import { DividerPickerPlugin } from "@/components/editor/plugins/picker/divider-picker-plugin";
import { HeadingPickerPlugin } from "@/components/editor/plugins/picker/heading-picker-plugin";
import { ImagePickerPlugin } from "@/components/editor/plugins/picker/image-picker-plugin";
import { NumberedListPickerPlugin } from "@/components/editor/plugins/picker/numbered-list-picker-plugin";
import { ParagraphPickerPlugin } from "@/components/editor/plugins/picker/paragraph-picker-plugin";
import { QuotePickerPlugin } from "@/components/editor/plugins/picker/quote-picker-plugin";
import { TablePickerPlugin } from "@/components/editor/plugins/picker/table-picker-plugin";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { FormatCodeBlock } from "@/components/editor/plugins/toolbar/block-format/format-code-block";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { CodeLanguageToolbarPlugin } from "@/components/editor/plugins/toolbar/code-language-toolbar-plugin";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history-toolbar-plugin";
import { HorizontalRuleToolbarPlugin } from "@/components/editor/plugins/toolbar/horizontal-rule-toolbar-plugin";
import { ImageToolbarPlugin } from "@/components/editor/plugins/toolbar/image-toolbar-plugin";
import { LinkToolbarPlugin } from "@/components/editor/plugins/toolbar/link-toolbar-plugin";
import { TableToolbarPlugin } from "@/components/editor/plugins/toolbar/table-toolbar-plugin";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";
import { HR } from "@/components/editor/transformers/markdown-hr-transformer";
import { IMAGE } from "@/components/editor/transformers/markdown-image-transformer";
import { TABLE } from "@/components/editor/transformers/markdown-table-transformer";
import { Separator } from "@/components/ui/separator";
import { FontFamilyToolbarPlugin } from "@/components/editor/plugins/toolbar/font-family-toolbar-plugin";
import { FontSizeToolbarPlugin } from "@/components/editor/plugins/toolbar/font-size-toolbar-plugin";
import { SubSuperToolbarPlugin } from "@/components/editor/plugins/toolbar/subsuper-toolbar-plugin";
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting-toolbar-plugin";
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin";
import { FontBackgroundToolbarPlugin } from "@/components/editor/plugins/toolbar/font-background-toolbar-plugin";
import { BlockInsertPlugin } from "@/components/editor/plugins/toolbar/block-insert-plugin";
import { InsertImage } from "@/components/editor/plugins/toolbar/block-insert/insert-image";
import { InsertHorizontalRule } from "@/components/editor/plugins/toolbar/block-insert/insert-horizontal-rule";
import { InsertTable } from "@/components/editor/plugins/toolbar/block-insert/insert-table";
import { InsertColumnsLayout } from "@/components/editor/plugins/toolbar/block-insert/insert-columns-layout";
import { InsertEmbeds } from "@/components/editor/plugins/toolbar/block-insert/insert-embeds";
import { ActionsPlugin } from "@/components/editor/plugins/actions/actions-plugin";
import { MaxLengthPlugin } from "@/components/editor/plugins/actions/max-length-plugin";
import { CounterCharacterPlugin } from "@/components/editor/plugins/actions/counter-character-plugin";
import { ShareContentPlugin } from "@/components/editor/plugins/actions/share-content-plugin";
import { MarkdownTogglePlugin } from "@/components/editor/plugins/actions/markdown-toggle-plugin";

const placeholder = "Press / for commands...";

export function Plugins({}) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      <ToolbarPlugin>
        {({ blockType }) => (
          <div className="vertical-align-middle sticky top-0 z-10 flex items-center gap-2 overflow-auto border-b p-1 bg-background">
            <HistoryToolbarPlugin />
            <Separator orientation="vertical" className="h-7!" />
            <BlockFormatDropDown>
              <FormatParagraph />
              <FormatHeading levels={["h1", "h2", "h3"]} />
              <FormatNumberedList />
              <FormatBulletedList />
              <FormatCheckList />
              <FormatCodeBlock />
              <FormatQuote />
            </BlockFormatDropDown>
            {blockType === "code" ? (
              <CodeLanguageToolbarPlugin />
            ) : (
              <>
                <FontSizeToolbarPlugin />
                <Separator orientation="vertical" className="!h-7" />
                <FontFormatToolbarPlugin />
                <Separator orientation="vertical" className="!h-7" />

                <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                <Separator orientation="vertical" className="!h-7" />
                <ClearFormattingToolbarPlugin />
                <Separator orientation="vertical" className="!h-7" />
                <FontColorToolbarPlugin />
                <FontBackgroundToolbarPlugin />
                <Separator orientation="vertical" className="!h-7" />
                <ElementFormatToolbarPlugin />
                <Separator orientation="vertical" className="!h-7" />
                <BlockInsertPlugin>
                  <InsertHorizontalRule />
                  <InsertImage />
                  <InsertTable />
                  <InsertColumnsLayout />
                </BlockInsertPlugin>
              </>
            )}
          </div>
        )}
      </ToolbarPlugin>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable
                  placeholder={placeholder}
                  className="ContentEditable__root relative block h-[calc(100vh-50px)] min-h-72 overflow-auto px-8 py-4 focus:outline-none"
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />

        <ListPlugin />
        <ListMaxIndentLevelPlugin />
        <CheckListPlugin />

        <TabIndentationPlugin />

        <ClickableLinkPlugin />
        <AutoLinkPlugin />
        <LinkPlugin />

        <FloatingLinkEditorPlugin
          anchorElem={floatingAnchorElem}
          isLinkEditMode={isLinkEditMode}
          setIsLinkEditMode={setIsLinkEditMode}
        />

        <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
        <CodeHighlightPlugin />

        <ComponentPickerMenuPlugin
          baseOptions={[
            ParagraphPickerPlugin(),
            HeadingPickerPlugin({ n: 1 }),
            HeadingPickerPlugin({ n: 2 }),
            HeadingPickerPlugin({ n: 3 }),
            TablePickerPlugin(),
            CheckListPickerPlugin(),
            NumberedListPickerPlugin(),
            BulletedListPickerPlugin(),
            QuotePickerPlugin(),
            CodePickerPlugin(),
            DividerPickerPlugin(),
            ImagePickerPlugin(),
            AlignmentPickerPlugin({ alignment: "left" }),
            AlignmentPickerPlugin({ alignment: "center" }),
            AlignmentPickerPlugin({ alignment: "right" }),
            AlignmentPickerPlugin({ alignment: "justify" }),
          ]}
        />

        <FloatingTextFormatToolbarPlugin
          anchorElem={floatingAnchorElem}
          setIsLinkEditMode={setIsLinkEditMode}
        />

        <HorizontalRulePlugin />

        <ImagesPlugin />

        <TablePlugin />

        <DraggableBlockPlugin anchorElem={floatingAnchorElem} />

        <MarkdownShortcutPlugin
          transformers={[
            TABLE,
            HR,
            IMAGE,
            CHECK_LIST,
            ...ELEMENT_TRANSFORMERS,
            ...MULTILINE_ELEMENT_TRANSFORMERS,
            ...TEXT_FORMAT_TRANSFORMERS,
            ...TEXT_MATCH_TRANSFORMERS,
          ]}
        />
      </div>
      <ActionsPlugin>
        <div className="clear-both flex items-center justify-between gap-2 overflow-auto border-t p-1">
          <div className="flex flex-1 justify-start"></div>
          <div>
            <CounterCharacterPlugin charset="UTF-16" />
          </div>
          <div className="flex flex-1 justify-end">
            <ShareContentPlugin />

            <MarkdownTogglePlugin
              shouldPreserveNewLinesInMarkdown={true}
              transformers={[
                TABLE,
                HR,
                IMAGE,

                CHECK_LIST,
                ...ELEMENT_TRANSFORMERS,
                ...MULTILINE_ELEMENT_TRANSFORMERS,
                ...TEXT_FORMAT_TRANSFORMERS,
                ...TEXT_MATCH_TRANSFORMERS,
              ]}
            />

            <></>
          </div>
        </div>
      </ActionsPlugin>
    </div>
  );
}
