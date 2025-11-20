"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Video, ArrowLeft } from "lucide-react";
import YouTubeHeader from "@/components/YouTubeHeader";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Error:", error.message);
    }
  };

  if (session) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF0000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#f1f1f1] text-lg">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <YouTubeHeader />

      <main className="pt-[var(--yt-header-height)] min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#272727] mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Login Card */}
          <div className="bg-[#212121] rounded-xl p-8 shadow-lg">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF0000] to-[#CC0000] rounded-full flex items-center justify-center shadow-lg">
                <Video className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-[#f1f1f1] mb-2">
              Sign in to Watch2gether
            </h1>
            <p className="text-center text-[#aaaaaa] mb-8">
              Watch YouTube videos in sync with your friends
            </p>

            {/* Google Sign In Button */}
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-gray-100 text-[#1f1f1f] font-medium text-base shadow-md transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#303030]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#212121] px-3 text-[#717171] font-medium">
                  Optional
                </span>
              </div>
            </div>

            {/* Continue Without Login */}
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full h-12 bg-transparent border-2 border-[#303030] text-[#f1f1f1] hover:bg-[#272727] hover:border-[#3f3f3f] font-medium text-base"
            >
              Continue without signing in
            </Button>

            {/* Info Text */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-[#aaaaaa]">
                Sign in to save your watch history and preferences
              </p>
              <p className="text-xs text-[#717171]">
                Your data is protected and secure
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 bg-[#272727] rounded-full flex items-center justify-center mx-auto mb-2">
                <Video className="w-5 h-5 text-[#FF0000]" />
              </div>
              <p className="text-xs text-[#aaaaaa]">Sync Playback</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-[#272727] rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-5 h-5 text-[#FF0000]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-xs text-[#aaaaaa]">Live Chat</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-[#272727] rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-5 h-5 text-[#FF0000]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-xs text-[#aaaaaa]">Multi-User</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
