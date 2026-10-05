# Pirmi šeši projektavimo šablonai

## 1. Singleton — vienas kambarių registras

- Failas: `src/server/rooms.ts`
- Klasė: `RoomRegistry`
- Vienintelis objektas gaunamas per `RoomRegistry.getInstance()`.

Serveriui reikia vienos bendros vietos, kur saugomi visi kambariai. Anksčiau tai buvo paprastas globalus `Map`; dabar jį valdo viena klasė. Konstruktorius yra `private`, todėl kita programos dalis negali netyčia sukurti antro registro.

**Thread safe demonstracija:** Node.js vienoje event-loop gijoje sinchroninę `create`, `join` arba `leave` funkciją atlieka iki galo prieš pradėdamas kitą tokią funkciją. Todėl `Map` būsena negali būti pakeista „per vidurį“ kitos operacijos. Jei ateityje į šias funkcijas būtų įdėtas `await` arba keli Node procesai, reikėtų papildomo mutex ar bendros duomenų bazės — to negalima nutylėti gynime.

## 2. Factory — priešų kūrimas

- Failas: `src/shared/enemyFactory.ts`
- Factory: `EnemyFactory`
- Produktai: `SkeletonEnemy`, `RunnerEnemy`, `BruteEnemy`
- Naudojama: `src/shared/level.ts`

`level.ts` nebekuria didelio priešų objekto ranka. Jis tik paprašo `factory.create(kind, spot, level)`. Factory žino, kiek gyvybių, greičio ir dydžio turi kiekvienas konkretus priešas. Taip pridėti ketvirtą tipą reikštų pakeisti Factory, o ne visą žaidimo kodą.

Kiekvienas produktas turi ir atskirą išvaizdą `src/client/sprites.ts`: mažas žalsvas `Runner`, didelis tamsus `Brute` su raudonomis akimis ir paprastas `Skeleton`.

## 3. Abstract Factory — keturios temų šeimos

- Failas: `src/shared/themeFactory.ts`
- Abstract Factory sąsaja: `ThemeFactory`
- Real factories: `CryptThemeFactory`, `FrostThemeFactory`, `FireThemeFactory`, `GardenThemeFactory`
- Kiekvienoje šeimoje yra trys produktai: `EnemyAppearance`, `MazeAppearance`, `EffectAppearance`.

Tema yra pilnas suderintų dalykų rinkinys. Kampanijoje yra tik penki lygiai: paprasta kripta; ledas su gydymo plytelėmis; ledas be gydymo; ugnis ir ledas su gydymo plytelėmis; ugnis ir ledas be gydymo. Ledas kas sekundę atima 1 HP, ugnis iškart nugali žaidėją, o gydymo plytelės kas sekundę atstato 1 HP. `themeForLevel()` parenka konkrečią šeimą ir jos variantą, o `Game` per `visualsFrom()` pasiima vaizdo produktus ir `createFloorRules()` naudoja funkcines taisykles.

## 4. Strategy — priešo judėjimas

- Failas: `src/shared/enemyStrategies.ts`
- Strategijų sąsaja: `EnemyStrategy`
- Strategijos: `ChaseStrategy`, `RetreatStrategy`, `CircleStrategy`, `WanderStrategy`
- Naudojama: `Game.updateEnemy()` faile `src/shared/game.ts`

Kiekviena strategija yra atskiras būdas pasirinkti, kaip priešas juda. `Game` nebesaugo ilgo `if/else` su visų tipų elgsena: jis paklausia `strategyFor(enemy, target)`, gauna tinkamą strategiją ir iškviečia `move()`. Skeleton seka, runner laikosi atstumo, brute juda ratu, o nematantis žaidėjo priešas klaidžioja.

## 5. Observer — žaidimo įvykiai ir efektai

- Failas: `src/shared/gameEvents.ts`
- Subject: `GameEventPublisher`
- Observer sąsaja: `GameEventObserver`
- Concrete Observer: `EffectObserver`
- Sekų diagrama: `docs/observer-sequence.md`

