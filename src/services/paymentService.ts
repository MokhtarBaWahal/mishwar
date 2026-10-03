import {
  PaymentMethod,
  PaymentStatus,
  PaymentTransaction,
  WalletLedgerEntry
} from '../../packages/shared_types/src';
import { appConfig } from '../config/appConfig';

class PaymentService {
  private apiBaseUrl = appConfig.apiBaseUrl;
  private apiToken = appConfig.apiToken;

  // Financial Ledger storage
  private ledgerEntries: WalletLedgerEntry[] = [
    {
      transactionId: 'tx_ledger_seed_01',
      userId: 'cust_01',
      type: 'TOPUP',
      amount: 15000,
      balanceBefore: 0,
      balanceAfter: 15000,
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      referenceId: 'KUR-771234-8891',
      description: 'شحن محفظة عبر بنك الكريمي',
      idempotencyKey: 'idemp_seed_topup_01'
    },
    {
      transactionId: 'tx_ledger_seed_02',
      userId: 'cust_01',
      type: 'RIDE_PAYMENT',
      amount: 6500,
      balanceBefore: 15000,
      balanceAfter: 8500,
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      referenceId: 'MISH-772911',
      description: 'سداد أجرة مشوار #ride_2026_001',
      idempotencyKey: 'idemp_seed_ride_01'
    }
  ];

  // User In-Memory Balances managed strictly via Ledger
  private balances: Map<string, number> = new Map([
    ['cust_01', 8500],
    ['cust_02', 4200],
    ['cust_03', 12000],
    ['cust_04', 3500],
    ['cust_05', 9100]
  ]);

  // Idempotency cache to prevent double debit/credit
  private idempotencyRegistry: Map<string, WalletLedgerEntry> = new Map([
    ['idemp_seed_topup_01', this.ledgerEntries[0]],
    ['idemp_seed_ride_01', this.ledgerEntries[1]]
  ]);

  // Legacy Transactions store
  private transactions: PaymentTransaction[] = [
    {
      id: 'tx_seed_01',
      userId: 'cust_01',
      amount: 15000,
      method: 'WALLET',
      status: 'PAID',
      type: 'WALLET_TOPUP',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      referenceNumber: 'KUR-771234-8891'
    }
  ];

  getUserBalance(userId: string): number {
    return this.balances.get(userId) ?? 5000;
  }

  getLedger(userId?: string): WalletLedgerEntry[] {
    if (userId) {
      return this.ledgerEntries.filter((e) => e.userId === userId);
    }
    return [...this.ledgerEntries];
  }

  getLocalPaymentProviders(): Array<{
    id: 'KURAIMI' | 'FLOOSAK' | 'JAIB' | 'CASH';
    nameAr: string;
    mode: 'MANUAL_CONFIRMATION' | 'API_READY';
    enabled: boolean;
  }> {
    return [
      { id: 'KURAIMI', nameAr: 'الكريمي', mode: 'MANUAL_CONFIRMATION', enabled: true },
      { id: 'FLOOSAK', nameAr: 'فلوسك', mode: 'MANUAL_CONFIRMATION', enabled: true },
      { id: 'JAIB', nameAr: 'جيب', mode: 'MANUAL_CONFIRMATION', enabled: true },
      { id: 'CASH', nameAr: 'كاش', mode: 'API_READY', enabled: true }
    ];
  }

  getLedgerIntegrityReport(): {
    immutableEntries: number;
    successfulDebits: number;
    successfulCredits: number;
    failedEntries: number;
    duplicateGuardKeys: number;
  } {
    return this.ledgerEntries.reduce(
      (acc, entry) => {
        acc.immutableEntries += 1;
        if (entry.status === 'FAILED') acc.failedEntries += 1;
        if (entry.status === 'SUCCESS' && ['DEBIT', 'RIDE_PAYMENT', 'COMMISSION_DEDUCTION'].includes(entry.type)) {
          acc.successfulDebits += entry.amount;
        }
        if (entry.status === 'SUCCESS' && ['CREDIT', 'TOPUP', 'REFUND', 'DRIVER_PAYOUT'].includes(entry.type)) {
          acc.successfulCredits += entry.amount;
        }
        return acc;
      },
      {
        immutableEntries: 0,
        successfulDebits: 0,
        successfulCredits: 0,
        failedEntries: 0,
        duplicateGuardKeys: this.idempotencyRegistry.size
      }
    );
  }

