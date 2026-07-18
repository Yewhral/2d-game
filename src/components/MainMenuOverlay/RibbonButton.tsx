import type { CSSProperties, ReactNode } from "react";
import styles from "./RibbonButton.module.css";

export type RibbonColor = "purple" | "teal" | "red" | "yellow" | 'slate';

const getAssetPath = (path: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

const RIBBON_ASSETS: Record<RibbonColor, { left: string; middle: string; right: string }> = {
  purple: {
    left: "/UI/ribbon_08_purple_rounded_left.png",
    middle: "/UI/ribbon_08_purple_rounded_middle.png",
    right: "/UI/ribbon_08_purple_rounded_right.png",
  },
  teal: {
    left: "/UI/ribbon_02_teal_rounded_left.png",
    middle: "/UI/ribbon_02_teal_rounded_middle.png",
    right: "/UI/ribbon_02_teal_rounded_right.png",
  },
  red: {
    left: "/UI/ribbon_04_red_rounded_left.png",
    middle: "/UI/ribbon_04_red_rounded_middle.png",
    right: "/UI/ribbon_04_red_rounded_right.png",
  },
  yellow: {
    left: "/UI/ribbon_06_yellow_rounded_left.png",
    middle: "/UI/ribbon_06_yellow_rounded_middle.png",
    right: "/UI/ribbon_06_yellow_rounded_right.png",
  },
  slate: {
    left: "/UI/ribbon_10_slate_rounded_left.png",
    middle: "/UI/ribbon_10_slate_rounded_middle.png",
    right: "/UI/ribbon_10_slate_rounded_right.png",
  },
};

type RibbonStyle = CSSProperties & {
  "--ribbon-left": string;
  "--ribbon-middle": string;
  "--ribbon-right": string;
};

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
  const assets = RIBBON_ASSETS[color];
  const ribbonStyle: RibbonStyle = {
    "--ribbon-left": `url("${getAssetPath(assets.left)}")`,
    "--ribbon-middle": `url("${getAssetPath(assets.middle)}")`,
    "--ribbon-right": `url("${getAssetPath(assets.right)}")`,
  };

  return (
    <button
      type={type}
      className={[
        styles.ribbonWrapper,
        styles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={ribbonStyle}
      onClick={onClick}
      onMouseLeave={onMouseLeave}
    >
      <span className={styles.ribbonBtn}>
        {children}
      </span>
    </button>
  );
};
