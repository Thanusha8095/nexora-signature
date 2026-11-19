import {
  BookmarkPlus,
  Building2,
  Download,
  Eye,
  FileEdit,
  GitCompare,
  LayoutDashboard,
  Layers,
  MailCheck,
  Presentation,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import type { SavedReportEntry } from '../services/storage.ts';
import type { StudioTabId } from './TopBar.tsx';

interface SidebarProps {
  activeTab: StudioTabId;
  onSelectTab: (tab: StudioTabId) => void;
  onOpenPresentation: () => void;
  recentReports: SavedReportEntry[];
  activeReportId: string;
  onLoadRecent: (entry: SavedReportEntry) => void;
  onSaveCurrent: () => void;
  onDeleteRecent: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: StudioTabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Studio Overview', icon: LayoutDashboard },
  { id: 'editor', label: 'Report Editor', icon: FileEdit },
  { id: 'preview', label: '5-Format Preview', icon: Eye },
  { id: 'email-lab', label: 'Email Lab', icon: MailCheck },
  { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
  { id: 'versions', label: 'Version Compare', icon: GitCompare },
  { id: 'templates', label: 'Templates & Audiences', icon: Layers },
  { id: 'branding', label: 'Brand DNA Studio', icon: Building2 },
  { id: 'export', label: 'Export Centre', icon: Download },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  onOpenPresentation,
  recentReports,
  activeReportId,
  onLoadRecent,
  onSaveCurrent,
  onDeleteRecent,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#0B1120] text-[#F8F6F0] w-64 shrink-0 border-r border-[#1E293B]">
      {/* Brand Lockup inside Sidebar */}
      <div className="px-5 py-5 border-b border-[#1E293B] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#D4FF33] text-[#0B1120] font-bold text-sm font-mono-num">
              N
            </span>
            <span className="font-display text-lg font-semibold tracking-wide text-[#F8F6F0]">
              NEXORA
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Universal Business Report Studio</p>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav aria-label="Workspace sections" className="px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#17223B] text-[#D4FF33] border border-[#2B3B5E]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#D4FF33]' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            onOpenPresentation();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm font-medium text-[#D4FF33] hover:bg-white/5 border border-[#23304C] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Presentation className="h-4 w-4 shrink-0 text-[#D4FF33]" />
          <span className="truncate">Presentation Mode</span>
        </button>
      </nav>

      {/* Recent Reports */}
      <div className="mt-1 px-3 py-3 border-t border-[#1E293B] flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <span className="text-xs font-semibold text-slate-400">Saved Reports</span>
          <button
            type="button"
            onClick={onSaveCurrent}
            title="Save current report snapshot"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#D4FF33] hover:underline cursor-pointer"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>
        </div>

        {recentReports.length === 0 ? (
          <div className="px-2 py-3 rounded-lg border border-dashed border-[#23304C] text-xs text-slate-400 leading-relaxed">
            No saved snapshots yet. Click Save to store your active report locally.
          </div>
        ) : (
          <ul className="space-y-1">
            {recentReports.map((entry) => {
              const isCurrent = entry.id === activeReportId;
              return (
                <li
                  key={entry.id}
                  className={`group flex items-center justify-between gap-1 rounded-md px-2.5 py-2 text-xs transition-colors ${
                    isCurrent ? 'bg-[#17223B] text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onLoadRecent(entry);
                      onCloseMobile();
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="font-medium truncate">{entry.companyName}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {entry.reportingPeriod}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRecent(entry.id)}
                    aria-label={`Delete ${entry.companyName} saved report`}
                    className="opacity-60 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Engine Footer */}
      <div className="px-5 py-3.5 border-t border-[#1E293B] text-[11px] text-slate-400">
        <div className="font-medium text-slate-300">NEXORA Signature</div>
        <div>Powered by @unlayer/react-elements</div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block h-screen sticky top-0">{sidebarBody}</aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarBody}</div>
        </div>
      ) : null}
    </>
  );
}
