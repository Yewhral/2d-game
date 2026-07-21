import { useState, useEffect } from 'react';
import styles from './IntroModal.module.css';

interface IntroModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IntroModal = ({ isOpen, onClose }: IntroModalProps) => {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    if (!isOpen) return null;

    return (
        <div
          className={styles.introModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-modal-title"
        >
          <div className={styles.introModalBox}>
            <div className={styles.introModalHeader}>
              <h2 id="intro-modal-title">Intro</h2>
              <button
                className={styles.introModalClose}
                onClick={onClose}
                aria-label="Close Intro"
              >
                ×
              </button>
            </div>
            <div className={styles.introModalContent}>
              <div className={styles.introModalStory}>
                <div className={styles.dialogPortrait}>
                  <img src="gameAssets/duck.png" alt={"The Mighty Duck"} className={styles.portraitImg} />
                </div>
                <div className={styles.introModalStoryContent}>
                  <div>
                  For the past days, you've been dreaming of a magic duck, calling you to arrive to this land. 
                  </div>
                  <div>
                  Determined to stop the recurring dreams, you've decided to see what's this about.
                  </div>
                  <div>
                  Step forth, stranger. The gears of fate have begun to turn, and the future of this world rests in your hands.
                  </div>
                </div>
              </div>
              <div className={styles.introModalControls}>
                <div>{isTouch ? "Use joycon to walk, interact with button on the right" : "W/A/S/D or ←/↑/→/↓ to walk, E to interact"}</div>
              </div>
              <div className={styles.introModalActions}>
                <button className={styles.btn} onClick={onClose}>Start Adventure!</button>
              </div>
            </div>
          </div>
        </div>
    );
}
