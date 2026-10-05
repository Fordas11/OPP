# Dungeon Crawler

A 2D co-op web game for up to four players. One player (the host) creates a room and shares the 4-letter code, the others join, the host presses Start, and together they fight skeletons in a new random maze on every floor. Written in TypeScript with Canvas 2D and WebSockets, no game framework.

## Run

```bash
npm install
npm start
```

## Playing with friends on the same Wi-Fi or phone hotspot

1. Connect the computer that runs the game (the host) and every other player's device to the same network. A phone hotspot works: switch it on and connect everyone to it.
2. On the host, run `npm start` and open `http://localhost:3000`. Find the host's local IP address (on Windows run `ipconfig` and look for the IPv4 address, for example `192.168.0.112`).
3. The host clicks **Create Room** and tells the others the room code.
4. Everyone else opens `http://<host IP>:3000` (for example `http://192.168.0.112:3000`), clicks **Join Room** and types the code.
5. When everyone has joined (up to 4), the host clicks **Start Game**.

Notes:
- The first time, Windows asks if Node.js may accept connections. Allow it for private networks. If the hotspot network is marked as "public", allow it there too, otherwise the other devices cannot connect.
- Some hotspots and public Wi-Fi block devices from talking to each other (client isolation). Then use a different network or the host's own hotspot.
- Players need a keyboard and mouse. There are no touch controls.
- A game cannot be joined after it has started. If someone leaves during the game, the others keep playing.

## Controls

- Move: `W` `A` `S` `D`
- Attack: left mouse button (aim with the mouse)
- `Esc`: menu (the game keeps running)
- Keybinds and difficulty can be changed in Settings. Difficulty applies to rooms you create.

## Project structure

```
public/          index.html and styles.css
src/shared/      game rules, used by the server (types, maze, movement, level, game)
src/server/      HTTP + WebSocket server, rooms and the network address helper
src/client/      browser code: input, drawing, menus, connection
```

How it works: the server runs the game. Each browser sends its input (keys and mouse aim) 30 times per second, the server updates the game and sends the full state back, and the browser only draws it.

## Projektavimo šablonai (Design Patterns)

Žaidime įgyvendinta 9 šablonai. Lentelė rodo, kur kiekvienas yra ir kur naudojamas.

**Žaidime matomi šablonai (Adapter, Prototype, Decorator):** žaidimo metu paspauskite `P`. Atsidaro langas, kuris rodo gyvus šių trijų šablonų duomenis. Dar kardas tampa ilgesnis su kiekvienu patobulinimu, o virš savo riterio matote ginklo pavadinimą.

| # | Šablonas | Failas | Naudojamas |
| --- | --- | --- | --- |
| 1 | Singleton | `src/server/rooms.ts` | `server.ts` (per `createRoom`, `joinRoom`...) |
| 2 | Factory | `src/shared/enemyFactory.ts` | `level.ts` |
| 3 | Abstract Factory | `src/shared/themeFactory.ts` | `game.ts` |
| 4 | Strategy | `src/shared/enemyStrategies.ts` | `game.ts` |
| 5 | Observer | `src/shared/gameEvents.ts` | `game.ts` |
| 6 | Builder | `src/shared/maze.ts` | `game.ts` (per `createMazeLayout`) |
| 7 | Adapter | `src/server/connection.ts` | `room.ts` |
| 8 | Prototype | `src/shared/weapon.ts` | `game.ts` |
| 9 | Decorator | `src/shared/weapon.ts` | `game.ts` |

### 1. Singleton — vienas kambarių registras

Serveriui reikia vienos bendros vietos, kur saugomi visi kambariai. `RoomRegistry` konstruktorius yra `private`, todėl kita programos dalis negali sukurti antro registro. Vienintelis objektas gaunamas per `getInstance()`.

```ts
export class RoomRegistry {
  private static instance: RoomRegistry | undefined;
  private readonly rooms = new Map<string, Room>();
  private constructor() {}
  public static getInstance(): RoomRegistry { return RoomRegistry.instance ??= new RoomRegistry(); }
}
```

