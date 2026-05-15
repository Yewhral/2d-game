import { useState } from "react";
import { RibbonButton } from "./RibbonButton";
import { CreditsModal } from "./CreditsModal";

export const CreditsButton = () => {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  return (
    <>
      <RibbonButton color="slate" onClick={() => setIsCreditsOpen(true)} size="sm">
        Credits
      </RibbonButton>
      <CreditsModal
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
      />
    </>
  );
};