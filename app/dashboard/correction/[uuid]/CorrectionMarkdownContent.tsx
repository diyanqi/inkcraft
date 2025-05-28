// app/dashboard/correction/[uuid]/CorrectionMarkdownContent.tsx

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Markdown components definition (kept here as it's only used by ReactMarkdown)
// Note: The 'any' suppression might be related to the types expected by react-markdown's Components.
const markdownComponents: Components = {
    h1: ({ node: _node, ...props }) => <h1 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0" {...props} />,
    h2: ({ node: _node, ...props }) => <h2 className="mt-10 scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" {...props} />,
    h3: ({ node: _node, ...props }) => <h3 className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight" {...props} />,
    h4: ({ node: _node, ...props }) => <h4 className="mt-6 scroll-m-20 text-base font-semibold tracking-tight" {...props} />,
    p: ({ node: _node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
    a: ({ node: _node, ...props }) => <a className="font-medium text-primary underline underline-offset-4" {...props} />,
    blockquote: ({ node: _node, ...props }) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />,
    ul: ({ node: _node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
    ol: ({ node: _node, ...props }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />,
    li: ({ node: _node, ...props }) => <li className="mt-2" {...props} />,
    table: ({ node: _node, ...props }) => (
        <div className="my-6 w-full overflow-y-auto">
            <table className="w-full" {...props} />
        </div>
    ),
    thead: ({ node: _node, ...props }) => <thead {...props} />,
    tbody: ({ node: _node, ...props }) => <tbody {...props} />,
    tr: ({ node: _node, ...props }) => <tr className="m-0 border-t p-0 even:bg-muted" {...props} />,
    th: ({ node: _node, ...props }) => <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
    td: ({ node: _node, ...props }) => <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
    pre: ({ node: _node, children, ...props }) => (
        <pre className="mt-6 mb-4 overflow-x-auto rounded-lg border bg-black py-4" {...props}>
            {children}
        </pre>
    ),
    strong: ({ node: _node, ...props }) => <strong className="font-semibold" {...props} />,
    em: ({ node: _node, ...props }) => <em className="italic" {...props} />,
    hr: ({ node: _node, ...props }) => <hr className="my-4 md:my-8 border-border" {...props} />,
};

interface CorrectionMarkdownContentProps {
    content: string;
    // components prop is not strictly needed here if it's always the same internal components
    // but keeping it allows for potential override if needed in the future.
    // For this refactor, we can remove it from props and use the internal definition directly.
    // components: Components; // Removed from props
}

// export default function CorrectionMarkdownContent({ content, components }: CorrectionMarkdownContentProps) { // Modified signature
export default function CorrectionMarkdownContent({ content }: CorrectionMarkdownContentProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents} // Use internal definition
        >
            {content}
        </ReactMarkdown>
    );
}
