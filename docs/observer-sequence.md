# Observer veikimo sekų diagrama

Pavyzdys: žaidėjas kardu pataiko priešą. `Game` nežino, kas kurs efektą. Jis tik paskelbia įvykį. `EffectObserver` jį gauna ir įdeda efektą į būseną, kurią `Room` jau siunčia klientams.

```mermaid
sequenceDiagram
    participant P as Žaidėjas
    participant G as Game (Subject)
    participant E as GameEventPublisher
    participant O as EffectObserver
    participant R as Room
    participant C as Kliento naršyklė
    P->>G: sword attack
    G->>E: notify(enemy-hit)
    E->>O: update(enemy-hit)
    O->>G: prideda Effect į state.effects
    R->>G: tick / gauna state
    R->>C: WebSocket state su effects
    C->>C: addBurst() parodo daleles
```
