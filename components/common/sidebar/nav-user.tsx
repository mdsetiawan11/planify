"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  ChevronsUpDown,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { redirect } from "next/navigation";

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim();
  if (!source) return "??";
  const parts = source.split(/\s+/).slice(0, 2);
  const initials = parts
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
  if (initials) {
    return initials;
  }
  return source.slice(0, 2).toUpperCase();
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data, isPending } = authClient.useSession();
  const [isSigningOut, startTransition] = useTransition();

  const user = data?.user ?? null;

  const avatarFallback = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.name, user?.email]
  );

  const handleSignOut = useCallback(() => {
    startTransition(async () => {
      try {
        await authClient.signOut();
        redirect("/auth/signin");
      } catch (error) {
        console.error("sign out error", error);
      }
    });
  }, [startTransition]);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid hydration mismatch: only render theme controls on client after mount
    setMounted(true);
  }, []);

  if (isPending && !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="gap-2" disabled>
            <Spinner />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading session</span>
              <span className="truncate text-xs text-muted-foreground">
                Please wait...
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild className="gap-2">
            <a href="/auth/signin">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">SI</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Sign in</span>
                <span className="truncate text-xs text-muted-foreground">
                  Access your account
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-30" />
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? user.email ?? "User avatar"}
                />
                <AvatarFallback className="rounded-lg">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.name ?? "Your account"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email ?? "Signed in"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? user.email ?? "User avatar"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.name ?? "Your account"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email ?? "Signed in"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Theme switcher (uses next-themes) */}
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setTheme("light");
              }}
              className="gap-2"
            >
              <Sun />
              <span>Light</span>
              {mounted && theme === "light" ? (
                <Check className="ml-auto size-4" />
              ) : null}
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setTheme("dark");
              }}
              className="gap-2"
            >
              <Moon />
              <span>Dark</span>
              {mounted && theme === "dark" ? (
                <Check className="ml-auto size-4" />
              ) : null}
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setTheme("system");
              }}
              className="gap-2"
            >
              <Monitor />
              <span>System</span>
              {mounted && theme === "system" ? (
                <Check className="ml-auto size-4" />
              ) : null}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                handleSignOut();
              }}
              disabled={isSigningOut}
              className="gap-2"
            >
              {isSigningOut ? <Spinner className="size-4" /> : <LogOut />}
              {isSigningOut ? "Signing out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
