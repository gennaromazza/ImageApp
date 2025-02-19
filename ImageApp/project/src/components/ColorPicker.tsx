import React from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const predefinedColors = [
  '#EF4444', // Red
  '#F97316', // Orange  
  '#F59E0B', // Amber
  '#10B981', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-64">
      <div className="grid grid-cols-5 gap-2 mb-4">
        {predefinedColors.map((presetColor) => (
          <button
            key={presetColor}
            onClick={() => onChange(presetColor)}
            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
              color === presetColor ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
            }`}
            style={{ backgroundColor: presetColor }}
            title={presetColor}
          />
        ))}
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Custom Color</label>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ColorPicker;