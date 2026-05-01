/**
 * Quest definitions — every quest in the game is declared here.
 *
 * Each definition is a self-contained package:
 *   • metadata  (id, title, description)
 *   • handler   (stateless gameplay logic)
 *   • dialogs   (NPC text templates, interpolated with progress data)
 *   • formatProgress  (optional progress badge for the quest tracker)
 *
 * To add a new quest:
 *   1. Pick the right handler (TalkQuestHandler, CollectQuestHandler, …).
 *   2. Add a new QuestDefinition to the array below.
 *   3. That's it — QuestManager and the HUD pick it up automatically.
 */

import type { QuestDefinition } from './types';
import { TalkQuestHandler } from './TalkQuestHandler';
import { CollectQuestHandler } from './CollectQuestHandler';
import { DeliverQuestHandler } from './DeliverQuestHandler';
import { EventBus } from '../EventBus';
import { LAYERS } from '../constants';
import { worldState } from '../worldState';
import { inventory } from '../inventory';

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'talk-to-stranger',
    title: 'The Stranger in the Fields',
    description: {
      active: "The Purple Warrior mentioned a mysterious stranger lurking in the eastern fields.\n\nGo explore the area and find out what they want. Be cautious!",
      done: "You've spoken to the stranger. They seem to be coordinating something with the Purple Warrior.\n\nGo back and report what you found.",
      complete: "The mission is accomplished. The stranger's message was delivered, and the gears of fate are turning.",
      failed: "The connection was lost. You failed to bridge the gap between the warrior and the stranger."
    },
    handler: new TalkQuestHandler({
      giverNpcId: 'purple-warrior',
      targetNpcId: 'black-warrior',
    }),
    dialogs: {
      'purple-warrior': {
        inactive:
          "Hey traveler! I've heard rumors of a mysterious stranger in the eastern fields. Could you go find them and see what they want?",
        active:
          'Have you found the stranger yet? Head east through the fields to find them.',
        done: 'So it begins. Open the gates!',
        complete:
          "The gates are open! The time has come!",
      },
      'black-warrior': {
        inactive: "... Who are you? I don't know what you want.",
        active:
          'Ah, so the Purple Warrior sent you? Tell them the message has been received. The preparations are underway.',
        done: "Go tell the Purple Warrior what I said. They'll be waiting for you.",
        complete:
          "The winds of change are coming... but that's a story for another day.",
      },
    },
  },

    {
    id: 'wait-a-minute',
    title: 'Morning Meditation',
    description: {
      active: "The Purple Monk is deep in meditation. He asked you to wait a minute.\n\nJust be patient. Patience is a virtue.",
      done: "The meditation is over. The air feels clearer.\n\nGo speak with the monk to receive his blessing.",
      complete: "You showed great patience. The monk has shared his wisdom and reward with you.",
      failed: "You couldn't wait. The moment of enlightenment has passed."
    },
    handler: new TalkQuestHandler({
      giverNpcId: 'purple-monk',
      targetNpcId: 'purple-monk',
    }),
    dialogs: {
      'purple-monk': {
        inactive:
          "Mmmeditating, wait a mmminute.",
        active:
          '...',
        done: "Good things come to those who wait. Here's your <i>mmmm</i>oney",
        complete:
          "<i>Monk seems to be back to meditating and humming</i>",
      },
    },
    onComplete: (retroactive) => {
      // worldState for layers is set by the event handlers themselves,
      // and restoreLayerStates applies it on map load — skip re-emitting.
      if (retroactive) return;

      EventBus.emit('quest:fade-layer', {
        mapKey: '16-json',
        layer: LAYERS.BARRIERS,
      });
    },
  },

  {
    id: 'collect-wood',
    title: 'Lumber Support',
    description: {
      active: "Life of a pawn is hard. They need some wood to build a shelter but can't leave their post.\n\nCollect 3 logs from the surrounding area.\n\nProgress: {collected} / {required}",
      done: "You have found enough wood for the shelter!\n\nDeliver the logs to the Purple Pawn so they can start building.",
      complete: "With your help, the Purple Pawn now has a sturdy shelter. They'll be safe from the elements tonight.",
      failed: "The shelter remains unbuilt. You left the pawn to fend for themselves."
    },
    handler: new CollectQuestHandler({
      giverNpcId: 'purple-pawn-idle-wood',
      itemType: 'log',
      requiredIds: ['log1', 'log2', 'log3'],
    }),
    dialogs: {
      'purple-pawn-idle-wood': {
        inactive:
          "Life of a pawn is hard... I need some wood to build a shelter but I can't leave my post. Could you collect 3 logs for me?",
        active:
          "How's the wood gathering going? You've found {collected} out of {required} logs so far.",
        done: "You found them all! Thank you so much, adventurer! Now I can build a proper shelter.",
        complete: 'This shelter will keep me warm. Thank you, friend!',
      },
    },
    formatProgress: (progress) => {
      const c = progress.collected as number;
      const r = progress.required as number;
      return `${c} / ${r}`;
    },
    onComplete: (retroactive) => {
      if (!retroactive) {
        EventBus.emit('fx:spawn', { type: 'build_smoke', x: 758, y: 110 });
        inventory.remove('log', 3);
      }
      worldState.set('pawnHouse', 'built');
      EventBus.emit('world:refresh-decorations');
    },
  },

  {
    id: 'fix-the-bridge',
    title: 'Wood you like to pass?',
    description: {
      active: "The bridge to the south is broken, blocking the path to the next region.\n\nA local pawn needs a wood log to repair it.",
      done: "You have the log! Return to the bridge and give it to the pawn to fix the crossing.",
      complete: "The bridge is repaired! The path to the south is now open for all travelers.",
      failed: "The bridge remains in ruins. You failed to provide the materials for its repair."
    },
    handler: new CollectQuestHandler({
      giverNpcId: 'purple-pawn-idle-hammer-18',
      itemType: 'log',
      requiredCount: 1,
    }),
    dialogs: {
      'purple-pawn-idle-hammer-18': {
        inactive:
          "This bridge is falling apart! I could fix it if I had some wood. Could you find me a log?",
        active:
          "Still looking for that log? There should be one somewhere around here.",
        done: "Perfect, that's exactly what I needed! Let me patch this bridge up right away.",
        complete: 'The bridge is as good as new! Safe travels, friend!',
      },
    },
    formatProgress: (progress) => {
      const c = progress.collected as number;
      const r = progress.required as number;
      return `${c} / ${r}`;
    },
    onComplete: (retroactive) => {
      worldState.set('bridge', 'built');
      if (retroactive) return;

      EventBus.emit('fx:spawn', { type: 'build_smoke', x: 720, y: 280 });
      EventBus.emit('fx:spawn', { type: 'build_smoke', x: 720, y: 340 });
      inventory.remove('log', 1);
      EventBus.emit('quest:fade-layer', {
        mapKey: '18-json',
        layer: LAYERS.BARRIERS,
      });
      EventBus.emit('quest:show-layer', {
        mapKey: '18-json',
        layer: LAYERS.PASSAGES,
      });
    },
  },

  // ---- Gather the Artifacts --------------------------------------------------
  // Add more items to `items` when a 3rd (or 4th …) artifact is placed in the
  // world.  The handler and worldState logic scale automatically.
  {
    id: 'gather-the-artifacts',
    title: 'Echoes of the Ancient',
    description: {
      active:
        "A mysterious figure asked you to find ancient artifacts scattered across the region.\\n\\nBring each one back when you find it — you don't need to collect them all at once.\\n\\nArtifacts delivered: {delivered} / {required}",
      done: // 'done' is never reached with DeliverQuestHandler (goes active→complete)
        "You have gathered all the artifacts.\\n\\nReturn to the Blue Warrior to claim your reward.",
      complete:
        "The artifacts have been returned. The ancient power stirs once more.\\n\\nThe region will never be the same.",
      failed:
        "The artifacts are lost. The ancient power fades into memory.",
    },
    handler: new DeliverQuestHandler({
      giverNpcId: 'temp',
      items: [
        {
          // artifact → reveals barracksBlue on map 28
          itemType: 'artifact',
          onDelivered: () => {
            worldState.set('barracksBlueVisible', 'true');
            EventBus.emit('world:refresh-decorations');
            EventBus.emit('npc-dialog', {
              npc: 'Blue Warrior',
              portrait: 'gameAssets/bluePawnAvatar.png',
              theme: 'blue' as const,
              text: [
                "This is one of the lost artifacts! I can already feel its power resonating.",
                "With this, our barracks can be restored. The troops will have shelter once more.",
                "Bring me the other artifact when you find it. Every piece matters.",
              ],
            });
          },
        },
        {
          // artifact2 → reveals towerBlue on map 28
          itemType: 'artifact2',
          onDelivered: () => {
            worldState.set('towerBlueVisible', 'true');
            EventBus.emit('world:refresh-decorations');
            EventBus.emit('npc-dialog', {
              npc: 'Blue Warrior',
              portrait: 'gameAssets/bluePawnAvatar.png',
              theme: 'blue' as const,
              text: [
                "The second artifact — incredible. The ancient energy is overwhelming!",
                "Our watchtower rises from the ruins. We can defend this land once more.",
                "You've done it, traveler. The region is in your debt.",
              ],
            });
          },
        },
        // ── Add a third artifact here when ready ──────────────────────────
        // {
        //   itemType: 'artifact3',
        //   onDelivered: () => {
        //     worldState.set('artifact3StructureVisible', 'true');
        //     EventBus.emit('world:refresh-decorations');
        //     EventBus.emit('npc-dialog', {
        //       npc: 'Blue Warrior',
        //       portrait: 'gameAssets/bluePawnAvatar.png',
        //       theme: 'blue' as const,
        //       text: ["..."],
        //     });
        //   },
        // },
      ],
    }),
    dialogs: {
      temp: {
        inactive: [
          "Hello there, traveler. I've been waiting for someone like you.",
          "There are ancient artifacts hidden in this region. They must not fall into the wrong hands.",
          "Find them and bring them to me — you needn't carry them all at once. I'll take each one as you find it.",
        ],
        active: [
          "You're making progress — {delivered} of {required} artifacts delivered so far.",
          "The others are still out there. Seek them in the wetlands to the north.",
        ],
        complete: [
          "You've done it. All the artifacts are safe.",
          "The ancient power is restored. This region owes you a great debt, traveler.",
        ],
      },
    },
    formatProgress: (progress) => {
      const deliveredIds = (progress.deliveredIds as string[]) || [];
      const requiredItems = [
        { id: 'artifact', label: 'Ancient Relic' },
        { id: 'artifact2', label: 'Mysterious Totem' },
      ];

      return requiredItems.map((item) => ({
        label: item.label,
        isDelivered: deliveredIds.includes(item.id),
        isFound: deliveredIds.includes(item.id) || inventory.get(item.id) > 0,
      }));
    },
    onComplete: (retroactive) => {
      // Ensure both structures are visible on retroactive restore (save/load)
      worldState.set('barracksBlueVisible', 'true');
      worldState.set('towerBlueVisible', 'true');
      EventBus.emit('world:refresh-decorations');
      if (retroactive) return;

      // One-time visual celebration on first completion
      EventBus.emit('fx:spawn', { type: 'heal', x: 400, y: 300 });
    },
  },
];