Kai priešas gauna smūgį, `Game` nebekuria dalelių tiesiogiai. Jis paskelbia `enemy-hit` įvykį. Publisher apie jį praneša `EffectObserver`, o šis sukuria efektą `state.effects` sąraše. Tas pats veikia ledo žalai ir širdelės surinkimui (`heart-collected`): širdelė prideda iki 2 HP, dingsta iš bendros būsenos ir parodo rožinį dalelių efektą.

## 6. Builder — labirinto statymas etapais

- Failas: `src/shared/maze.ts`
- Director: `MazeDirector`
- Builder sąsaja: `MazeBuilder`
- Concrete builders: `ClassicMazeBuilder`, `OpenMazeBuilder`

Labirintas visada surenkamas tais pačiais etapais: sukurti tuščią tinklelį, iškirsti kelius, padaryti papildomas angas ir atidaryti starto kambarį. `MazeDirector` nurodo šią eigą. Concrete Builder (`ClassicMazeBuilder`, `OpenMazeBuilder`, `IceHealingMazeBuilder`, `FireIceMazeBuilder`, `FireIceHealingMazeBuilder`) pažymi skirtingas specialias plyteles; Builder pateikia jų koordinates, bet nusprendimą apie žalą ar gydymą palieka Abstract Factory taisyklėms.

## 7. Adapter — vienas paprastas `send()` vietoj `ws` bibliotekos

- Failas: `src/server/connection.ts`
- Target: `Connection` (1 metodas: `send(message)`)
- Adapter: `WebSocketAdapter`
- Adaptee: `WebSocket` iš bibliotekos `ws` (daug metodų: `send`, `close`, `ping`, `terminate`, `on`... ir siunčia tik tekstą)
- Naudojama: `Room` (`member.connection.send(...)`)

Kambariui reikia tik pasakyti „nusiųsk šią žinutę žaidėjui“. Adapteris pats paverčia žinutę į JSON ir patikrina, ar ryšys dar atidarytas. Taip `Room` nežino nieko apie `ws`, o Adapter (1 metodas) ir Adaptee (daug metodų) turi skirtingus metodų kiekius.

## 8. Prototype — kiekvienas žaidėjas gauna savo kardo kopiją

- Failas: `src/shared/weapon.ts`
- Prototype: `SWORD_PROTOTYPE` (klasė `Sword`)
- `clone()` — gili kopija (naudojama žaidime), `shallowClone()` — sekli kopija (tik palyginimui)
- Naudojama: `Game` konstruktoriuje

Paruoštas kardas kopijuojamas kiekvienam žaidėjui. Kardas turi įdėtą objektą `stats`. Sekli kopija dalytųsi tuo pačiu `stats` su originalu (pakeitus vieną, pasikeistų visi), gili kopija sukuria atskirą. Palyginimas su objektų numeriais: `npm run demo`.

**Svarbu gynimui:** JavaScript neturi atminties adresų, todėl demonstracijoje kiekvienam objektui priskiriamas numeris (`#1`, `#2`...), o „tas pats objektas“ rodoma tuo, kad `stats` numeris sutampa. Žaidime kol kas niekas nekeičia `stats`, todėl skirtumą rodo tik demonstracija.

## 9. Decorator — kardo patobulinimai (3 lygiai)

- Failas: `src/shared/weapon.ts`
- Component: `Weapon`, bazinis objektas `Sword`
- Decorators: `LongBlade` (+15 siekis), `SharpBlade` (+1 žala), `BlessedBlade` (+10 siekis)
- Naudojama: `Game.upgradeWeapons()` ir `Game.swingSword()`

Kiekviename naujame aukšte visų žaidėjų ginklas apgaubiamas dar vienu patobulinimu: 2 aukštas — `Long Sword`, 3 — `Sharp Long Sword`, 4 — `Blessed Sharp Long Sword` (3 dekoravimo lygiai). Dekoratorius nekeičia viduje esančio kardo, tik pakeičia skaičių, kurį grąžina. Ginklo pavadinimas rodomas virš savo riterio.

**Žaidimo balansas:** nuo 4 aukšto kardas smogia 2 žalos ir siekia 108 vietoj 1 žalos ir 83, todėl žaidimas kiek lengvesnis.

Demonstracija (`main()`): `npm run demo` (`src/demo/patternsDemo.ts`).
