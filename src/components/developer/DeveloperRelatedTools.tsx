import { Link } from "@/i18n/navigation";
import { ChartIcon, DollarIcon, FilmIcon, ShareIcon, TrendingUpIcon } from "../icons";

export interface DevToolDef {
  href: string;
  title: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

export const ALL_DEVELOPER_TOOLS: readonly DevToolDef[] = [
  { href: "/jwt-decoder", title: "JWT Decoder", description: "Decode JWT tokens locally without sending data to any server.", Icon: DollarIcon },
  { href: "/json-formatter", title: "JSON Formatter", description: "Beautify, minify, and validate JSON with indentation options.", Icon: ChartIcon },
  { href: "/base64-encoder-decoder", title: "Base64 Encoder/Decoder", description: "Encode and decode Base64 and Base64URL with Unicode support.", Icon: TrendingUpIcon },
  { href: "/uuid-generator", title: "UUID Generator", description: "Generate cryptographically secure UUID v4 identifiers.", Icon: ShareIcon },
  { href: "/cron-expression-generator", title: "Cron Expression Generator", description: "Build and humanize standard five-field Unix cron expressions.", Icon: FilmIcon },
  { href: "/unix-timestamp-converter", title: "Unix Timestamp Converter", description: "Convert between Unix timestamps and human-readable dates.", Icon: ChartIcon },
  { href: "/url-encoder-decoder", title: "URL Encoder/Decoder", description: "Encode and decode URL components and full URIs.", Icon: TrendingUpIcon },
  { href: "/regex-tester", title: "Regex Tester", description: "Test JavaScript regular expressions with live match highlighting.", Icon: DollarIcon },
  { href: "/sql-to-json-converter", title: "SQL to JSON Converter", description: "Convert SQL INSERT statements to structured JSON.", Icon: ShareIcon },
  { href: "/csv-to-json-converter", title: "CSV to JSON Converter", description: "Parse CSV data into JSON with nested key support.", Icon: FilmIcon },
];

interface Props { currentTool: string; }

export function DeveloperRelatedTools({ currentTool }: Props) {
  const tools = ALL_DEVELOPER_TOOLS.filter((t) => t.href !== currentTool);

  return (
    <section aria-labelledby="dev-related-tools-title" className="space-y-5">
      <div>
        <h2 id="dev-related-tools-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          More Developer Tools
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Free browser-based tools for developers. No data leaves your device.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ href, title, description, Icon }) => (
          <li key={href}>
            <Link href={href as never} className="group card flex h-full flex-col gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/15 to-brand-500/15 text-accent-600 dark:text-accent-400">
                  <Icon width={16} height={16} />
                </span>
                <span className="inline-flex items-center rounded-full bg-accent-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400">
                  Dev Tool
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 dark:text-accent-400">
                Open<span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
