import React from 'react';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2.js';
import { useProjectTemporal } from '../state/projectStore';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const UndoButton: React.FC<Props> = ({
  className,
  title,
  onClick,
  ...rest
}) => {
  let temporal;
  let canUndo = false;
  
  try {
    temporal = useProjectTemporal();
    canUndo = (temporal?.pastStates?.length ?? 0) > 0;
  } catch (error) {
    console.warn('Failed to access temporal state in UndoButton:', error);
    temporal = { undo: () => {}, pastStates: [] };
  }

  return (
    <button
      type="button"
      onClick={onClick ?? temporal?.undo ?? (() => {})}
      disabled={!canUndo}
      className={className}
      title={title ?? 'Undo (Ctrl/Cmd+Z)'}
      {...rest}
    >
      <Undo2 className="w-4 h-4" />
    </button>
  );
};
