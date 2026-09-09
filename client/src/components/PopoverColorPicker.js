import React, { useState, useRef, useEffect } from 'react';
import { SketchPicker } from 'react-color';

const PRESET_COLORS = [
  // 20 Recommended Portfolio Tech Colors
  '#0ea5e9', '#6366f1', '#f97316', '#ef4444', '#8b5cf6', 
  '#ec4899', '#10b981', '#3776ab', '#f7df1e', '#007acc',
  '#61dafb', '#47a248', '#e34f26', '#1572b6', '#336791',
  '#cc3534', '#000000', '#ffffff', '#64748b', '#94a3b8',
  // Common translucent values for glows
  'rgba(99,102,241,0.4)', 'rgba(249,115,22,0.35)', 'rgba(16,185,129,0.35)', 'rgba(255,255,255,0.2)'
];

const PopoverColorPicker = ({ color, onChange, placeholder, style, inputStyle, customSwatchStyle, customColorStyle }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const popoverRef = useRef();

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (newColor) => {
    // If it has alpha, format as rgba, else format as hex
    if (newColor.rgb.a !== 1) {
      // Small optimization: If it's pure black with alpha, some hex representations might be better, but rgba is universally supported for CSS gradients and shadows.
      onChange(`rgba(${newColor.rgb.r}, ${newColor.rgb.g}, ${newColor.rgb.b}, ${newColor.rgb.a})`);
    } else {
      onChange(newColor.hex);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        handleClose();
      }
    };
    if (displayColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [displayColorPicker]);

  const swatchStyle = {
    padding: '5px',
    background: '#111',
    borderRadius: '4px',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
    display: 'inline-block',
    cursor: 'pointer',
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1
  };

  const colorStyle = {
    width: '28px',
    height: '14px',
    borderRadius: '2px',
    background: color || 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    ...customColorStyle
  };

  const popover = {
    position: 'absolute',
    zIndex: '10',
    right: '0',
    top: '100%',
    marginTop: '5px'
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', ...style }}>
      <input 
        value={color || ''} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        style={{ width: '100%', paddingRight: '50px', ...inputStyle }}
      />
      <div style={customSwatchStyle || swatchStyle} onClick={handleClick}>
        <div style={colorStyle} />
      </div>
      {displayColorPicker && (
        <div style={popover} ref={popoverRef}>
          <SketchPicker 
            color={color || '#ffffff'} 
            onChange={handleChange} 
            presetColors={PRESET_COLORS}
          />
        </div>
      )}
    </div>
  );
};

export default PopoverColorPicker;
