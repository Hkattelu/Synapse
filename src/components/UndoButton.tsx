import React from 'react';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2.js';
import { useProjectTemporal } from '@/state/projectStore';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
}

export const UndoButton: React.FC<Props> = ({ className, title, ...rest }) => {
  const { undo, pastStates } = useProjectTemporal();
  const canUndo = (pastStates?.length ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={() => undo()}
      disabled={!canUndo}
      className={className}
      title={title ?? 'Undo (Ctrl/Cmd+Z)'}
      {...rest}
    >
      <Undo2 className="w-4 h-4" />
    </button>
  );
};
