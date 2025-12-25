/**
 * Layout for /subscription route.
 * 
 * Note: We let the client component handle authentication checks
 * to avoid server-side cookie issues that could cause page refreshes.
 * The client component properly waits for auth hydration.
 */
export default async function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Let the client component handle auth checks
  // This prevents server-side cookie issues from causing page refreshes
  return <>{children}</>
}

