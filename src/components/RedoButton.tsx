import React from 'react';
import Redo2 from 'lucide-react/dist/esm/icons/redo-2.js';
import { useProjectTemporal } from '@/state/projectStore';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
}

export const RedoButton: React.FC<Props> = ({ className, title, ...rest }) => {
  const { redo, futureStates } = useProjectTemporal();
  const canRedo = (futureStates?.length ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={() => redo()}
      disabled={!canRedo}
      className={className}
      title={title ?? 'Redo (Ctrl/Cmd+Shift+Z)'}
      {...rest}
    >
      <Redo2 className="w-4 h-4" />
    </button>
  );
};
