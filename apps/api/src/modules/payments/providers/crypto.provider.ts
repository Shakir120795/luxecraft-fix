import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CryptoNetwork = 'ethereum' | 'solana' | 'tron';
export type CryptoAsset = 'USDT' | 'USDC';

export interface CryptoPaymentResult {
  network: CryptoNetwork;
  asset: CryptoAsset;
  address: string;
  amount: number;
  currency: string;
  instructions: string;
  qrPayload: string;
}

export interface CryptoPaymentOption {
  network: CryptoNetwork;
  asset: CryptoAsset;
}

const SUPPORTED_NETWORKS: CryptoNetwork[] = ['ethereum', 'solana', 'tron'];
const SUPPORTED_ASSETS: CryptoAsset[] = ['USDT', 'USDC'];

@Injectable()
export class CryptoProvider {
  constructor(private readonly config: ConfigService) {}

  createPayment(
    amount: number,
    network: string,
    asset: string,
  ): CryptoPaymentResult {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Crypto payment amount must be greater than zero');
    }

    const pair = this.getConfiguredPair(network, asset);
    const tokenUnits = BigInt(Math.round(amount * 1_000_000)).toString();

    const qrPayload =
      pair.network === 'ethereum'
        ? 'ethereum:' +
          pair.tokenContract +
          '/transfer?address=' +
          pair.address +
          '&uint256=' +
          tokenUnits
        : pair.network === 'solana'
          ? 'solana:' +
            pair.address +
            '?amount=' +
            amount.toFixed(6) +
            '&spl-token=' +
            pair.tokenContract
          : pair.address;

