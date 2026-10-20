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

## Projektavimo šablonai

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
