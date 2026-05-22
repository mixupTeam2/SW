import { Link, useRouterState } from "@tanstack/react-router";
import { Home, NotebookPen, Users, MessageCircle, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "홈", icon: Home, exact: true },
  { to: "/retrospect", label: "회고", icon: NotebookPen, exact: false },
  { to: "/recommend", label: "추천", icon: Users, exact: false },
  { to: "/chat", label: "채팅", icon: MessageCircle, exact: false },
  { to: "/me", label: "마이", icon: User, exact: false },
] as const;

export function MobileShell({
  children,
  hideTabs = false,
  hideHeader = false,
}: {
  children: React.ReactNode;
  hideTabs?: boolean;
  hideHeader?: boolean;
}) {
  return (
    <div className="mobile-shell safe-bottom">
      {!hideHeader && <AppHeader />}
      {children}
      {!hideTabs && <BottomTabs />}
    </div>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-5 py-3 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-[13px] font-bold">C</span>
        </span>
        <span className="font-display text-base font-semibold tracking-tight text-foreground">
          CareType
        </span>
      </Link>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="알림"
      >
        <Bell className="size-[18px]" />
      </button>
    </header>
  );
}

function BottomTabs() {
  const { location } = useRouterState();
  const path = location.pathname;
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = t.exact ? path === t.to : path.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.4]")} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  return (
    <header className="px-5 pt-6 pb-4">
      {back && (
        <Link to=".." className="mb-2 inline-block text-sm text-muted-foreground">
          ← 뒤로
        </Link>
      )}
      <h1 className="font-display text-[26px] font-bold text-foreground">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
