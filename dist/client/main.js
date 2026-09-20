import { GameApplication } from './GameApplication';
// Future TypeScript entry point. The current game.js remains the stage-one playable prototype.
export function main() { return GameApplication.getInstance(); }
export const application = main();