**Thread safe:** Node.js vykdo kodą vienoje gijoje, o sinchroninė funkcija (`create`, `join`, `leave`) pasibaigia prieš prasidedant kitai, todėl `Map` negali būti pakeistas „per vidurį". Jei į šias funkcijas būtų įdėtas `await` arba būtų keli serverio procesai, reikėtų papildomo užrakto ar bendros duomenų bazės.

### 2. Factory — priešų kūrimas

`level.ts` neįrašo kiekvieno priešo skaičių ranka, o paprašo `EnemyFactory`. Trys produktai (`SkeletonEnemy`, `RunnerEnemy`, `BruteEnemy`) paveldi iš `EnemyProduct` ir skiriasi tik spinduliu, gyvybėmis ir greičiu.

```ts
export class BruteEnemy extends EnemyProduct { kind = 'brute'; radius = 21; baseHp = 4; baseSpeed = 38; }

const enemy = factory.create('brute', spot, level); // level.ts
```

Naujam priešo tipui reikia tik naujos klasės factory viduje, žaidimo kodas nesikeičia.

### 3. Abstract Factory — temų šeimos

Aukšto „tema" yra suderintų dalykų rinkinys: priešo spalva, sienos spalva, efekto spalva ir grindų taisyklės (ledas, ugnis, gydymas). Sąsaja `ThemeFactory` kuria visą šeimą, o keturios realios factory (`CryptThemeFactory`, `FrostThemeFactory`, `FireThemeFactory`, `GardenThemeFactory`) kiekviena sukuria savo produktus.

```ts
export interface ThemeFactory {
  createEnemyAppearance(kind: EnemyKind): EnemyAppearance;
  createMazeAppearance(): MazeAppearance;
  createEffectAppearance(): EffectAppearance;
  createFloorRules(): FloorRules;
}
```

`themeForLevel(level)` parenka temą aukštui. `Game` naudoja tik sąsają, todėl nežino, kuri tema veikia.

### 4. Strategy — priešo judėjimas

Priešo judėjimo būdas yra keičiamas algoritmas. Sąsaja `EnemyStrategy.move()` turi keturias realizacijas: `ChaseStrategy` (vejasi), `RetreatStrategy` (laikosi atstumo), `CircleStrategy` (sukasi aplink), `WanderStrategy` (klajoja). `strategyFor(enemy, target)` parenka strategiją pagal priešo tipą ir ar jis mato žaidėją.

```ts
strategyFor(enemy, target).move(enemy, { maze, target, dt }); // Game.updateEnemy()
```

`Game` nebeturi ilgo `if/else` su visų tipų elgsena.

### 5. Observer — žaidimo įvykiai

Kai nutinka įvykis (smūgis, žala, širdelė), `Game` jį tik paskelbia, nežinodamas, kas jį apdoros. `GameEventPublisher` (subject) praneša stebėtojams, o `EffectObserver` paverčia įvykį dalelių efektu `state.effects` sąraše, kurį `Room` išsiunčia visiems žaidėjams.

```ts
this.events.subscribe(new EffectObserver(this.state, () => ...));   // Game konstruktoriuje
this.events.notify({ type: 'enemy-hit', x: enemy.x, y: enemy.y });  // swingSword()
```

Sekų diagrama: `docs/observer-sequence.md`.

### 6. Builder — labirinto statymas

Labirintas visada statomas tais pačiais žingsniais, bet skirtingų aukštų labirintai skiriasi. `MazeDirector` nustato eigą, o konkretūs builderiai (`ClassicMazeBuilder`, `OpenMazeBuilder`, `IceHealingMazeBuilder`, `FireMazeBuilder`, `FireIceMazeBuilder`, `FireIceHealingMazeBuilder`, `GardenMazeBuilder`) atlieka žingsnius pagal savo variantą.

```ts
construct(builder) {
  builder.createEmptyGrid();   // tuščias tinklelis
  builder.carvePaths();        // keliai
  builder.addExtraOpenings();  // papildomos angos
  builder.addStartRoom();      // starto kambarys
  builder.addSpecialTiles();   // ledas, ugnis, gydymas
  return builder.getResult();
}
```

