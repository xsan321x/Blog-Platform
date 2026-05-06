'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorToolbar } from './EditorToolbar';
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export interface RichTextEditorRef {
  /** Insert HTML at the current cursor position (or append if at end) */
  insertContent: (html: string) => void;
  /** Replace all content */
  setContent: (html: string) => void;
  /** Get current HTML */
  getContent: () => string;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    { content, onChange, placeholder = 'Start writing your story...' },
    ref
  ) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const editor = useEditor(
      {
        immediatelyRender: false,
        extensions: [
          StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
          TiptapImage.configure({ inline: false, allowBase64: true }),
          TiptapLink.configure({
            openOnClick: false,
            HTMLAttributes: { class: 'text-primary underline' },
          }),
          Placeholder.configure({ placeholder }),
          Underline,
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
          Highlight.configure({ multicolor: false }),
          CharacterCount,
        ],
        content,
        onUpdate: ({ editor }) => {
          onChange(editor.getHTML());
        },
        editorProps: {
          attributes: { class: 'ProseMirror focus:outline-none' },
        },
      },
      [mounted]
    );

    // Expose imperative methods to parent via ref
    useImperativeHandle(ref, () => ({
      insertContent: (html: string) => {
        if (!editor) return;
        // Move cursor to end then insert
        editor.chain().focus().selectAll().run();
        const currentContent = editor.getHTML();
        const isEmpty = !currentContent || currentContent === '<p></p>';
        if (isEmpty) {
          editor.commands.setContent(html);
        } else {
          // Insert at end of document
          editor.chain()
            .focus()
            .command(({ tr, dispatch }) => {
              if (dispatch) {
                const { doc } = tr;
                tr.setSelection(
                  // @ts-ignore
                  editor.state.selection.constructor.atEnd(doc)
                );
              }
              return true;
            })
            .insertContent(html)
            .run();
        }
        onChange(editor.getHTML());
      },
      setContent: (html: string) => {
        if (!editor) return;
        editor.commands.setContent(html);
        onChange(editor.getHTML());
      },
      getContent: () => editor?.getHTML() || '',
    }), [editor]);

    // Sync initial content when editing an existing post (only on first load)
    const [initialSynced, setInitialSynced] = useState(false);
    useEffect(() => {
      if (editor && mounted && content && !initialSynced) {
        const current = editor.getHTML();
        if (current !== content && content !== '<p></p>') {
          editor.commands.setContent(content);
          setInitialSynced(true);
        }
      }
    }, [editor, mounted, content, initialSynced]);

    if (!mounted) {
      return (
        <div className="border border-border rounded-2xl overflow-hidden bg-background">
          <div className="h-12 bg-muted/30 border-b border-border" />
          <div className="px-6 py-4 min-h-[400px] flex items-start">
            <div className="w-full space-y-3 pt-2">
              <div className="h-4 bg-muted rounded skeleton w-3/4" />
              <div className="h-4 bg-muted rounded skeleton w-full" />
              <div className="h-4 bg-muted rounded skeleton w-5/6" />
            </div>
          </div>
        </div>
      );
    }

    if (!editor) return null;

    return (
      <div className="border border-border rounded-2xl overflow-hidden bg-background">
        <EditorToolbar editor={editor} />
        <div className="px-6 py-4 min-h-[400px]">
          <EditorContent editor={editor} />
        </div>
        <div className="px-6 py-2 border-t border-border flex justify-end">
          <span className="text-xs text-muted-foreground">
            {editor.storage.characterCount.words()} words
            {' · '}
            {editor.storage.characterCount.characters()} characters
          </span>
        </div>
      </div>
    );
  }
);
