import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/cavos-mark.png"
          alt="Cavos"
          width={26}
          height={32}
          className="h-[28px] w-auto"
        />
      ),
      transparentMode: 'top',
    },
    themeSwitch: { enabled: false },
  };
}
