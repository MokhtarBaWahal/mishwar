export interface OfflineQueueEvent {
  id: string;
  type: 'RIDE_REQUEST' | 'LOCATION_UPDATE' | 'RIDE_EVENT' | 'SOS';
  payload: unknown;
  createdAt: string;
  attempts: number;
}

class OfflineQueueService {
  private storageKey = 'mishwar:offline-queue:v1';

  enqueue(type: OfflineQueueEvent['type'], payload: unknown): OfflineQueueEvent {
    const event: OfflineQueueEvent = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0
    };
    this.save([event, ...this.getQueue()]);
    return event;
  }

  getQueue(): OfflineQueueEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as OfflineQueueEvent[]) : [];
    } catch {
      return [];
    }
  }

  clearDelivered(ids: string[]): void {
    this.save(this.getQueue().filter((event) => !ids.includes(event.id)));
  }

  getConnectionState(): { isWeakConnection: boolean; queuedEvents: number; labelAr: string } {
    const online = typeof navigator === 'undefined' ? true : navigator.onLine;
    const queuedEvents = this.getQueue().length;
    return {
      isWeakConnection: !online || queuedEvents > 0,
      queuedEvents,
      labelAr: !online ? 'الاتصال ضعيف' : queuedEvents > 0 ? 'بانتظار المزامنة' : 'متصل'
    };
  }

  private save(events: OfflineQueueEvent[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.storageKey, JSON.stringify(events.slice(0, 100)));
  }
}

export const offlineQueueService = new OfflineQueueService();
