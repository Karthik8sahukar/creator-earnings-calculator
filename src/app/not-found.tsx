import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  );
}