`createMazeLayout(variant)` parenka builderį pagal temą.

### 7. Adapter — vienas paprastas `send()`

Bibliotekos `ws` WebSocket (adaptee) turi daug metodų ir siunčia tik tekstą. `Room` reikia tik „nusiųsti šią žinutę žaidėjui". `Connection` (tikslas) turi vieną metodą `send(message)`, o `WebSocketAdapter` jį įgyvendina: paverčia žinutę į JSON ir patikrina, ar ryšys atidarytas.

```ts
export class WebSocketAdapter implements Connection {
  public constructor(private readonly socket: WebSocket) {}
  public send(message: ServerMessage): void {
    if (this.socket.readyState === this.socket.OPEN) this.socket.send(JSON.stringify(message));
  }
}
```

`Room` kiekvienam nariui laiko `connection` ir siunčia per jį: `member.connection.send(...)`. Adapter turi 1 metodą, Adaptee daug, todėl metodų kiekiai skiriasi.

**Žaidime:** `P` lange eilutė „JSON messages sent to you through it“ rodo, kiek žinučių į jūsų naršyklę išsiuntė būtent šis adapteris (skaičius auga kas tiksėjimą, 30 kartų per sekundę).

### 8. Prototype — kiekvienas žaidėjas gauna savo kardą

Paruoštas kardas `SWORD_PROTOTYPE` kopijuojamas kiekvienam žaidėjui. Kardas turi įdėtą objektą `stats` (žala ir siekis), todėl svarbu, kaip kopijuojama:
- `clone()` yra **gili kopija**: sukuria naują `stats` per `structuredClone`. Naudojama žaidime.
- `shallowClone()` yra **sekli kopija**: naujas kardas dalijasi tuo pačiu `stats`, todėl pakeitus vieno kardo žalą pasikeistų ir originalo. Palikta palyginimui.

```ts
public clone(): Sword { return new Sword(structuredClone(this.stats)); }
public shallowClone(): Sword { return new Sword(this.stats); }

this.weapons.set(id, SWORD_PROTOTYPE.clone()); // Game konstruktoriuje
```

**Žaidime:** `P` lange rodoma, kad kiekvieno riterio kardas (`sword #N`) turi savo `stats` (`own stats #M`), o seklia kopija būtų naudojamas tas pats `stats` kaip ir prototipo (`shallow copy would share #X`).

JavaScript neturi atminties adresų, todėl objektams skiriami numeriai (`objectId()` faile `weapon.ts`): tas pats numeris reiškia tą patį objektą. Tai atstoja atminties adresus.

### 9. Decorator — kardo patobulinimai

`Weapon` sąsaja turi `name()`, `damage()` ir `reach()`. `Sword` yra bazinis ginklas, o `WeaponDecorator` apgaubia kitą ginklą ir pakeičia vieną skaičių, nelies viduje esančio objekto:
- `LongBlade` — siekis +15
- `SharpBlade` — žala +1
- `BlessedBlade` — siekis +10

```ts
export class SharpBlade extends WeaponDecorator {
  public override name(): string { return `Sharp ${this.inner.name()}`; }
  public override damage(): number { return this.inner.damage() + 1; }
}
```

Kas 3 paties riterio nužudytus skeletus (`Game.upgradeWeapon()`) jo ginklas apgaubiamas dar vienu patobulinimu: po 3 nužudymų `Long Sword`, po 6 `Sharp Long Sword`, po 9 `Blessed Sharp Long Sword` (trys dekoravimo lygiai). Patobulinimai priklauso nuo kiekvieno žaidėjo nužudymų, todėl skirtingų riterių ginklai skiriasi. Ginklo pavadinimas rodomas virš savo riterio, o kardas ir smūgio lankas piešiami ilgesni pagal `reach`. `P` lange matoma grandinė `Sword -> Long -> Sharp -> Blessed`, žala, siekis ir nužudymų skaičius. `swingSword()` žalą ir siekį ima iš ginklo: `weapon.damage()`, `weapon.reach()`.
