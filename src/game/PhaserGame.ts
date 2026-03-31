/**
 * PhaserGame — factory that creates and owns the Phaser.Game instance.
 *
 * This is the ONLY place Phaser is instantiated. Call `createGame(parent)`
 * once from the React `<PhaserCanvas>` component and let React own the
 * lifecycle via useEffect.
 */

import Phaser from "phaser";
import { Boot } from "./scenes/Boot";
import { GameScene } from "./scenes/GameScene";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";

export function createGame(parent: HTMLDivElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    render: {
      pixelArt: true,
    },
    width: 960,
    height: 640,
    parent,
    backgroundColor: "#0f0f13",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 2,           // allow joystick + action button at once
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: import.meta.env.DEV,
      },
    },
    scene: [Boot, Preloader, MainMenu, GameScene],
  };

  return new Phaser.Game(config);
}
