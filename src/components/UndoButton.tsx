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
  const { undo, pastStates } = useProjectTemporal();
  const canUndo = (pastStates?.length ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={onClick ?? undo}
      disabled={!canUndo}
      className={className}
      title={title ?? 'Undo (Ctrl/Cmd+Z)'}
      {...rest}
    >
      <Undo2 className="w-4 h-4" />
    </button>
  );
};
