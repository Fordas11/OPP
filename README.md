# Dungeon Crawler - OOP project template

This repository keeps the current browser game (`index.html`, `styles.css`, `game.js`) as the required graphical and controls prototype. The `src/` directory is the framework-free TypeScript architecture to migrate into next. No game framework is used.

## Requirement-aligned template

- Language and platform: TypeScript web application with Canvas 2D.
- Packages: `src/client`, `src/server`, and `src/shared`.
- Network contract: JSON messages and a `WebSocketGameClient` template; `RoomRegistry` is the server-side composition point.
- Prototype: the existing playable Canvas implementation demonstrates rendering and controls before the pattern migration.
- Class count: the template already contains more than 20 named classes, ready for a detailed UML class diagram.

## Implemented pattern scaffolds

| Pattern | Template classes | Requirement link |
| --- | --- | --- |
| Singleton | `GameApplication`, `RoomRegistry` | One composition root; registry initialization is eager and registry mutations are serialized through `AsyncLock`. |
| Factory | `DungeonEntityFactory`, `Knight`, `Skeleton`, `Boulder`, `Pillar` | Four related map-object classes. |
| Strategy | `IdleStrategy`, `WanderStrategy`, `ChaseStrategy`, `AttackStrategy` | Four skeleton AI strategies. |
| Observer | `GameEventBus`, `HudObserver`, `NetworkObserver` | UI and network layers react to domain events independently. |
| Command | `MoveCommand`, `AttackCommand`, `CommandHistory` | Input commands include `undo()`. |
| Adapter | `JsonProtocolAdapter` | Transport JSON is isolated from the game domain. |
| State | `MenuState`, `PlayingState`, `PausedState`, `GameOverState` | Menu and game flow are explicit states. |

## Next migration step

1. Install TypeScript with `npm install`.
2. Run `npm run check` and `npm run build`.
3. Move one responsibility at a time from `game.js` into `src/client`, beginning with entities and the factory.

The server remains a template on purpose: the project can later provide a local WebSocket service that uses `RoomRegistry` and broadcasts `GameSnapshot` objects to all players in the same room.
