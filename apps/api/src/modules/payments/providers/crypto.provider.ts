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

@Injectable()
export class CryptoProvider {
  constructor(private readonly config: ConfigService) {}

  createPayment(
    amount: number,
    network: string,
    asset: string,
  ): CryptoPaymentResult {
    const normalizedNetwork = network.toLowerCase() as CryptoNetwork;
    const normalizedAsset = asset.toUpperCase() as CryptoAsset;

    if (!['ethereum', 'solana', 'tron'].includes(normalizedNetwork)) {
      throw new BadRequestException('Unsupported crypto network');
    }

    if (!['USDT', 'USDC'].includes(normalizedAsset)) {
      throw new BadRequestException('Unsupported crypto asset');
    }

    if (normalizedNetwork === 'tron' && normalizedAsset === 'USDC') {
      throw new BadRequestException('USDC is not supported on the Tron network');
    }

    if (normalizedNetwork === 'tron' && normalizedAsset === 'USDC') {
      throw new BadRequestException('USDC is not supported on the Tron network');
    }

    const wallets = this.config.get<Record<string, string>>(
      'commerce.payment.cryptoWallets',
      {},
    );
    const tokens = this.config.get<Record<string, string>>(
      'commerce.payment.cryptoTokens',
      {},
    ) || {};

    const walletKey =
      normalizedNetwork === 'ethereum'
        ? normalizedAsset === 'USDT'
          ? 'ethereumUsdt'
          : 'ethereumUsdc'
        : normalizedNetwork === 'solana'
          ? normalizedAsset === 'USDT'
            ? 'solanaUsdt'
            : 'solanaUsdc'
          : normalizedAsset === 'USDT'
            ? 'tronUsdt'
            : 'tronUsdc';

    const address = wallets[walletKey];

    if (!address) {
      throw new BadRequestException(
        `Crypto wallet is not configured for ${normalizedAsset} on ${normalizedNetwork}`,
      );
    }

    const tokenKey =
      normalizedNetwork === 'ethereum'
        ? normalizedAsset === 'USDT'
          ? 'ethereumUsdt'
          : 'ethereumUsdc'
        : normalizedNetwork === 'solana'
          ? normalizedAsset === 'USDT'
            ? 'solanaUsdt'
            : 'solanaUsdc'
          : 'tronUsdt';
    const tokenContract = tokens[tokenKey];
    const tokenUnits = BigInt(Math.round(amount * 1_000_000)).toString();

    const qrPayload =
      normalizedNetwork === 'ethereum'
        ? 'ethereum:' + tokenContract + '/transfer?address=' + address + '&uint256=' + tokenUnits
        : normalizedNetwork === 'solana'
          ? 'solana:' + address + '?amount=' + amount.toFixed(6) + '&spl-token=' + tokenContract
          : address;

    return {
      network: normalizedNetwork,
      asset: normalizedAsset,
      address,
      amount,
      currency: 'USD',
      instructions: `Send exactly ${amount.toFixed(2)} ${normalizedAsset} on ${normalizedNetwork} network to the address shown above. Do not send through another network.`,
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
    const network = data.network.toLowerCase();
    const asset = data.asset.toUpperCase();
    const tokenKey = network + asset.charAt(0) + asset.slice(1).toLowerCase();
    const rpc = this.config.get<string>('commerce.payment.cryptoRpc.' + network);
    const tokens = this.config.get<Record<string, string>>('commerce.payment.cryptoTokens', {}) || {};
    const tokenContract = tokens[tokenKey];

    if (!rpc || !tokenContract) {
      throw new BadRequestException('Crypto verification is not configured for ' + asset + ' on ' + network);
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
    if (String(this.config.get('commerce.payment.cryptoEnabled') ?? 'false').toLowerCase() !== 'true') {
      return false;
    }

    const networks = this.config.get<string[]>(
      'commerce.payment.cryptoNetworks',
      [],
    );
    const assets = this.config.get<string[]>(
      'commerce.payment.cryptoSupportedAssets',
      [],
    );
    const wallets =
      this.config.get<Record<string, string>>(
        'commerce.payment.cryptoWallets',
        {},
      ) || {};

    return (
      networks.length > 0 &&
      assets.length > 0 &&
      Object.values(wallets).some(Boolean)
    );
  }

  getNetworks(): string[] {
    return this.config.get<string[]>('commerce.payment.cryptoNetworks', []);
  }

  getAssets(): string[] {
    return this.config.get<string[]>(
      'commerce.payment.cryptoSupportedAssets',
      [],
    );
  }
}

