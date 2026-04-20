import { useEffect } from "react";
import styles from "./CreditsModal.module.css";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Credits</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.content}>
          <div className={styles.textSection}>
            <h3>Game Development</h3>
            <p className={styles.paragraph}>
              Developed as a demonstration of a React + Phaser 2D world with quest systems, 
              inventory management, and map transitions.
            </p>
          </div>
          <div className={styles.textSection}>
            <h3>Assets</h3>
            <p className={styles.paragraph}>
              Environment and Sprites: <a href="https://pixelfrog-assets.itch.io/tiny-swords" target="_blank" rel="noopener noreferrer">Tiny Swords by Pixel Frog</a>
            </p>
            <p className={styles.paragraph}>
              Player Sprite: <a href="https://axulart.itch.io/small-8-direction-characters" target="_blank" rel="noopener noreferrer">Small 8-direction characters by AxulArt</a>
            </p>
          </div>
          <div className={styles.textSection}>
            <h3>Technology</h3>
            <p className={styles.paragraph}>
              Built with Vite, TypeScript, Phaser 3, and React. 
              UI styling powered by Vanilla CSS Modules.
            </p>
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerText}>2026 Usługi Programistyczne - Interfejs (If.Js)</span>
        </div>
      </div>
    </div>
  );
}
