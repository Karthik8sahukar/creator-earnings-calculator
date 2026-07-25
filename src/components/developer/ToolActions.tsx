"use client";

import { CopyButton } from "./CopyButton";
import { DownloadButton } from "./DownloadButton";

interface Props {
  output: string;
  onClear: () => void;
  onSample?: () => void;
  downloadFilename?: string;
  downloadMimeType?: string;
  copyLabel?: string;
  hasInput?: boolean;
}

export function ToolActions({ output, onClear, onSample, downloadFilename, downloadMimeType, copyLabel = "Copy Output", hasInput = true }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {onSample && (
        <button type="button" onClick={onSample} className="btn-secondary text-xs">
          Sample
        </button>
      )}
      <CopyButton text={output} label={copyLabel} />
      {downloadFilename && (
        <DownloadButton content={output} filename={downloadFilename} mimeType={downloadMimeType} label="Download" />
      )}
      <button type="button" onClick={onClear} disabled={!hasInput} className="btn-secondary text-xs">
        Clear
      </button>
    </div>
  );
}
