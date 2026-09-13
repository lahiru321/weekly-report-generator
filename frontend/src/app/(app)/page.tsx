"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingState } from "@/components/common/state-message";

/** Sends each role to its main page: members to this week's report, managers to the dashboard. */
export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(user.role === "MEMBER" ? "/reports/new" : "/dashboard");
    }
  }, [user, router]);

  return <LoadingState />;
}