  getDailySettlementReport(driverId?: string): {
    date: string;
    driverId?: string;
    grossCollected: number;
    platformCommission: number;
    driverPayable: number;
    ridePayments: number;
  } {
    const ridePayments = this.transactions.filter((tx) => tx.type === 'RIDE_PAYMENT');
    const grossCollected = ridePayments.reduce((sum, tx) => sum + tx.amount, 0);
    const platformCommission = Math.round(grossCollected * 0.1);
    return {
      date: new Date().toISOString().slice(0, 10),
      driverId,
      grossCollected,
      platformCommission,
      driverPayable: grossCollected - platformCommission,
      ridePayments: ridePayments.length
    };
  }

  /**
   * Strictly records a wallet ledger entry and computes balance updates.
   * Enforces Idempotency to prevent double deductions.
   */
  async recordLedgerTransaction(params: {
    userId: string;
    amount: number;
    type: WalletLedgerEntry['type'];
    referenceId: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; entry: WalletLedgerEntry; error?: string }> {
    const { userId, amount, type, referenceId, description, idempotencyKey } = params;

    // 1. Idempotency Check
    if (idempotencyKey && this.idempotencyRegistry.has(idempotencyKey)) {
      const existing = this.idempotencyRegistry.get(idempotencyKey)!;
      return { success: true, entry: existing };
    }

    const currentBal = this.getUserBalance(userId);
    let nextBal = currentBal;
    let isDebit = false;

    if (type === 'DEBIT' || type === 'RIDE_PAYMENT' || type === 'COMMISSION_DEDUCTION') {
      isDebit = true;
      if (currentBal < amount) {
        // Insufficient funds
        const failedEntry: WalletLedgerEntry = {
          transactionId: `tx_failed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId,
          type,
          amount,
          balanceBefore: currentBal,
          balanceAfter: currentBal,
          status: 'FAILED',
          createdAt: new Date().toISOString(),
          referenceId,
          description: `${description || ''} (فشلت العملية: رصيد المحفظة غير كافٍ)`,
          idempotencyKey
        };
        this.ledgerEntries.unshift(failedEntry);
        return {
          success: false,
          entry: failedEntry,
          error: `رصيد المحفظة غير كافٍ. المطلوب: ${amount.toLocaleString()} ر.ي، المتوفر: ${currentBal.toLocaleString()} ر.ي`
        };
      }
      nextBal = currentBal - amount;
    } else {
      // CREDIT, TOPUP, REFUND
      nextBal = currentBal + amount;
    }

    const newTxId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ledgerEntry: WalletLedgerEntry = {
      transactionId: newTxId,
      userId,
      type,
      amount,
      balanceBefore: currentBal,
      balanceAfter: nextBal,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
      referenceId,
      description: description || (isDebit ? 'خصم من المحفظة' : 'إيداع في المحفظة'),
      idempotencyKey
    };

    // Apply mutation
    this.balances.set(userId, nextBal);
    this.ledgerEntries.unshift(ledgerEntry);

    if (idempotencyKey) {
      this.idempotencyRegistry.set(idempotencyKey, ledgerEntry);
    }

    return { success: true, entry: ledgerEntry };
  }

  /**
   * Process payment for a ride (CASH, WALLET, CARD)
   */
  async processRidePayment(
    rideId: string,
    userId: string,
    amount: number,
    method: PaymentMethod,
    idempotencyKey?: string
  ): Promise<{
    success: boolean;
    transactionId: string;
    status: PaymentStatus;
    message: string;
    ledgerEntry?: WalletLedgerEntry;
  }> {
    const effectiveKey = idempotencyKey || `pay_ride_${rideId}_${userId}`;
    const refNum = `MISH-${Math.floor(100000 + Math.random() * 900000)}`;

    if (this.shouldUseServerPayments()) {
      const serverResult = await this.processRidePaymentOnServer({
        rideId,
        userId,
        amount,
        method,
        idempotencyKey: effectiveKey
      });
      if (serverResult) {
        return serverResult;
      }
    }

    if (method === 'CASH') {
      const txId = `tx_cash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newTx: PaymentTransaction = {
        id: txId,
        rideId,
        userId,
        amount,
        method: 'CASH',
        status: 'PAID',
        type: 'RIDE_PAYMENT',
        timestamp: new Date().toISOString(),
        referenceNumber: refNum
      };
      this.transactions.unshift(newTx);

      return {
        success: true,
        transactionId: txId,
        status: 'PAID',
        message: 'تم تأكيد الدفع نقداً (كاش) للكابتن عند الوصول'
      };
    }

    if (method === 'WALLET') {
      const ledgerResult = await this.recordLedgerTransaction({
        userId,
        amount,
        type: 'RIDE_PAYMENT',
        referenceId: rideId,
        description: `سداد أجرة مشوار مشوار #${rideId}`,
        idempotencyKey: effectiveKey
      });

      if (!ledgerResult.success) {
        return {
          success: false,
          transactionId: ledgerResult.entry.transactionId,
          status: 'FAILED',
          message: ledgerResult.error || 'فشلت عملية الدفع لعدم كفاية رصيد المحفظة',
          ledgerEntry: ledgerResult.entry
        };
      }

      const txId = ledgerResult.entry.transactionId;
      const newTx: PaymentTransaction = {
        id: txId,
        rideId,
        userId,
        amount,
        method: 'WALLET',
        status: 'PAID',
        type: 'RIDE_PAYMENT',
        timestamp: new Date().toISOString(),
        referenceNumber: refNum
      };
      this.transactions.unshift(newTx);

      return {
        success: true,
        transactionId: txId,
        status: 'PAID',
        message: `تم خصم ${amount.toLocaleString()} ر.ي من المحفظة بنجاح`,
        ledgerEntry: ledgerResult.entry
      };
    }

    // Mock Card Processing
    const txId = `tx_card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      transactionId: txId,
      status: 'PAID',
      message: 'تم الدفع بالبطاقة المصرفية بنجاح'
    };
  }

  /**
   * Refund a ride payment
   */
  async refundRidePayment(
    rideId: string,
    userId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; ledgerEntry: WalletLedgerEntry; message: string }> {
    const res = await this.recordLedgerTransaction({
      userId,
      amount,
      type: 'REFUND',
      referenceId: rideId,
      description: `استرداد مبلغ المشوار #${rideId}: ${reason}`,
      idempotencyKey: `refund_${rideId}_${userId}`
    });

    return {
      success: res.success,
      ledgerEntry: res.entry,
      message: `تم استرداد مبلغ ${amount.toLocaleString()} ر.ي إلى محفظتك`
    };
  }

  /**
   * Wallet Top Up
   */
  async topUpWallet(
    userId: string,
    amount: number,
    provider: 'KURAIMI' | 'FLOOSAK' | 'JAIB' | 'CASH'
  ): Promise<{ success: boolean; reference: string; newBalance: number }> {
    const ref = `${provider}-${Math.floor(100000 + Math.random() * 900000)}`;
    const res = await this.recordLedgerTransaction({
      userId,
      amount,
      type: 'TOPUP',
      referenceId: ref,
      description: `شحن محفظة عبر ${provider}`
    });

    const tx: PaymentTransaction = {
      id: res.entry.transactionId,
      userId,
      amount,
      method: 'WALLET',
      status: 'PAID',
      type: 'WALLET_TOPUP',
      timestamp: new Date().toISOString(),
      referenceNumber: ref
    };
    this.transactions.unshift(tx);

    return {
      success: true,
      reference: ref,
      newBalance: res.entry.balanceAfter
    };
  }

  getTransactions(userId?: string): PaymentTransaction[] {
    if (userId) {
      return this.transactions.filter((t) => t.userId === userId);
    }
    return [...this.transactions];
  }

  resetDemoData(): void {
    this.balances = new Map([
      ['cust_01', 8500],
      ['cust_02', 4200],
      ['cust_03', 12000],
      ['cust_04', 3500],
      ['cust_05', 9100]
    ]);
    this.ledgerEntries = this.ledgerEntries.slice(0, 2);
    this.idempotencyRegistry.clear();
  }

  private shouldUseServerPayments(): boolean {
    return Boolean(this.apiBaseUrl && appConfig.flags.useRealPayment);
  }

  private async processRidePaymentOnServer(params: {
    rideId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    idempotencyKey: string;
  }): Promise<{
    success: boolean;
    transactionId: string;
    status: PaymentStatus;
    message: string;
    ledgerEntry?: WalletLedgerEntry;
  } | null> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/payments/ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': params.idempotencyKey,
          'x-user-role': 'CUSTOMER',
          ...(this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {})
        },
        body: JSON.stringify({
          rideId: params.rideId,
          userId: params.userId,
          amount: params.amount,
          method: params.method
        })
      });

      const payload = await res.json();
      const data = payload.data || payload.error?.details;
      return {
        success: payload.success,
        transactionId: data?.transactionId || `tx_server_${Date.now()}`,
        status: data?.status === 'FAILED' ? 'FAILED' : 'PAID',
        message: payload.message || (payload.success ? 'Payment processed by server' : 'Payment failed on server'),
        ledgerEntry: data?.ledgerEntry
      };
    } catch (error) {
      console.warn('[MISHWAR Payment] Server payment failed; using local fallback:', error);
      return null;
    }
  }
}

export const paymentService = new PaymentService();
