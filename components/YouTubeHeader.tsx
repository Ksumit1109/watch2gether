"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, Video, User, LogOut, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface YouTubeHeaderProps {
  roomId?: string;
  memberCount?: number;
  onShareRoom?: () => void;
}

export default function YouTubeHeader({
  roomId,
  memberCount,
  onShareRoom,
}: YouTubeHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const supabase = useSupabaseClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isInRoom = pathname?.includes("/room/");

  return (
    <header className="yt-header">
      <div className="h-full px-2 md:px-4 flex items-center justify-between gap-2 md:gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-[#FF0000] rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-[#f1f1f1] hidden sm:block group-hover:text-white transition-colors">
              Watch2gether
            </h1>
          </div>
        </div>

        {/* Center: Global YouTube Search - Visible on mobile */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="yt-search">
            <Input
              placeholder="Search..."
              className="flex-1 bg-transparent border-0 text-[#f1f1f1] placeholder:text-[#717171] focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const searchQuery = (e.target as HTMLInputElement).value;
                  if (searchQuery.trim() && isInRoom) {
                    window.dispatchEvent(
                      new CustomEvent("global-search", {
                        detail: { query: searchQuery },
                      })
                    );
                  }
                }
              }}
            />
            <Button
              size="icon"
              className="bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] rounded-none border-l border-[#303030]"
              onClick={(e) => {
                const input = e.currentTarget
                  .previousElementSibling as HTMLInputElement;
                if (input?.value.trim() && isInRoom) {
                  window.dispatchEvent(
                    new CustomEvent("global-search", {
                      detail: { query: input.value },
                    })
                  );
                }
              }}
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white"
                >
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#282828] border-[#3f3f3f] text-[#f1f1f1] w-56"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#f1f1f1] focus:bg-[#3f3f3f] focus:text-white cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              className="bg-transparent border border-[#3ea6ff] text-[#3ea6ff] hover:bg-[#3ea6ff]/10 text-xs md:text-sm px-2 md:px-4"
              size="sm"
            >
              <User className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
