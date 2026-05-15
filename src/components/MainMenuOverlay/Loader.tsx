import { useGameEvent } from "@/hooks/useGameEvent";
import styles from "./Loader.module.css";
import { useCallback, useState } from "react";

export const Loader = ({ color = "purple" }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
  
    useGameEvent(
      "loading-progress",
      useCallback(({ progress }) => setLoadingProgress(progress), []),
    );

  const bladeReveal = Math.max(0, Math.min(100, loadingProgress * 100));
  
  return (
    <div className={styles.loaderArea}>
      <div className={`${styles.loader} ${styles[`sword_${color}`]}`}>
        <div className={styles.handle} />
        <div 
          className={styles.blade}
          style={{ clipPath: `inset(0 ${100 - bladeReveal}% 0 0)` }}
        >
          <div className={styles.middle} />
          <div className={styles.tip} />
        </div>
      </div>
      <div className={styles.loaderPercent}>
        {Math.round(loadingProgress * 100)}%
      </div>
    </div>
  );
};