import Link from "next/link";

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function StaticPage({ title, description, children }: Props) {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <p className="text-xs text-slate-500 not-prose">
        <Link href="/" className="hover:underline">
          ← Back to home
        </Link>
      </p>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-slate-600 text-lg leading-relaxed">
          {description}
        </p>
      )}
      <div className="mt-8 space-y-5 text-slate-700 leading-relaxed">
        {children}
      </div>
    </article>
  );
}
