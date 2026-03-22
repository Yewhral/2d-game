/**
 * Quest definitions — every quest in the game is instantiated here.
 *
 * To add a new quest:
 *   1. Pick the right handler (TalkQuestHandler, CollectQuestHandler, …).
 *   2. Add a new instance to the array below.
 *   3. That's it — the manager and UI pick it up automatically.
 */

import type { QuestHandler } from './types';
import { TalkQuestHandler } from './TalkQuestHandler';
import { CollectQuestHandler } from './CollectQuestHandler';

export const QUEST_DEFINITIONS: QuestHandler[] = [
  new TalkQuestHandler({
    id: 'talk-to-stranger',
    title: 'The Stranger in the Fields',
    description:
      'Find and talk to the mysterious stranger in the eastern fields.',
    giverNpcId: 'purple-warrior',
    targetNpcId: 'purple-warrior2',
    dialogs: {
      giver: {
        inactive:
          "Hey traveler! I've heard rumors of a mysterious stranger in the eastern fields. Could you go find them and see what they want?",
        active:
          'Have you found the stranger yet? Head east through the fields to find them.',
        done: 'You found the stranger? Excellent work! Thank you, traveler.',
        complete:
          "Thanks again for your help, traveler. You're a true hero!",
      },
      target: {
        inactive: "... Who are you? I don't know what you want.",
        active:
          'Ah, so the Purple Warrior sent you? Tell them the message has been received. The preparations are underway.',
        done: "Go tell the Purple Warrior what I said. They'll be waiting for you.",
        complete:
          "The winds of change are coming... but that's a story for another day.",
      },
    },
  }),

  new CollectQuestHandler({
    id: 'collect-chests',
    title: 'Supply Run',
    description: 'Collect 2 healing chests for the Purple Warrior.',
    giverNpcId: 'purple-warrior',
    itemType: 'chest',
    requiredCount: 2,
    dialogs: {
      giver: {
        inactive:
          "I'm running low on supplies. There are some healing chests scattered around. Could you bring me 2 of them?",
        active:
          "How's the search going? You've found {collected} out of {required} chests so far.",
        done: "You've gathered all the supplies I need! Well done, adventurer!",
        complete:
          'Those supplies will last me a long time. Thank you!',
      },
    },
  }),
];
