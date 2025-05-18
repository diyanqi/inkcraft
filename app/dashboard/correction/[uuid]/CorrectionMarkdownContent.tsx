import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// 复用原有的 markdownComponents
const markdownComponents: Components = {
    h1: ({ node, ...props }) => <h1 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0" {...props} />, 
    h2: ({ node, ...props }) => <h2 className="mt-10 scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" {...props} />, 
    h3: ({ node, ...props }) => <h3 className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight" {...props} />, 
    h4: ({ node, ...props }) => <h4 className="mt-6 scroll-m-20 text-base font-semibold tracking-tight" {...props} />, 
    p: ({ node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />, 
    a: ({ node, ...props }) => <a className="font-medium text-primary underline underline-offset-4" {...props} />, 
    blockquote: ({ node, ...props }) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />, 
    ul: ({ node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />, 
    ol: ({ node, ...props }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />, 
    li: ({ node, ...props }) => <li className="mt-2" {...props} />, 
    table: ({ node, ...props }) => (
        <div className="my-6 w-full overflow-y-auto">
            <table className="w-full" {...props} />
        </div>
    ),
    thead: ({ node, ...props }) => <thead {...props} />, 
    tbody: ({ node, ...props }) => <tbody {...props} />, 
    tr: ({ node, ...props }) => <tr className="m-0 border-t p-0 even:bg-muted" {...props} />, 
    th: ({ node, ...props }) => <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />, 
    td: ({ node, ...props }) => <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />, 
    pre: ({ node, children, ...props }) => (
        <pre className="mt-6 mb-4 overflow-x-auto rounded-lg border bg-black py-4" {...props}>
            {children}
        </pre>
    ),
    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />, 
    em: ({ node, ...props }) => <em className="italic" {...props} />, 
    hr: ({ node, ...props }) => <hr className="my-4 md:my-8 border-border" {...props} />, 
};

export default function CorrectionMarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
        >
            {content}
        </ReactMarkdown>
    );
} 