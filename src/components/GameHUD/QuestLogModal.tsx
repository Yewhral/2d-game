import { useState } from "react";
import styles from "./QuestLogModal.module.css";

export interface Quest {
  questId: string;
  title: string;
  status: string;
  description?: string;
  progress?: string;
}

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  selectedQuestId: string | null;
  onSelectQuest: (id: string) => void;
}

export function QuestLogModal({
  isOpen,
  onClose,
  quests,
  selectedQuestId,
  onSelectQuest,
}: QuestLogModalProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  if (!isOpen) return null;

  const filteredQuests = quests.filter((q) => {
    if (filter === 'all') return true;
    if (filter === 'active') return q.status === 'active' || q.status === 'done';
    if (filter === 'completed') return q.status === 'complete';
    if (filter === 'failed') return q.status === 'failed';
    return true;
  });

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    const newFiltered = quests.filter((q) => {
      if (newFilter === 'all') return true;
      if (newFilter === 'active') return q.status === 'active' || q.status === 'done';
      if (newFilter === 'completed') return q.status === 'complete';
      if (newFilter === 'failed') return q.status === 'failed';
      return true;
    });
    if (newFiltered.length > 0) {
      onSelectQuest(newFiltered[newFiltered.length - 1].questId);
    }
  };

  const selectedQuest = filteredQuests.find((q) => q.questId === selectedQuestId);

  return (
    <div className={styles.questLogOverlay} onClick={onClose}>
      <div className={styles.questLogBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.questLogHeader}>
          <h2>Quest Log</h2>
          <button className={styles.questLogClose} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.filterBar}>
          {(['active', 'completed', 'failed', 'all'] as const).map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
              onClick={() => handleFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className={styles.questLogContent}>
          <div className={styles.questList}>
            {filteredQuests.length > 0 ? (
              filteredQuests.map((q) => (
                <div
                  key={q.questId}
                  className={`${styles.questItem} ${
                    selectedQuestId === q.questId ? styles.questItemActive : ""
                  }`}
                  onClick={() => onSelectQuest(q.questId)}
                >
                  <span
                    className={`${styles.questStatus} ${
                      q.status === "done" || q.status === "complete"
                        ? styles.questStatusDone
                        : q.status === "failed"
                        ? styles.questStatusFailed
                        : ""
                    }`}
                  >
                    {q.status === "complete" ? "✦" : q.status === "done" ? "◆" : q.status === "failed" ? "✘" : "○"}
                  </span>
                  <div className={styles.questItemInfo}>
                    <span className={styles.questItemTitle}>{q.title}</span>
                    <span className={styles.questItemStatusText}>{q.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyFilter}>
                {filter === 'all' ? 'No quests' : `No ${filter} quests`}
              </div>
            )}
          </div>
          <div className={styles.questDetails}>
            {selectedQuest ? (
              <>
                <h3>{selectedQuest.title}</h3>
                <p className={styles.questDescription}>{selectedQuest.description}</p>
                {selectedQuest.progress && (
                  <div className={styles.questProgressDetail}>
                    Progress: {selectedQuest.progress}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noQuestSelected}>
                {filteredQuests.length === 0
                  ? (filter === 'all' ? 'No quests found' : `No ${filter} quests found`)
                  : "Select a quest to see details"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
