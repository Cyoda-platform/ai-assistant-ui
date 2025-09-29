import React from 'react';
import { GripVertical } from 'lucide-react';
import styles from './ResizeHandle.module.scss';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
  position: 'left' | 'right';
  className?: string;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  isResizing,
  position,
  className = ''
}) => {
  const handleClasses = [
    styles.resizeHandle,
    styles[position],
    isResizing ? styles.resizing : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={handleClasses}
      onMouseDown={onMouseDown}
    >
      {/* Visual indicator */}
      <div className={styles.indicator}>
        <GripVertical
          size={12}
          className={styles.icon}
        />
      </div>

      {/* Invisible wider hit area for easier grabbing */}
      <div className={styles.hitArea} />
    </div>
  );
};

export default ResizeHandle;
