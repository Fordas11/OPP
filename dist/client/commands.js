export class MoveCommand {
    knight;
    destination;
    previous;
    constructor(knight, destination) {
        this.knight = knight;
        this.destination = destination;
    }
    execute() { this.previous = { ...this.knight.position }; this.knight.position = { ...this.destination }; }
    undo() { if (this.previous)
        this.knight.position = this.previous; }
}
export class AttackCommand {
    knight;
    aim;
    previousAim = 0;
    constructor(knight, aim) {
        this.knight = knight;
        this.aim = aim;
    }
    execute() { this.previousAim = this.knight.aim; this.knight.aim = this.aim; }
    undo() { this.knight.aim = this.previousAim; }
}
/** Command pattern with undo history, ready for replay and multiplayer input sequences. */
export class CommandHistory {
    done = [];
    run(command) { command.execute(); this.done.push(command); }
    undo() { this.done.pop()?.undo(); }
}
