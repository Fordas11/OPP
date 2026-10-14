# Dungeon Crawler

Kooperatyvinis 2D žaidimas naršyklėje (iki 4 žaidėjų). Riteriai kartu eina per 5 labirinto aukštus ir naikina skeletus. Kiekvieną kartą labirintas sugeneruojamas iš naujo. Parašyta su TypeScript, Canvas 2D ir WebSocket, be žaidimų variklio.

## Paleidimas

```bash
npm install
npm start
```

Atidaryk `http://localhost:3000`.

## Žaidimas

1. Vienas žaidėjas (šeimininkas) spaudžia **Create Room** ir pasako kitiems 4 raidžių kodą.
2. Kiti spaudžia **Join Room** ir įveda kodą. Šeimininkas spaudžia **Start Game**.
3. Reikia nužudyti visus aukšto skeletus, tada pereinama į kitą aukštą. Nugalėjus 5 aukštą žaidimas baigiasi.

**Valdymas**

| Veiksmas | Klavišas |
| --- | --- |
| Judėti | `W` `A` `S` `D` |
| Kardas | kairysis pelės mygtukas |
| Lankas | dešinysis pelės mygtukas |
| Meniu / pauzė | `Esc` |

Mygtukus ir sudėtingumą (calm / standard / brutal) galima keisti nustatymuose, o pakeitimą galima atšaukti (`Ctrl+Z`).

**Ginklai**
- **Kardas** muša aplink pelės kryptį. Kas 3 nužudytus skeletus jis patobulinamas: ilgesnis, aštresnis, palaimintas.
- **Lankas** turi 20 strėlių, kurios atsinaujina kiekviename naujame aukšte (rodoma viršuje dešinėje). Strėlės atsimuša nuo sienų ir po 3 atsimušimų sulūžta. Nuo 5 aukšto kiekvienas atsimušimas strėlę padvigubina.

**Aukštų pavojai:** ledas kas sekundę atima 1 gyvybę, ugnis (raudonos plytelės) nužudo iškart, žolė gydo. Raudonos plytelės niekada neužkerta kelio, todėl visi skeletai pasiekiami. Rink širdeles, kad atsigautum.

## Žaidimas su draugais

1. Visi prisijungia prie to paties tinklo (tinka ir telefono hotspot).
2. Šeimininkas paleidžia `npm start` ir sužino savo IP (Windows: `ipconfig`, IPv4 adresas, pvz. `192.168.0.112`).
3. Kiti atsidaro `http://<šeimininko IP>:3000`.

Jei neprisijungia: leisk Node.js per Windows ugniasienę, o viešuose Wi-Fi tinkluose gali būti užblokuotas įrenginių tarpusavio ryšys. Reikia klaviatūros ir pelės. Į pradėtą žaidimą prisijungti nebegalima.

## Kaip veikia

Žaidimo logiką vykdo serveris. Naršyklė 30 kartų per sekundę siunčia klavišus ir pelės kryptį, serveris atnaujina žaidimą ir grąžina visą būseną, o naršyklė ją tik nupiešia.

```
public/        index.html, styles.css
src/shared/    žaidimo taisyklės (serveris)
src/server/    HTTP + WebSocket serveris, kambariai
src/client/    naršyklės kodas: įvestis, piešimas, meniu
```

## Projektavimo šablonai

Panaudota 12 šablonų.

| # | Šablonas | Kur | Kam |
| --- | --- | --- | --- |
| 1 | Singleton | `server/rooms.ts` | vienas kambarių registras |
| 2 | Factory | `shared/enemyFactory.ts` | priešų kūrimas |
| 3 | Abstract Factory | `shared/themeFactory.ts` | aukštų temos |
| 4 | Strategy | `shared/enemyStrategies.ts` | priešų judėjimas |
| 5 | Observer | `shared/gameEvents.ts` | žaidimo įvykiai ir efektai |
| 6 | Builder | `shared/maze.ts` | labirinto statymas |
| 7 | Adapter | `server/connection.ts` | WebSocket siuntimas |
| 8 | Prototype | `shared/arrow.ts` | strėlių kopijavimas |
| 9 | Decorator | `shared/weapon.ts` | kardo patobulinimai |
| 10 | Facade | `client/session.ts` | vienas įėjimas į kliento posistemius |
| 11 | Bridge | `client/healthBars.ts` | gyvybių juostos ir jų stiliai |
| 12 | Command | `client/commands.ts` | nustatymų keitimas su atšaukimu |

