import React, { useState, useEffect } from 'react';

const ToothComponent = ({ toothNumber, teethData, selections, onSelection, isUpperJaw, isDragMode, positions, onPositionChange, transforms, onTransformChange, missingState, onMissingChange }) => {
  const [hoveredPart, setHoveredPart] = useState(null);
  const [crownSvg, setCrownSvg] = useState('');
  const [rootSvg, setRootSvg] = useState('');
  const [dragState, setDragState] = useState({ isDragging: false, part: null, startPos: null });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const toothData = teethData[toothNumber];

  // All hooks must be at the top level
  const handleMouseMove = React.useCallback((e) => {
    if (!dragState.isDragging || !isDragMode) return;
    
    const deltaX = e.clientX - dragState.startPos.x;
    const deltaY = e.clientY - dragState.startPos.y;
    
    const currentPos = positions[toothNumber]?.[dragState.part] || { x: 0, y: 0 };
    const newPosition = {
      x: currentPos.x + deltaX,
      y: currentPos.y + deltaY
    };
    
    onPositionChange(toothNumber, dragState.part, newPosition);
    
    setDragState(prev => ({
      ...prev,
      startPos: { x: e.clientX, y: e.clientY }
    }));
  }, [dragState.isDragging, dragState.startPos, dragState.part, isDragMode, positions, toothNumber, onPositionChange]);

  const handleMouseUp = React.useCallback(() => {
    setDragState({ isDragging: false, part: null, startPos: null });
  }, []);
  
  useEffect(() => {
    if (toothData) {
      // Load SVG content
      if (toothData.crown) {
        fetch(`http://localhost:5000${toothData.crown}`)
          .then(response => response.text())
          .then(svg => setCrownSvg(svg))
          .catch(err => console.error('Error loading crown SVG:', err));
      }
      
      if (toothData.root) {
        fetch(`http://localhost:5000${toothData.root}`)
          .then(response => response.text())
          .then(svg => setRootSvg(svg))
          .catch(err => console.error('Error loading root SVG:', err));
      }
    }
  }, [toothData]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(`.tooth-dropdown-${toothNumber}`)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, toothNumber]);
  
  if (!toothData) {
    return (
      <div className="tooth-container">
        <div className="not-available">
          <span>N/A</span>
        </div>
        <div className="tooth-info">
          <span className="tooth-number">{toothNumber}</span>
        </div>
      </div>
    );
  }

  const handlePartClick = (e, part) => {
    if (isDragMode) {
      // In drag mode, use keyboard modifiers for different actions
      if (e.shiftKey) {
        // Shift + click = grow
        e.preventDefault();
        handleResize(part, 0.1);
        return;
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + click = shrink
        e.preventDefault();
        handleResize(part, -0.1);
        return;
      } else if (e.altKey) {
        // Alt + click = change shape
        e.preventDefault();
        const currentTransform = transforms?.[toothNumber]?.[part] || { scale: 1, rotation: 0, shape: 'default' };
        const shapes = part === 'crown' 
          ? ['default', 'round', 'square', 'pointed']
          : ['default', 'thin', 'thick', 'curved'];
        const currentIndex = shapes.indexOf(currentTransform.shape);
        const nextIndex = (currentIndex + 1) % shapes.length;
        const nextShape = shapes[nextIndex];
        handleShapeChange(part, nextShape);
        return;
      }
      return; // Don't select when in drag mode
    }
    
    const isCurrentlySelected = selections[part] || false;
    onSelection(toothNumber, part, !isCurrentlySelected);
  };

  const handleMouseDown = (e, part) => {
    if (!isDragMode) return;
    
    e.preventDefault();
    setDragState({
      isDragging: true,
      part,
      startPos: { x: e.clientX, y: e.clientY }
    });
  };

  const handleWheel = (e, part) => {
    if (!isDragMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Mouse wheel on', part, 'deltaY:', e.deltaY); // Debug log
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1; // Scroll down = shrink, scroll up = grow
    handleResize(part, delta);
  };

  const handleRightClick = (e, part) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDragMode) {
      // In drag mode, cycle through shapes as before
      console.log('Right click on', part, 'for tooth', toothNumber); // Debug log
      
      const currentTransform = transforms?.[toothNumber]?.[part] || { scale: 1, rotation: 0, shape: 'default' };
      
      // Cycle through shapes
      const shapes = part === 'crown' 
        ? ['default', 'round', 'square', 'pointed']
        : ['default', 'thin', 'thick', 'curved'];
      
      const currentIndex = shapes.indexOf(currentTransform.shape || 'default');
      const nextIndex = (currentIndex + 1) % shapes.length;
      const nextShape = shapes[nextIndex];
      
      console.log('Changing shape from', currentTransform.shape || 'default', 'to', nextShape); // Debug log
      
      handleShapeChange(part, nextShape);
    }
    // Removed right-click missing/restore functionality in select mode
  };

  const handleResize = (part, delta) => {
    const currentTransform = transforms?.[toothNumber]?.[part] || { scale: 1, rotation: 0, shape: 'default' };
    const newScale = Math.max(0.5, Math.min(2, currentTransform.scale + delta));
    
    console.log('Resizing', part, 'from', currentTransform.scale, 'to', newScale); // Debug log
    
    if (onTransformChange) {
      onTransformChange(toothNumber, part, {
        ...currentTransform,
        scale: newScale
      });
    }
  };

  const handleRotate = (part, delta) => {
    const currentTransform = transforms?.[toothNumber]?.[part] || { scale: 1, rotation: 0, shape: 'default' };
    const newRotation = (currentTransform.rotation + delta) % 360;
    
    if (onTransformChange) {
      onTransformChange(toothNumber, part, {
        ...currentTransform,
        rotation: newRotation
      });
    }
  };

  const handleShapeChange = (part, shape) => {
    const currentTransform = transforms?.[toothNumber]?.[part] || { scale: 1, rotation: 0, shape: 'default' };
    
    console.log('Shape change for', part, 'to', shape); // Debug log
    
    if (onTransformChange) {
      onTransformChange(toothNumber, part, {
        ...currentTransform,
        shape: shape
      });
      console.log('Transform change called'); // Debug log
    } else {
      console.log('onTransformChange is not available'); // Debug log
    }
  };

  const getTransformStyle = (part) => {
    const position = positions?.[toothNumber]?.[part];
    const transform = transforms?.[toothNumber]?.[part];
    
    let transformString = '';
    
    if (position) {
      transformString += `translate(${position.x}px, ${position.y}px) `;
    }
    
    if (transform) {
      if (transform.scale && transform.scale !== 1) {
        transformString += `scale(${transform.scale}) `;
      }
      if (transform.rotation && transform.rotation !== 0) {
        transformString += `rotate(${transform.rotation}deg) `;
      }
    }
    
    return transformString || 'none';
  };

  const getPartClasses = (part) => {
    const isSelected = selections[part] || false;
    
    let classes = "tooth-part ";
    
    if (isSelected) {
      classes += part === 'crown' ? 'selected-crown ' : 'selected-root ';
    }
    
    return classes;
  };

  const getCurrentShape = (part) => {
    const transform = transforms?.[toothNumber]?.[part];
    return transform?.shape || 'default';
  };

  const getTooltipText = (part) => {
    const isSelected = selections[part] || false;
    const currentShape = getCurrentShape(part);
    const shapeText = currentShape !== 'default' ? ` [Shape: ${currentShape}]` : '';
    
    return `Tooth ${toothNumber} ${part.charAt(0).toUpperCase() + part.slice(1)} ${isSelected ? '(Selected)' : ''}${shapeText} ${isDragMode ? '(Mouse Wheel: Resize, Right Click: Change Shape)' : '(Use dropdown ⋯ for Missing Options)'}`;
  };

  const modifySvgForSelection = (svgContent, part) => {
    if (!svgContent) return '';
    
    const isSelected = selections[part] || false;
    const isHovered = hoveredPart === part;
    const transform = transforms?.[toothNumber]?.[part];
    
    let modifiedSvg = svgContent;
    

    
    // Remove all existing fill attributes and replace with white
    // Handle fill="none" specifically first
    modifiedSvg = modifiedSvg.replace(/fill="none"/g, 'fill="white"');
    // Then handle all other fill values
    modifiedSvg = modifiedSvg.replace(/fill="[^"]*"/g, 'fill="white"');
    modifiedSvg = modifiedSvg.replace(/fill='[^']*'/g, 'fill="white"');
    
    // Handle elements without fill attribute by adding fill="white"
    modifiedSvg = modifiedSvg.replace(/<path(?![^>]*fill=)/g, '<path fill="white"');
    modifiedSvg = modifiedSvg.replace(/<circle(?![^>]*fill=)/g, '<circle fill="white"');
    modifiedSvg = modifiedSvg.replace(/<ellipse(?![^>]*fill=)/g, '<ellipse fill="white"');
    modifiedSvg = modifiedSvg.replace(/<rect(?![^>]*fill=)/g, '<rect fill="white"');
    modifiedSvg = modifiedSvg.replace(/<polygon(?![^>]*fill=)/g, '<polygon fill="white"');
    
    // Ensure all elements have black stroke (but keep existing stroke-width if present)
    modifiedSvg = modifiedSvg.replace(/stroke="[^"]*"(?![^>]*stroke-width)/g, 'stroke="black" stroke-width="2"');
    modifiedSvg = modifiedSvg.replace(/stroke="[^"]*"(?=[^>]*stroke-width)/g, 'stroke="black"');
    modifiedSvg = modifiedSvg.replace(/stroke='[^']*'/g, 'stroke="black"');
    
    // Add stroke to elements that don't have it
    modifiedSvg = modifiedSvg.replace(/<path(?![^>]*stroke=)/g, '<path stroke="black" stroke-width="2"');
    modifiedSvg = modifiedSvg.replace(/<circle(?![^>]*stroke=)/g, '<circle stroke="black" stroke-width="2"');
    modifiedSvg = modifiedSvg.replace(/<ellipse(?![^>]*stroke=)/g, '<ellipse stroke="black" stroke-width="2"');
    modifiedSvg = modifiedSvg.replace(/<rect(?![^>]*stroke=)/g, '<rect stroke="black" stroke-width="2"');
    modifiedSvg = modifiedSvg.replace(/<polygon(?![^>]*stroke=)/g, '<polygon stroke="black" stroke-width="2"');
    
    // Apply shape transformations
    if (transform && transform.shape && transform.shape !== 'default') {
      modifiedSvg = applyShapeTransform(modifiedSvg, part, transform.shape);
    }
    
    // Apply colors based on state
    if (isSelected) {
      const fillColor = part === 'crown' ? '#3B82F6' : '#10B981'; // blue for crown, green for root
      modifiedSvg = modifiedSvg.replace(/fill="white"/g, `fill="${fillColor}"`);
      modifiedSvg = modifiedSvg.replace(/stroke="black"/g, `stroke="${fillColor}"`);
    } else if (isHovered) {
      const hoverColor = part === 'crown' ? '#93C5FD' : '#6EE7B7'; // light blue for crown, light green for root
      modifiedSvg = modifiedSvg.replace(/fill="white"/g, `fill="${hoverColor}"`);
    }
    

    
    return modifiedSvg;
  };

  const applyShapeTransform = (svgContent, part, shape) => {
    let modifiedSvg = svgContent;
    
    if (part === 'crown') {
      switch (shape) {
        case 'round':
          // Make crown more rounded by adjusting path curves
          modifiedSvg = modifiedSvg.replace(/rx="[\d.]*"/g, 'rx="8"');
          modifiedSvg = modifiedSvg.replace(/ry="[\d.]*"/g, 'ry="8"');
          // Add rounded corners to paths
          modifiedSvg = modifiedSvg.replace(/<path/g, '<path stroke-linejoin="round" stroke-linecap="round"');
          break;
        case 'square':
          // Make crown more angular/square
          modifiedSvg = modifiedSvg.replace(/rx="[\d.]*"/g, 'rx="1"');
          modifiedSvg = modifiedSvg.replace(/ry="[\d.]*"/g, 'ry="1"');
          modifiedSvg = modifiedSvg.replace(/<path/g, '<path stroke-linejoin="miter" stroke-linecap="square"');
          break;
        case 'pointed':
          // Make crown more pointed/sharp
          modifiedSvg = modifiedSvg.replace(/rx="[\d.]*"/g, 'rx="0"');
          modifiedSvg = modifiedSvg.replace(/ry="[\d.]*"/g, 'ry="0"');
          modifiedSvg = modifiedSvg.replace(/<path/g, '<path stroke-linejoin="miter" stroke-linecap="butt"');
          break;
      }
    } else if (part === 'root') {
      switch (shape) {
        case 'thin':
          // Make root thinner by scaling X
          modifiedSvg = modifiedSvg.replace(/<svg([^>]*)>/, '<svg$1><g transform="scale(0.7, 1)">');
          modifiedSvg = modifiedSvg.replace('</svg>', '</g></svg>');
          break;
        case 'thick':
          // Make root thicker by scaling X
          modifiedSvg = modifiedSvg.replace(/<svg([^>]*)>/, '<svg$1><g transform="scale(1.3, 1)">');
          modifiedSvg = modifiedSvg.replace('</svg>', '</g></svg>');
          break;
        case 'curved':
          // Make root more curved
          modifiedSvg = modifiedSvg.replace(/<path/g, '<path stroke-linejoin="round" stroke-linecap="round"');
          modifiedSvg = modifiedSvg.replace(/<svg([^>]*)>/, '<svg$1><g transform="skewX(5)">');
          modifiedSvg = modifiedSvg.replace('</svg>', '</g></svg>');
          break;
      }
    }
    
    return modifiedSvg;
  };

  const handleDropdownAction = (action) => {
    onMissingChange(toothNumber, action);
    setShowDropdown(false);
  };

  const getDropdownOptions = () => {
    const options = [];
    
    if (missingState === 'none') {
      options.push(
        { label: 'Mark Entire Tooth Missing', action: 'entire' },
        { label: 'Mark Crown Missing', action: 'crown' },
        { label: 'Mark Root Missing', action: 'root' }
      );
    } else {
      options.push({ label: 'Restore Tooth', action: 'none' });
    }
    
    return options;
  };

  const shouldShowPart = (part) => {
    if (missingState === 'entire') return false;
    if (missingState === part) return false;
    return true;
  };

  const handleDropdownClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div 
      className="tooth-container" 
      style={{ position: 'relative' }}
    >
      {/* Dropdown Button */}
      <button
        className="tooth-dropdown-button"
        onClick={handleDropdownClick}
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '16px',
          height: '16px',
          border: 'none',
          borderRadius: '2px',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          color: '#666',
          fontSize: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          zIndex: 1000,
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
      >
        ⋯
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div 
          className={`tooth-dropdown-${toothNumber}`}
          style={{
            position: 'absolute',
            top: '18px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1001,
            minWidth: '160px',
            fontSize: '12px'
          }}
        >
          {getDropdownOptions().map((option, index) => (
            <button
              key={index}
              onClick={() => handleDropdownAction(option.action)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Missing tooth indicator removed - just hide the parts */}

      <div className="tooth-parts">
        {isUpperJaw ? (
          // Upper jaw: Root first (top), Crown second (bottom)
          <>
            {/* Root for upper jaw */}
            {toothData.root && rootSvg && shouldShowPart('root') && (
              <div 
                className={getPartClasses('root')}
                onClick={(e) => handlePartClick(e, 'root')}
                onMouseDown={(e) => handleMouseDown(e, 'root')}
                onWheel={(e) => handleWheel(e, 'root')}
                onContextMenu={(e) => handleRightClick(e, 'root')}
                onMouseEnter={(e) => {
                  setHoveredPart('root');
                  setTooltipContent(getTooltipText('root'));
                  setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setHoveredPart(null);
                  setShowTooltip(false);
                }}
                onMouseMove={(e) => {
                  if (showTooltip) {
                    setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  }
                }}
                style={{ 
                  width: '50px', 
                  height: '55px',
                  zIndex: 1,
                  position: 'relative',
                  marginBottom: ['18', '17', '16', '26', '27', '28'].includes(toothNumber) ? '-8px' : '-18px',
                  transform: getTransformStyle('root'),
                  cursor: isDragMode ? 'move' : 'pointer',
                  userSelect: 'none'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: modifySvgForSelection(rootSvg, 'root').replace(/<svg[^>]*>/, '<svg width="50" height="55" viewBox="0 0 44 59">').replace('</svg>', '</svg>')
                }}
              />
            )}
            
            {/* Crown for upper jaw */}
            {toothData.crown && crownSvg && shouldShowPart('crown') && (
              <div 
                className={getPartClasses('crown')}
                onClick={(e) => handlePartClick(e, 'crown')}
                onMouseDown={(e) => handleMouseDown(e, 'crown')}
                onWheel={(e) => handleWheel(e, 'crown')}
                onContextMenu={(e) => handleRightClick(e, 'crown')}
                onMouseEnter={(e) => {
                  setHoveredPart('crown');
                  setTooltipContent(getTooltipText('crown'));
                  setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setHoveredPart(null);
                  setShowTooltip(false);
                }}
                onMouseMove={(e) => {
                  if (showTooltip) {
                    setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  }
                }}
                style={{ 
                  width: '50px', 
                  height: '45px', 
                  zIndex: 2,
                  position: 'relative',
                  transform: getTransformStyle('crown'),
                  cursor: isDragMode ? 'move' : 'pointer',
                  userSelect: 'none'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: modifySvgForSelection(crownSvg, 'crown').replace(/<svg[^>]*>/, '<svg width="50" height="45" viewBox="0 0 54 55">').replace('</svg>', '</svg>')
                }}
              />
            )}
          </>
        ) : (
          // Lower jaw: Crown first (top), Root second (bottom)
          <>
            {/* Crown for lower jaw */}
            {toothData.crown && crownSvg && shouldShowPart('crown') && (
              <div 
                className={getPartClasses('crown')}
                onClick={(e) => handlePartClick(e, 'crown')}
                onMouseDown={(e) => handleMouseDown(e, 'crown')}
                onWheel={(e) => handleWheel(e, 'crown')}
                onContextMenu={(e) => handleRightClick(e, 'crown')}
                onMouseEnter={(e) => {
                  setHoveredPart('crown');
                  setTooltipContent(getTooltipText('crown'));
                  setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setHoveredPart(null);
                  setShowTooltip(false);
                }}
                onMouseMove={(e) => {
                  if (showTooltip) {
                    setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  }
                }}
                style={{ 
                  width: ['42', '41', '31', '32', '33', '34', '35'].includes(toothNumber) ? '55px' : '50px',
                  height: ['42', '41', '31', '32', '33', '34', '35'].includes(toothNumber) ? '50px' : '45px',
                  marginBottom: ['42', '41', '31', '32', '33', '34', '35'].includes(toothNumber) ? '-20px' : 
                               (['48', '47', '46', '45', '44', '43', '36', '37', '38'].includes(toothNumber) ? '-18px' : '-18px'),
                  zIndex: 2,
                  position: 'relative',
                  transform: getTransformStyle('crown'),
                  cursor: isDragMode ? 'move' : 'pointer',
                  userSelect: 'none'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: modifySvgForSelection(crownSvg, 'crown').replace(/<svg[^>]*>/, '<svg width="50" height="45" viewBox="0 0 54 55">').replace('</svg>', '</svg>')
                }}
              />
            )}
            
            {/* Root for lower jaw */}
            {toothData.root && rootSvg && shouldShowPart('root') && (
              <div 
                className={getPartClasses('root')}
                onClick={(e) => handlePartClick(e, 'root')}
                onMouseDown={(e) => handleMouseDown(e, 'root')}
                onWheel={(e) => handleWheel(e, 'root')}
                onContextMenu={(e) => handleRightClick(e, 'root')}
                onMouseEnter={(e) => {
                  setHoveredPart('root');
                  setTooltipContent(getTooltipText('root'));
                  setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setHoveredPart(null);
                  setShowTooltip(false);
                }}
                onMouseMove={(e) => {
                  if (showTooltip) {
                    setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
                  }
                }}
                style={{ 
                  width: '50px', 
                  height: '55px',
                  zIndex: 1,
                  position: 'relative',
                  transform: getTransformStyle('root'),
                  cursor: isDragMode ? 'move' : 'pointer',
                  userSelect: 'none'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: modifySvgForSelection(rootSvg, 'root').replace(/<svg[^>]*>/, '<svg width="50" height="55" viewBox="0 0 44 59">').replace('</svg>', '</svg>')
                }}
              />
            )}
          </>
        )}
      </div>
      
      <div className="tooth-info">
        <span className="tooth-number">{toothNumber}</span>
        <div className="tooth-indicators">
          {toothData.crown && (
            <span className={`indicator ${selections.crown ? 'crown-selected' : 'unselected'}`}>
              C
            </span>
          )}
          {toothData.root && (
            <span className={`indicator ${selections.root ? 'root-selected' : 'unselected'}`}>
              R
            </span>
          )}
        </div>
      </div>



      {/* Custom Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 10001,
            pointerEvents: 'none',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default ToothComponent;