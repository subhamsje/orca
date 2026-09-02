import React from 'react';
import { OperationalState } from '../../design/states';
import { tokens } from '../../design/tokens';
import { Sidebar } from '../nav/Sidebar';
import { BottomNav } from '../nav/BottomNav';

interface AppShellProps {
  activeNavId: string;
  onSelectNav: (id: string) => void;
  operationalState?: OperationalState;
  /** Rendered at the very top of the shell, above the header (e.g. demo banner). */
  topBanner?: React.ReactNode;
  header: React.ReactNode;
  /** Rendered directly below the header (e.g. system status strip). */
  statusBar?: React.ReactNode;
  /** Optional left/right sidebars rendered around the workspace. */
  leftRail?: React.ReactNode;
  rightRail?: React.ReactNode;
  children: React.ReactNode;
  /** Rendered inside the bottom nav footer (sign-out, version). */
  bottomNavFooter?: React.ReactNode;
}

/**
 * The ORCA application shell.
 *
 * Layout breakpoints:
 * - mobile (<lg): single column, fixed bottom nav
 * - tablet (lg): single column workspace with bottom nav
 * - desktop (lg+): sidebar + workspace, no bottom nav
 *
 * The workspace itself is unbounded so future modules (marine map, SAR
 * dashboards, split views) can fill the available space without shell
 * refactors.
 */
export const AppShell: React.FC<AppShellProps> = ({
  activeNavId,
  onSelectNav,
  operationalState,
  topBanner,
  header,
  statusBar,
  leftRail,
  rightRail,
  children,
  bottomNavFooter,
}) => {
  return (
    <div
      className="min-h-screen flex flex-col bg-ocean-950 text-slate-100"
      style={{
        // Reserve space for the bottom nav on small screens.
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-cyan-700 focus:text-white focus:px-3 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      {topBanner}

      <header className="sticky top-0 z-40">
        {header}
        {statusBar}
      </header>

      <div className="flex flex-1 w-full">
        <Sidebar
          activeId={activeNavId}
          onSelect={onSelectNav}
          footer={
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle font-bold">
                Build
              </p>
              <p className="text-ink-muted">v4.0 · Phase 01</p>
              {bottomNavFooter}
            </div>
          }
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0"
          style={{
            maxWidth: tokens.layout.workspaceMaxWidth,
            paddingInline: tokens.layout.gutterMobile,
          }}
        >
          <div className="mx-auto w-full py-4 lg:py-6">{children}</div>
        </main>

        {rightRail && (
          <aside className="hidden xl:block w-72 shrink-0 border-l border-ocean-800 bg-ocean-975">
            {rightRail}
          </aside>
        )}
      </div>

      <BottomNav
        activeId={activeNavId}
        onSelect={onSelectNav}
        operationalState={operationalState}
      />

      {leftRail}
    </div>
  );
};