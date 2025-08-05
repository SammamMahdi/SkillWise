import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

const AccentColorPicker = ({ currentColor, onColorChange }) => {
  const [selectedColor, setSelectedColor] = useState(currentColor || '#7C3AED');

  // Predefined color options
  const colorOptions = [
    '#7C3AED', // Purple (default)
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
  ];

  useEffect(() => {
    setSelectedColor(currentColor || '#7C3AED');
  }, [currentColor]);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    onColorChange(color);
    
    // Update CSS variable immediately
    updateAccentColor(color);
  };

  const updateAccentColor = (hexColor) => {
    // Convert hex to HSL for CSS variable
    const hsl = hexToHSL(hexColor);
    document.documentElement.style.setProperty('--primary', hsl);
  };

  // Convert hex to HSL
  const hexToHSL = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Accent Color</h3>
      </div>
      
      <div className="space-y-3">
        {/* Custom color picker */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-foreground">Custom Color:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer"
          />
          <span className="text-sm text-muted-foreground font-mono">{selectedColor}</span>
        </div>
        
        {/* Predefined colors */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Quick Colors:</label>
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                  selectedColor === color 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
        
        {/* Preview */}
        <div className="mt-4 p-4 rounded-lg bg-card border border-border">
          <h4 className="text-sm font-medium text-foreground mb-2">Preview:</h4>
          <div className="space-y-2">
            <button className="cosmic-button">
              Button with Accent Color
            </button>
            <div className="text-glow text-lg font-semibold">
              Text with Glow Effect
            </div>
            <div className="neon-glow text-lg font-semibold">
              Neon Glow Text
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccentColorPicker; 