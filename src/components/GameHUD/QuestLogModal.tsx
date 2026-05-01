import { useState, useEffect, useRef } from "react";
import styles from "./QuestLogModal.module.css";

export interface Quest {
  questId: string;
  title: string;
  status: string;
  description?: string;
  progress?: any;
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
  const [filter, setFilter] = useState<'active' | 'completed' | 'failed' | 'all'>('active');
  const modalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedQuestId, filteredQuests, onClose, onSelectQuest]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstBtn = modalRef.current.querySelector('button');
      firstBtn?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedQuest = filteredQuests.find((q) => q.questId === selectedQuestId);

  return (
    <div 
      className={styles.questLogOverlay} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-log-title"
    >
      <div 
        ref={modalRef}
        className={styles.questLogBox} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.questLogHeader}>
          <h2 id="quest-log-title">Quest Log</h2>
          <button 
            className={styles.questLogClose} 
            onClick={onClose}
            aria-label="Close Quest Log"
          >
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
          <div className={styles.questList} role="listbox" aria-label="Quest List">
            {filteredQuests.length > 0 ? (
              filteredQuests.map((q) => (
                <button
                  key={q.questId}
                  className={`${styles.questItem} ${
                    selectedQuestId === q.questId ? styles.questItemActive : ""
                  }`}
                  onClick={() => onSelectQuest(q.questId)}
                  role="option"
                  aria-selected={selectedQuestId === q.questId}
                >
                  <span
                    aria-hidden="true"
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
                </button>
              ))
            ) : (
              <div className={styles.emptyFilter} role="status">
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
                    {typeof selectedQuest.progress === 'string' ? (
                      <div>Progress: {selectedQuest.progress}</div>
                    ) : Array.isArray(selectedQuest.progress) ? (
                      <div className={styles.progressList}>
                        <div className={styles.progressListHeader}>Objectives:</div>
                        {selectedQuest.progress.map((item: any, i: number) => (
                          <div key={i} className={styles.progressListItem}>
                            <span className={`${styles.progressIcon} ${item.isDelivered ? styles.iconComplete : item.isFound ? styles.iconFound : ''}`}>
                              {item.isDelivered ? '✦' : item.isFound ? '◆' : '○'}
                            </span>
                            <span className={item.isDelivered ? styles.textComplete : ''}>
                              {item.label} 
                              {item.isDelivered ? ' (Gave back)' : item.isFound ? ' (Found)' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
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
