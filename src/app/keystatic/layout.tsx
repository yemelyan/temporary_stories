// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

// Keystatic admin panel layout
export default function KeystaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}