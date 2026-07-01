'use client';

/**
 * Stellar Wallets Kit singleton (client-only). One connect button, many wallets
 * (Freighter, xBull, Albedo, Rabet, Lobstr, Hana). The kit renders web components,
 * so it must only be initialized in the browser — we lazy-import it on first use.
 */
import type { StellarWalletsKit as KitType } from '@creit.tech/stellar-wallets-kit';

let ready: Promise<typeof KitType> | null = null;

/** Lazily init the kit for Stellar mainnet and return the (static) kit class. */
export function getStellarKit(): Promise<typeof KitType> {
  if (!ready) {
    ready = (async () => {
      const { StellarWalletsKit, Networks } = await import('@creit.tech/stellar-wallets-kit');
      const { FreighterModule } = await import('@creit.tech/stellar-wallets-kit/modules/freighter');
      const { xBullModule } = await import('@creit.tech/stellar-wallets-kit/modules/xbull');
      const { AlbedoModule } = await import('@creit.tech/stellar-wallets-kit/modules/albedo');
      const { RabetModule } = await import('@creit.tech/stellar-wallets-kit/modules/rabet');
      const { LobstrModule } = await import('@creit.tech/stellar-wallets-kit/modules/lobstr');
      const { HanaModule } = await import('@creit.tech/stellar-wallets-kit/modules/hana');

      StellarWalletsKit.init({
        network: Networks.PUBLIC,
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new AlbedoModule(),
          new RabetModule(),
          new LobstrModule(),
          new HanaModule(),
        ],
      });
      return StellarWalletsKit;
    })();
  }
  return ready;
}

export const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
