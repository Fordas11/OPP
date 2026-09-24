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
