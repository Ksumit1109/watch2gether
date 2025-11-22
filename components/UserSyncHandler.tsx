"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@supabase/auth-helpers-react";

export function UserSyncHandler() {
  const session = useSession();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      // Only sync if we have a session, haven't synced yet, and have user data
      if (!session?.user || hasSynced.current) {
        return;
      }

      try {
        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          username:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "User",
          avatar_url:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            "",
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to sync user: ${response.statusText}`);
        }

        // Mark as synced to prevent duplicate calls
        hasSynced.current = true;
        console.log("User synced successfully:", userData);
      } catch (error) {
        console.error("Error syncing user to backend:", error);
      }
    };

    syncUser();
  }, [session]);

  // This component doesn't render anything
  return null;
}
