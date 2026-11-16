# Dungeon Crawler

2D kooperacinis žaidimas naršyklėje (iki 4 žaidėjų). Riteriai eina per 5 labirinto aukštus ir žudo skeletus.

## Paleidimas

```bash
npm install
npm start
```

Atidaryk `http://localhost:3000`. Vienas žaidėjas sukuria kambarį, kiti prisijungia su 4 raidžių kodu.

## Valdymas

| Veiksmas | Klavišas |
| --- | --- |
| Judėti | `W` `A` `S` `D` |
| Kardas | kairysis pelės mygtukas |
| Lankas | dešinysis pelės mygtukas |
| Meniu | `Esc` |
| Konsolė | `~` (siųsti – `Enter`, uždaryti – `Esc` arba `~`) |

## Projektavimo šablonai (1 dalis)

| # | Šablonas | Kur | Kam |
| --- | --- | --- | --- |
| 1 | Singleton | `server/rooms.ts` | vienas kambarių registras |
| 2 | Factory | `shared/enemies/enemyFactory.ts` | priešų kūrimas |
| 3 | Abstract Factory | `shared/themes/themeFactory.ts` | aukštų temos |
| 4 | Strategy | `shared/enemies/enemyStrategies.ts` | priešų judėjimas |
| 5 | Observer | `shared/events/gameEvents.ts` | žaidimo įvykiai ir efektai |
| 6 | Builder | `shared/maze/maze.ts` | labirinto statymas |
| 7 | Adapter | `server/connection.ts` | WebSocket siuntimas |
| 8 | Prototype | `shared/weapons/arrow.ts` | strėlių kopijavimas |
| 9 | Decorator | `shared/weapons/weapon.ts` | kardo patobulinimai |
| 10 | Facade | `client/session/session.ts` | vienas įėjimas į kliento posistemius |
| 11 | Bridge | `client/render/healthBars.ts` | gyvybių juostos ir jų stiliai |
| 12 | Command | `shared/cheats/cheats.ts` | cheat'ai su atšaukimu (`Ctrl+Z`) |

## Projektavimo šablonai (2 dalis)

| # | Šablonas | Kur | Kam |
| --- | --- | --- | --- |
| 7 | Chain of Responsibility | `shared/damage/damageChain.ts` | žalos taisyklių grandinė: god mode → neliečiamumas → skydas → gyvybės |
| 8 | Visitor | `shared/pickups/pickups.ts` | trys veiksmai su daiktais ant grindų: ar reikalingas, paimti, aprašyti |
| 9 | Interpreter | `shared/console/interpreter.ts` | žaidimo konsolės komandų kalba |

## Daiktai ir skydas

Ant grindų guli trijų rūšių daiktai: širdis (+2 gyvybės), strėlių ryšulys (+8 strėlės) ir nuo 2 aukšto skydas (+1 krūvis, daugiausiai 2). Daiktas paimamas tik jei jis žaidėjui naudingas (pvz. pilnų gyvybių riteris širdies neima – ji lieka draugui). Skydas užblokuoja vieną skeleto smūgį.

## Konsolė

`~` atidaro konsolę, atsakymas rodomas ekrano apačioje. Komandas galima jungti per `;` ir kartoti per `repeat`:

| Komanda | Ką daro |
| --- | --- |
| `help` | komandų sąrašas |
| `heal` | pilnos gyvybės |
| `speed 100..500` | greitis |
| `god on/off` | nemirtingumas |
| `freeze on/off` | sustabdo priešus |
| `spawn skeleton/runner/brute [1..5]` | sukuria priešų |
| `give arrows [1..20]` / `give shield [1..2]` | strėlės / skydas |
| `repeat 1..5 <komanda>` | kartoja komandą |

Pavyzdys: `spawn runner 2; give shield; repeat 3 give arrows 5`.
