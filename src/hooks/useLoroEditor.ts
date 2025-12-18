import { useEffect, useRef, useState } from 'react';
import { Loro, LoroText } from 'loro-crdt';
import { TextFormat } from '../types/editor';

export const useLoroEditor = () => {
  const loroDocRef = useRef<Loro | null>(null);
  const textRef = useRef<LoroText | null>(null);
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<TextFormat>({});
  const isInternalUpdateRef = useRef(false);

  useEffect(() => {
    // Initialize Loro document
    loroDocRef.current = new Loro();
    textRef.current = loroDocRef.current.getText('content');

    // Subscribe to changes
    const unsubscribe = loroDocRef.current.subscribe(() => {
      if (textRef.current && !isInternalUpdateRef.current) {
        setContent(textRef.current.toString());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateContent = (newContent: string) => {
    if (!textRef.current || !loroDocRef.current) return;

    isInternalUpdateRef.current = true;

    // Clear existing content
    const currentLength = textRef.current.length;
    if (currentLength > 0) {
      textRef.current.delete(0, currentLength);
    }

    // Insert new content
    if (newContent) {
      textRef.current.insert(0, newContent);
    }

    loroDocRef.current.commit();
    setContent(newContent);

    isInternalUpdateRef.current = false;
  };

  const insertText = (text: string, position?: number) => {
    if (!textRef.current) return;

    const insertPos = position ?? textRef.current.length;
    textRef.current.insert(insertPos, text);
    loroDocRef.current?.commit();
  };

  const deleteText = (start: number, length: number) => {
    if (!textRef.current) return;

    textRef.current.delete(start, length);
    loroDocRef.current?.commit();
  };

  const applyFormat = (_start: number, _end: number, formatUpdate: TextFormat) => {
    setFormat((prev) => ({ ...prev, ...formatUpdate }));
  };

  const getSnapshot = () => {
    return loroDocRef.current?.export({ mode: 'snapshot' });
  };

  const loadSnapshot = (snapshot: Uint8Array) => {
    if (!loroDocRef.current) return;
    loroDocRef.current.import(snapshot);
  };

  return {
    content,
    format,
    updateContent,
    insertText,
    deleteText,
    applyFormat,
    getSnapshot,
    loadSnapshot,
    loroDoc: loroDocRef.current,
  };
};
