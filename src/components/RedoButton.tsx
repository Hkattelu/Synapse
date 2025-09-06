import React from 'react';
import { Redo2 } from 'lucide-react';
import { useProjectTemporal } from '../state/projectStore';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const RedoButton: React.FC<Props> = ({
  className,
  title,
  onClick,
  ...rest
}) => {
  let temporal;
  let canRedo = false;
  
  try {
    temporal = useProjectTemporal();
    canRedo = (temporal?.futureStates?.length ?? 0) > 0;
  } catch (error) {
    console.warn('Failed to access temporal state in RedoButton:', error);
    temporal = { redo: () => {}, futureStates: [] };
  }

  return (
    <button
      type="button"
      onClick={onClick ?? temporal?.redo ?? (() => {})}
      disabled={!canRedo}
      className={className}
      title={title ?? 'Redo (Ctrl/Cmd+Shift+Z)'}
      {...rest}
    >
      <Redo2 className="w-4 h-4" />
    </button>
  );
};
