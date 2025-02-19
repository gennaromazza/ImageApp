import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BreakTime } from '../../types/settings';

interface BreakTimesProps {
  breakTimes: BreakTime[];
  newBreakTime: BreakTime;
  onBreakTimeChange: (index: number, field: keyof BreakTime, value: string | boolean) => void;
  onNewBreakTimeChange: (breakTime: BreakTime) => void;
  onAddBreakTime: () => void;
  onRemoveBreakTime: (index: number) => void;
}

const BreakTimes: React.FC<BreakTimesProps> = ({
  breakTimes,
  newBreakTime,
  onBreakTimeChange,
  onNewBreakTimeChange,
  onAddBreakTime,
  onRemoveBreakTime
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">Pause e Intervalli</h4>
      
      <div className="space-y-4">
        {breakTimes.map((breakTime, index) => (
          <div key={index} className="flex items-center gap-4 bg-gray-700 p-4 rounded">
            <input
              type="time"
              value={breakTime.start}
              onChange={(e) => onBreakTimeChange(index, 'start', e.target.value)}
              className="p-2 bg-gray-600 border border-gray-500 rounded text-white"
            />
            <span className="text-white">a</span>
            <input
              type="time"
              value={breakTime.end}
              onChange={(e) => onBreakTimeChange(index, 'end', e.target.value)}
              className="p-2 bg-gray-600 border border-gray-500 rounded text-white"
            />
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={breakTime.enabled}
                onChange={(e) => onBreakTimeChange(index, 'enabled', e.target.checked)}
                className="w-4 h-4"
              />
              Attivo
            </label>
            <button
              type="button"
              onClick={() => onRemoveBreakTime(index)}
              className="p-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <input
          type="time"
          value={newBreakTime.start}
          onChange={(e) => onNewBreakTimeChange({ ...newBreakTime, start: e.target.value })}
          className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
          placeholder="Inizio pausa"
        />
        <input
          type="time"
          value={newBreakTime.end}
          onChange={(e) => onNewBreakTimeChange({ ...newBreakTime, end: e.target.value })}
          className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
          placeholder="Fine pausa"
        />
        <button
          type="button"
          onClick={onAddBreakTime}
          disabled={!newBreakTime.start || !newBreakTime.end}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Aggiungi Pausa
        </button>
      </div>
    </div>
  );
};

export default BreakTimes;