"use client";

import { useAuth } from "@/components/auth/auth-provider";
import type { Role } from "@/lib/types";

/**
 * Hides a page from users without the right role. This is for UX only;
 * the API returns 403 for these users no matter what the UI shows.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h1 className="text-lg font-semibold">No access</h1>
        <p className="mt-1 text-sm text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
