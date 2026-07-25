import { Link } from "@/i18n/navigation";
import { ChartIcon, DollarIcon, FilmIcon, ShareIcon, TrendingUpIcon } from "../icons";

interface Tool {
  href: string;
  title: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const BADGE_DEV = "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";

const TOOLS: readonly Tool[] = [
  { href: "/json-formatter", title: "JSON Formatter", description: "Beautify, minify, and validate JSON with customizable indentation.", Icon: ChartIcon },
  { href: "/jwt-decoder", title: "JWT Decoder", description: "Decode JWT tokens locally. View header, payload, and expiry.", Icon: DollarIcon },
  { href: "/base64-encoder-decoder", title: "Base64 Encoder/Decoder", description: "Encode and decode Base64 and Base64URL with Unicode support.", Icon: TrendingUpIcon },
  { href: "/uuid-generator", title: "UUID Generator", description: "Generate cryptographically secure UUID v4 identifiers.", Icon: ShareIcon },
  { href: "/unix-timestamp-converter", title: "Unix Timestamp Converter", description: "Convert between Unix timestamps and human-readable dates.", Icon: ChartIcon },
  { href: "/regex-tester", title: "Regex Tester", description: "Test JavaScript regular expressions with live match highlighting.", Icon: FilmIcon },
];

export function DeveloperTools() {
  return (
    <section id="developer-tools" aria-labelledby="developer-tools-title" className="scroll-mt-20">
      <div className="mb-10 text-center sm:text-left">
        <h2 id="developer-tools-title" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Developer Tools
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Free browser-based utilities for developers. All processing happens locally — no data leaves your device.
        </p>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map(({ href, title, description, Icon }) => (
          <li key={href}>
            <Link href={href as never} className="group card flex h-full flex-col gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
              <div className="flex items-start justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/15 to-brand-500/15 text-accent-600 dark:text-accent-400">
                  <Icon width={18} height={18} />
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_DEV}`}>
                  Dev Tool
                </span>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 dark:text-accent-400">
                Open<span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-center sm:text-left">
        <Link href={"/developer-tools" as never} className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline">
          View all developer tools &rarr;
        </Link>
      </div>
    </section>
  );
}
