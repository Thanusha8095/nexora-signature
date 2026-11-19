import { Download, Menu } from 'lucide-react';

export type StudioTabId =
  | 'overview'
  | 'editor'
  | 'preview'
  | 'email-lab'
  | 'simulator'
  | 'versions'
  | 'templates'
  | 'export'
  | 'branding';

interface TopBarProps {
  activeTab: StudioTabId;
  companyName: string;
  onSelectTab: (tab: StudioTabId) => void;
  onOpenMobileSidebar: () => void;
}

const TOP_NAV_LINKS: { id: StudioTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'editor', label: 'Editor' },
  { id: 'preview', label: 'Preview' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'email-lab', label: 'Email Lab' },
];

export function TopBar({
  activeTab,
  companyName,
  onSelectTab,
  onOpenMobileSidebar,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-8">
      {/* Zone 1: Single-line workspace context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="text-left font-display text-lg font-semibold tracking-tight text-[#0B1120] whitespace-nowrap shrink-0 truncate max-w-[220px] sm:max-w-[300px]"
        >
          {companyName || 'NEXORA Signature'}
        </button>
      </div>

      {/* Zone 2: 5 concise single-line text nav links */}
      <nav aria-label="Primary studio navigation" className="hidden md:flex items-center gap-6">
        {TOP_NAV_LINKS.map((link) => {
          const active = activeTab === link.id;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onSelectTab(link.id)}
              className={`py-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                active
                  ? 'border-[#0B1120] text-[#0B1120]'
                  : 'border-transparent text-slate-500 hover:text-[#0B1120]'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary CTA */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => onSelectTab('export')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-sm font-medium hover:bg-[#17223B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0891B2]"
        >
          <Download className="h-4 w-4 text-[#D4FF33]" />
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
}
