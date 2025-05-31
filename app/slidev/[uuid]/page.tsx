"use client";

import { generateSlidevPresentation } from "@/utils/slidev-presentation-generator";
import { CorrectionJson } from "@/types/correction";
import { useEffect, useRef, useState, use, Usable } from "react"; // Import use and Usable
import { WebContainer } from "@webcontainer/api";

interface SlidevPageProps {
  params: {
    uuid: string;
  };
}

export default function SlidevPage({ params }: SlidevPageProps) {
  // Cast params to Usable<{ uuid: string }> before using React.use
  const unwrappedParams = use(params as unknown as Usable<{ uuid: string }>);
  const { uuid } = unwrappedParams;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupWebContainer() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch correction data
        const response = await fetch(`/api/correction/${uuid}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch correction data: ${response.statusText}`);
        }
        const correctionData: CorrectionJson = await response.json();

        // 2. Generate Slidev markdown content
        const slidevMarkdown = generateSlidevPresentation(
          correctionData,
          `批改记录 ${uuid} 演示文稿`,
          "用户名称" // TODO: Replace with actual author name
        );

        // 3. Initialize WebContainer
        const wc = await WebContainer.boot();

        // 4. Write files to WebContainer
        await wc.mount({
          'package.json': {
            file: {
              contents: `{
                "name": "slidev-project",
                "private": true,
                "scripts": {
                  "dev": "slidev --open",
                  "build": "slidev build",
                  "export": "slidev export"
                },
                "dependencies": {
                  "@slidev/cli": "^0.40.0",
                  "@slidev/theme-default": "^0.21.2",
                  "@slidev/theme-seriph": "^0.21.2",
                  "slidev-theme-shibainu": "^1.0.0"
                },
                "devDependencies": {
                  "@iconify-json/carbon": "^1.1.21",
                  "@iconify-json/mdi": "^1.1.60"
                }
              }`
            }
          },
          'slides.md': {
            file: {
              contents: slidevMarkdown
            }
          },
          '.gitignore': {
            file: {
              contents: 'node_modules\n.slidev\ndist'
            }
          }
          // Add other necessary Slidev files if needed (e.g., global styles, custom components)
        });

        // 5. Install dependencies
        const installProcess = await wc.spawn('npm', ['install']);
        installProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk); // Log install output
          }
        }));
        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }
        console.log('npm install finished');

        // 6. Start Slidev development server
        const devProcess = await wc.spawn('npm', ['run', 'dev']);

        // Listen for port forwarding
        wc.on('port', (port, type) => { // type is 'open' or 'close'
          if (type === 'open' && iframeRef.current) { // Check if port is 'open'
            const url = `http://localhost:${port}`;
            iframeRef.current.src = url;
            setLoading(false);
          }
        });

        devProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk); // Log dev server output
          }
        }));

      } catch (err: any) { // Keep any here for TypeScript/ESLint compatibility
        console.error("WebContainer setup failed:", err);
        if (err instanceof Error) { // Use type guard
          setError(`Failed to load presentation: ${err.message}`);
        } else {
          setError(`Failed to load presentation: An unknown error occurred.`);
        }
        setLoading(false);
      }
    }

    setupWebContainer();

    // Cleanup function
    return () => {
      // TODO: Potentially shut down WebContainer instance
    };
  }, [uuid]); // Rerun effect if uuid changes

  return (
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold p-4">Slidev Presentation for {uuid}</h1>
      {loading && <div className="text-center p-4">Loading presentation...</div>}
      {error && <div className="text-center p-4 text-red-500">Error: {error}</div>}
      <div className="flex-grow">
        <iframe
          ref={iframeRef}
          title="Slidev Presentation"
          className="w-full h-full border-none"
          style={{ visibility: loading || error ? 'hidden' : 'visible' }}
        ></iframe>
      </div>
    </div>
  );
}
