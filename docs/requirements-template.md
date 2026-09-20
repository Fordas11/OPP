# Reikalavimų atitiktis: šablono būsena

Šis etapas yra sąmoningai paruoštas kaip pirmos dalies architektūros šablonas. Veikiantis `game.js` yra atskiras grafinis ir valdymo prototipas, o `src/` yra TypeScript migracijos pagrindas.

| Reikalavimas | Šablono būsena |
| --- | --- |
| Be karkasų, tinkama objektinė kalba, web aplikacija | Įvykdyta: Canvas API ir TypeScript, be framework'ų. |
| 2D grafika ir žaidimo valdymo prototipas | Įvykdyta esamame `game.js`. |
| Bent 2 paketai ir bent 10 klasių pradinei diagramai | Įvykdyta: `client`, `server`, `shared`; 29 klasės. |
| Išplėsta klasės diagrama iki 20 klasių | Kodo šablone įvykdyta; UML diagramą dar reikia sukurti MagicDraw. |
| Singleton, Factory, Strategy, Observer, Command ir kt. | Įvykdyti kaip konkretūs šablonai; žr. `README.md`. |
| Singleton thread-safe demonstravimas | `RoomRegistry` kuriamas eager būdu, o mutacijos serializuojamos per `AsyncLock`; demonstracijai reikės parašyti testą. |
| Factory šeimoje bent 3 klasės | Įvykdyta: Knight, Skeleton, Boulder, Pillar. |
| Strategy bent 4 klasės | Įvykdyta: Idle, Wander, Chase, Attack. |
| Command su `undo()` | Įvykdyta: `CommandHistory`, `MoveCommand`, `AttackCommand`. |
| Klientas-serveris, JSON ir WebSocket | Įdėtas kontraktas, JSON adapteris, WebSocket kliento ir serverio registrų šablonai; realus serverio procesas dar neįgyvendintas. |
| Multiplayer, DB, ataskaita, Use Case/UML/sekų diagramos | Sąmoningai palikta kitam etapui. Tai negali būti laikoma baigtu semestro projektu. |
| Antros dalies 40 klasių ir papildomi šablonai | Neįgyvendinta šiame pirmos dalies šablone. |
