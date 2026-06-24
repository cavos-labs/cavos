import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{
        footer: (
          <div className="sidebar-footer flex flex-col gap-1 border-t border-line pt-3 text-[13px]">
            <a
              href="/llms-full.txt"
              className="flex items-center justify-between px-2 py-1.5 font-mono text-xs text-muted transition-colors hover:text-brand"
            >
              llms-full.txt
              <span aria-hidden>↗</span>
            </a>
            <a
              href="https://cavos.xyz"
              className="flex items-center justify-between px-2 py-1.5 text-muted transition-colors hover:text-ink"
            >
              cavos.xyz
              <span aria-hidden>↗</span>
            </a>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
