import React, { useMemo } from 'react';
import katex from 'katex';

interface MathProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      // Strip any accidental wrapping dollar signs
      const cleaned = (math || '').trim().replace(/^\${1,2}|\${1,2}$/g, '');
      return katex.renderToString(cleaned, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      console.warn('KaTeX rendering error for:', math, err);
      return `<span class="text-rose-400 font-mono text-xs">${math}</span>`;
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className={`overflow-x-auto py-2 my-1 max-w-full text-slate-100 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block text-slate-100 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