**1. Singleton.** `RoomRegistry` turi privatų konstruktorių, o vienintelis objektas gaunamas per `getInstance()`. Taip serveris turi vieną kambarių sąrašą. Node.js vykdo kodą vienoje gijoje, todėl `create`, `join` ir `leave` negali persidengti.

**2. Factory.** `level.ts` neapibrėžia priešų ranka, o kviečia `factory.create('brute', spot, level)`. Skeletas, bėgikas ir stipruolis skiriasi tik dydžiu, gyvybėmis ir greičiu.

**3. Abstract Factory.** `ThemeFactory` sukuria visą aukšto temos rinkinį: priešo, sienų ir efektų spalvas bei grindų taisykles (ledas, ugnis, gydymas). Yra keturios temos: kripta, šaltis, ugnis ir sodas. `themeForLevel()` parenka temą aukštui.

**4. Strategy.** Priešo judėjimas keičiamas. `ChaseStrategy` vejasi, `RetreatStrategy` laikosi atstumo, `CircleStrategy` sukasi aplink, `WanderStrategy` klajoja. `strategyFor()` parenka vieną pagal priešo tipą ir ar jis mato žaidėją, todėl `Game` neturi ilgo `if/else`.

**5. Observer.** Kai kas nors nutinka (smūgis, žala, širdelė, strėlės atsimušimas), `Game` tik paskelbia įvykį. `EffectObserver` paverčia jį dalelių efektu, kurį gauna visi žaidėjai. Sekų diagrama: `docs/observer-sequence.md`.

**6. Builder.** `MazeDirector` visada vykdo tuos pačius žingsnius (tinklelis, keliai, papildomos angos, starto kambarys, specialios plytelės), o konkretūs builderiai juos atlieka skirtingai (klasikinis, atviras, ledo, ugnies, sodo ir jų deriniai). Ugnies builderis dar patikrina, kad plytelė neatkirstų dalies labirinto.

**7. Adapter.** `ws` biblioteka turi daug metodų ir siunčia tik tekstą, o `Room` reikia tik `send(message)`. `WebSocketAdapter` šią sąsają įgyvendina: paverčia žinutę JSON ir patikrina, ar ryšys atidarytas.

**8. Prototype.** `ARROW_PROTOTYPE` yra paruošta strėlė. Kiekvienas šūvis yra jos kopija: `ARROW_PROTOTYPE.clone().launch(...)`. Strėlė turi įdėtą objektą `stats` (žala, greitis), todėl `clone()` daro gilią kopiją (`structuredClone`). Nuo 5 aukšto atsimušusi strėlė kopijuoja pati save ir pakeičia tik kampą: `arrow.clone().turn(SPLIT_ANGLE)`. Iš vienos strėlės gali atsirasti iki 8.

**9. Decorator.** `Sword` yra bazinis ginklas, o `LongBlade` (siekis +15), `SharpBlade` (žala +1) ir `BlessedBlade` (siekis +10) apgaubia kitą ginklą ir pakeičia vieną skaičių. Kas 3 riterio nužudymus jo ginklas apgaubiamas dar vienu sluoksniu, todėl skirtingų žaidėjų ginklai skiriasi, pvz. `Blessed Sharp Long Sword`.

**10. Facade.** Meniu ir klaviatūros valdikliai kalba tik su `GameSession`. Jis viduje valdo tris dalis: ryšį su serveriu (`ServerConnection`), ekranus (`ScreenManager`) ir įvestį (`InputState`).

**11. Bridge.** Gyvybių juosta (žaidėjo ar priešo) ir jos piešimo būdas (vientisa ar suskirstyta į dalis) yra atskirose hierarchijose. Stilius pasirenkamas nustatymuose ir veikia su bet kuria juosta.

**12. Command.** Kiekvienas nustatymo pakeitimas (klavišas, sudėtingumas, juostos stilius, atstatymas) yra objektas su `execute()` ir `undo()`. `CommandHistory` saugo istoriją, todėl pakeitimus galima atšaukti.