    return {
      network: pair.network,
      asset: pair.asset,
      address: pair.address,
      amount,
      currency: 'USD',
      instructions: `Send exactly ${amount.toFixed(2)} ${pair.asset} on ${pair.network} network to the address shown above. Do not send through another network.`,
      qrPayload,
    };
  }

  async verifyTransaction(data: {
    txHash: string;
    network: string;
    asset: string;
    expectedAmount: number;
    receivingAddress: string;
  }): Promise<{ verified: boolean; amountReceived: number; tokenContract: string }> {
    const pair = this.getConfiguredPair(data.network, data.asset);
    const network = pair.network;
    const asset = pair.asset;
    const rpc = pair.rpc;
    const tokenContract = pair.tokenContract;

    if (!Number.isFinite(data.expectedAmount) || data.expectedAmount <= 0) {
      throw new BadRequestException('Crypto payment amount is invalid');
    }

    const expectedUnits = BigInt(Math.round(data.expectedAmount * 1_000_000));

    if (network === 'ethereum') {
      const response = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionReceipt',
          params: [data.txHash],
        }),
      });
      const payload = await response.json();
      const receipt = payload.result;

      if (!receipt || receipt.status !== '0x1') {
        return { verified: false, amountReceived: 0, tokenContract };
      }

      const blockResponse = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_blockNumber',
          params: [],
        }),
      });
      const blockPayload = await blockResponse.json();
      const latestBlock = Number.parseInt(String(blockPayload.result || '0'), 16);
      const receiptBlock = Number.parseInt(String(receipt.blockNumber || '0'), 16);

      if (
        !Number.isFinite(latestBlock) ||
        !Number.isFinite(receiptBlock) ||
        latestBlock - receiptBlock < 3
      ) {
        return { verified: false, amountReceived: 0, tokenContract };
      }

      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55aeb3e5f6a6';
      const recipient = data.receivingAddress.toLowerCase().replace(/^0x/, '');

      for (const log of receipt.logs ?? []) {
        if (
          String(log.address).toLowerCase() === tokenContract.toLowerCase() &&
          String(log.topics?.[0]).toLowerCase() === transferTopic &&
          String(log.topics?.[2] ?? '').slice(-40).toLowerCase() === recipient
        ) {
          const receivedUnits = BigInt(log.data);
          const amountReceived = Number(receivedUnits) / 1_000_000;
          return {
            verified: receivedUnits >= expectedUnits,
            amountReceived,
            tokenContract,
          };
        }
      }

      return { verified: false, amountReceived: 0, tokenContract };
    }

    if (network === 'solana') {
      const response = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [
            data.txHash,
            {
              commitment: 'finalized',
              encoding: 'jsonParsed',
              maxSupportedTransactionVersion: 0,
            },
          ],
        }),
      });
      const payload = await response.json();
      const transaction = payload.result;

      if (!transaction || transaction.meta?.err) {
        return { verified: false, amountReceived: 0, tokenContract };
      }

      const pre = transaction.meta?.preTokenBalances ?? [];
      const post = transaction.meta?.postTokenBalances ?? [];
      let receivedUnits = 0n;

      for (const after of post) {
        if (
          after.mint === tokenContract &&
          after.owner === data.receivingAddress
        ) {
          const before = pre.find(
            (entry: any) =>
              entry.accountIndex === after.accountIndex &&
              entry.mint === tokenContract &&
              entry.owner === data.receivingAddress,
          );

          const beforeUnits = BigInt(before?.uiTokenAmount?.amount ?? '0');
          const afterUnits = BigInt(after.uiTokenAmount?.amount ?? '0');
          if (afterUnits > beforeUnits) {
            receivedUnits += afterUnits - beforeUnits;
          }
        }
      }

      return {
        verified: receivedUnits >= expectedUnits,
        amountReceived: Number(receivedUnits) / 1_000_000,
        tokenContract,
      };
    }

    if (network === 'tron') {
      const apiKey = this.config.get<string>('commerce.payment.cryptoRpc.tronApiKey');
      const headers: Record<string, string> = {};
      if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

      const response = await fetch(
        rpc + '/v1/transactions/' + encodeURIComponent(data.txHash) + '/events?only_confirmed=true',
        { headers },
      );
      const payload = await response.json();

      let receivedUnits = 0n;

      for (const event of payload.data ?? []) {
        const contractAddress = String(
          event.contract_address ?? event.contractAddress ?? '',
        );
        const result = event.result ?? event.data ?? {};
        const to = String(result.to ?? result._to ?? '');
        const value = String(result.value ?? result._value ?? '0');

        if (
          contractAddress === tokenContract &&
          to === data.receivingAddress &&
          /^\d+$/.test(value)
        ) {
          receivedUnits += BigInt(value);
        }
      }

      return {
        verified: receivedUnits >= expectedUnits,
        amountReceived: Number(receivedUnits) / 1_000_000,
        tokenContract,
      };
    }

    throw new BadRequestException('Unsupported crypto network: ' + network);
  }
  isConfigured(): boolean {
    return this.getConfiguredPaymentOptions().length > 0;
  }

  getConfiguredPaymentOptions(): CryptoPaymentOption[] {
    if (
      String(this.config.get('commerce.payment.cryptoEnabled') ?? 'false').toLowerCase() !==
      'true'
    ) {
      return [];
    }

    const configuredNetworks = new Set(
      this.config
        .get<string[]>('commerce.payment.cryptoNetworks', [])
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    );
    const configuredAssets = new Set(
      this.config
        .get<string[]>('commerce.payment.cryptoSupportedAssets', [])
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
    );

    const options: CryptoPaymentOption[] = [];

    for (const network of SUPPORTED_NETWORKS) {
      if (!configuredNetworks.has(network)) continue;

      for (const asset of SUPPORTED_ASSETS) {
        if (!configuredAssets.has(asset)) continue;
        if (network === 'tron' && asset === 'USDC') continue;

        try {
          this.getConfiguredPair(network, asset, false);
          options.push({ network, asset });
        } catch {
          // Invalid/incomplete pairs are intentionally not advertised.
        }
      }
    }

    return options;
  }

  getNetworks(): string[] {
    return Array.from(new Set(this.getConfiguredPaymentOptions().map((option) => option.network)));
  }

  getAssets(): string[] {
    return Array.from(new Set(this.getConfiguredPaymentOptions().map((option) => option.asset)));
  }

  private getWalletKey(network: CryptoNetwork, asset: CryptoAsset): string {
    if (network === 'ethereum') return asset === 'USDT' ? 'ethereumUsdt' : 'ethereumUsdc';
    if (network === 'solana') return asset === 'USDT' ? 'solanaUsdt' : 'solanaUsdc';
    return asset === 'USDT' ? 'tronUsdt' : 'tronUsdc';
  }

  private getTokenKey(network: CryptoNetwork, asset: CryptoAsset): string {
    if (network === 'ethereum') return asset === 'USDT' ? 'ethereumUsdt' : 'ethereumUsdc';
    if (network === 'solana') return asset === 'USDT' ? 'solanaUsdt' : 'solanaUsdc';
    return 'tronUsdt';
  }

  private getConfiguredPair(
    networkInput: string,
    assetInput: string,
    requireAdvertised = true,
  ): {
    network: CryptoNetwork;
    asset: CryptoAsset;
    address: string;
    tokenContract: string;
    rpc: string;
  } {
    const network = networkInput.trim().toLowerCase() as CryptoNetwork;
    const asset = assetInput.trim().toUpperCase() as CryptoAsset;

    if (!SUPPORTED_NETWORKS.includes(network)) {
      throw new BadRequestException('Unsupported crypto network');
    }

    if (!SUPPORTED_ASSETS.includes(asset)) {
      throw new BadRequestException('Unsupported crypto asset');
    }

    if (network === 'tron' && asset === 'USDC') {
      throw new BadRequestException('USDC is not supported on the Tron network');
    }

    const rpc = String(
      this.config.get<string>('commerce.payment.cryptoRpc.' + network) || '',
    ).trim();
    const wallets =
      this.config.get<Record<string, string>>('commerce.payment.cryptoWallets', {}) || {};
    const tokens =
      this.config.get<Record<string, string>>('commerce.payment.cryptoTokens', {}) || {};

    const address = String(wallets[this.getWalletKey(network, asset)] || '').trim();
    const tokenContract = String(tokens[this.getTokenKey(network, asset)] || '').trim();

    if (!rpc) {
      throw new BadRequestException(
        `Crypto RPC is not configured for ${network}`,
      );
    }

    if (!address) {
      throw new BadRequestException(
        `Crypto wallet is not configured for ${asset} on ${network}`,
      );
    }

    if (!tokenContract) {
      throw new BadRequestException(
        `Crypto token contract is not configured for ${asset} on ${network}`,
      );
    }

    if (requireAdvertised && !this.getConfiguredPaymentOptions().some(
      (option) => option.network === network && option.asset === asset,
    )) {
      throw new BadRequestException(
        `Crypto payment option ${asset} on ${network} is not configured`,
      );
    }

    return { network, asset, address, tokenContract, rpc };
  }
}
}

