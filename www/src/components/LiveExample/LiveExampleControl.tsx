import { useEffect, useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import { runExample } from "./runtime";
import type { ExampleFile, OutputItem } from "./runtime";

export interface LiveExampleControlProps {
  files: ExampleFile[];
  playgroundUrl: string;
}

function highlight(code: string, language: "typescript" | "json"): string {
  return Prism.highlight(code, Prism.languages[language], language);
}

function OutputBlock({ item }: { item: OutputItem }) {
  if (item.kind === "message") {
    return (
      <div
        className={`live-example__message live-example__message--${item.type}`}
        dangerouslySetInnerHTML={{ __html: item.html }}
      />
    );
  }
  return (
    <div className="live-example__output-item">
      {item.label ? (
        <div
          className="live-example__output-label"
          dangerouslySetInnerHTML={{ __html: item.label }}
        />
      ) : null}
      <pre className="live-example__code">
        <code
          dangerouslySetInnerHTML={{ __html: highlight(item.json, "json") }}
        />
      </pre>
    </div>
  );
}

export function LiveExampleControl({
  files,
  playgroundUrl,
}: LiveExampleControlProps) {
  const [activeName, setActiveName] = useState(files[0]?.name);
  const [output, setOutput] = useState<OutputItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    runExample(files)
      .then((items) => {
        if (!cancelled) {
          setOutput(items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setOutput([
            {
              kind: "message",
              type: "error",
              html: `<h3>${err instanceof Error ? err.message : String(err)}</h3>`,
            },
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [files]);

  const activeFile = files.find((file) => file.name === activeName) ?? files[0];
  const highlighted = useMemo(
    () => highlight(activeFile.source, "typescript"),
    [activeFile],
  );

  return (
    <div className="live-example">
      <div className="live-example__header">
        <div className="live-example__tabs" role="tablist">
          {files.map((file) => (
            <button
              key={file.name}
              type="button"
              role="tab"
              aria-selected={file.name === activeFile.name}
              className={`live-example__tab${
                file.name === activeFile.name ? " live-example__tab--active" : ""
              }`}
              onClick={() => setActiveName(file.name)}
            >
              {file.label}
            </button>
          ))}
        </div>
        <a
          className="live-example__playground-link"
          href={playgroundUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Edit in Playground ↗
        </a>
      </div>
      <pre className="live-example__code live-example__source">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
      <div className="live-example__output">
        <div className="live-example__output-heading">
          Generated DynamoDB Parameters
        </div>
        {output === null ? (
          <div className="live-example__loading">Generating parameters…</div>
        ) : (
          output.map((item, index) => <OutputBlock key={index} item={item} />)
        )}
      </div>
    </div>
  );
}
