import Link from "next/link";

export default function AuthFooter({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="mt-4 text-center text-xs text-gray-500">
      {text}{" "}
      <Link
        href={href}
        className="font-medium text-emerald-700 hover:underline"
      >
        {linkText}
      </Link>
    </p>
  );
}
