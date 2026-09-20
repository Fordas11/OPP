/** Observer pattern: UI and networking receive the same domain events without coupling. */
export class GameEventBus {
    observers = new Set();
    subscribe(observer) { this.observers.add(observer); }
    unsubscribe(observer) { this.observers.delete(observer); }
    publish(event) { this.observers.forEach(observer => observer.onGameEvent(event)); }
}
export class HudObserver {
    lastEvent;
    onGameEvent(event) { this.lastEvent = event; }
}
export class NetworkObserver {
    outgoing = [];
    onGameEvent(event) { this.outgoing.push(event); }
}
