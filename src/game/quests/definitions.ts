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
        done: 'You found the stranger? Excellent work! Thank you, traveler.',
        complete:
          "Thanks again for your help, traveler. You're a true hero!",
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
  },

  {
    id: 'collect-chests',
    title: 'Supply Run',
    description: 'Collect 2 healing chests for the Purple Warrior.',
    handler: new CollectQuestHandler({
      giverNpcId: 'purple-warrior',
      itemType: 'chest',
      requiredCount: 2,
    }),
    dialogs: {
      'purple-warrior': {
        inactive:
          "I'm running low on supplies. There are some healing chests scattered around. Could you bring me 2 of them?",
        active:
          "How's the search going? You've found {collected} out of {required} chests so far.",
        done: "You've gathered all the supplies I need! Well done, adventurer!",
        complete: 'Those supplies will last me a long time. Thank you!',
      },
    },
    formatProgress: (progress) => {
      const c = progress.collected as number;
      const r = progress.required as number;
      return `${c} / ${r}`;
    },
  },
];
