import type { ReactNode } from "react";
import styles from "./RibbonButton.module.css";

export type RibbonColor = "purple" | "teal" | "red" | "yellow" | 'slate';

interface RibbonButtonProps {
  children: ReactNode;
  color?: RibbonColor;
  className?: string;
  onClick?: () => void;
  onMouseLeave?: () => void;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "lg";
}

export const RibbonButton = ({
  children,
  color = "purple",
  className,
  onClick,
  onMouseLeave,
  type = "button",
  size = "lg"
}: RibbonButtonProps) => {
  return (
    <button
      type={type}
      className={[
        styles.ribbonWrapper,
        styles[color],
        styles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      onMouseLeave={onMouseLeave}
    >
      <span className={styles.ribbonBtn}>
        {children}
      </span>
    </button>
  );
};
