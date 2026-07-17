import Link from "next/link";

export default function ChannelNotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        Channel not found
      </h1>
      <p className="mt-2 text-slate-600 max-w-md mx-auto">
        We couldn&apos;t find that YouTube channel. It may have been removed,
        renamed, or the channel ID could be invalid. Try searching for the
        channel by name from the homepage.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Back to search
      </Link>
    </div>
  );
}
