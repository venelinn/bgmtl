import { Icon } from "@/components/Icon";
import styles from "./Dropdown.module.scss";

type Prediction = {
  description: string;
  place_id: string;
};

type DropdownProps = {
  predictions: Prediction[];
  selectedIndex: number;
  onSelectPrediction: (prediction: Prediction) => void;
  onMouseEnter: (index: number) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isRecent?: boolean;
};

export const Dropdown = ({
  predictions,
  selectedIndex,
  onSelectPrediction,
  onMouseEnter,
  dropdownRef,
  isRecent = false,
}: DropdownProps) => {
  return (
    <div ref={dropdownRef} className={styles.dropdown}>
      {predictions.map((prediction, index) => (
        <button
          key={prediction.place_id}
          type="button"
          className={`${styles.dropdownItem} ${index === selectedIndex ? styles.dropdownItemActive : ""}`}
          onClick={() => onSelectPrediction(prediction)}
          onMouseEnter={() => onMouseEnter(index)}
        >
          <Icon name={isRecent ? "Clock" : "MapPin"} size="1em" className={styles.dropdownIcon} />
          <span>{prediction.description}</span>
        </button>
      ))}
    </div>
  );
};
