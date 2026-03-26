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
import { EventBus } from '../EventBus';
import { LAYERS } from '../constants';

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'talk-to-stranger',
    title: 'The Stranger in the Fields',
    description:
      'Find and talk to the mysterious stranger in the eastern fields.',
    handler: new TalkQuestHandler({
      giverNpcId: 'purple-warrior',
      targetNpcId: 'purple-warrior2',
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
      'purple-warrior2': {
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
    description:
      'Wait for the monk to finish meditating.',
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
    onComplete: () => {
      EventBus.emit('quest:remove-tiles', {
        mapKey: '16-json',
        layer: LAYERS.BARRIERS,
        tileIds: [1038, 1039, 1038, 1039, 1038, 1039,
1026, 1027, 1026, 1027, 1026, 1027,
1014, 1015, 1014, 1015, 1014, 1015],
      });
    },
  },

  {
    id: 'collect-wood',
    title: 'Lumber Support',
    description: 'Collect 3 wood logs for the Purple Pawn.',
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
  },
];
