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
  if (!isOpen) return null;

  const selectedQuest = quests.find((q) => q.questId === selectedQuestId);

  return (
    <div className={styles.questLogOverlay} onClick={onClose}>
      <div className={styles.questLogBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.questLogHeader}>
          <h2>Quest Log</h2>
          <button className={styles.questLogClose} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.questLogContent}>
          <div className={styles.questList}>
            {quests.map((q) => (
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
            ))}
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
                Select a quest to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
