import React, { useState, useEffect } from 'react';
import ToothComponent from './ToothComponent';

const DentalChart = () => {
  const [teethData, setTeethData] = useState({});
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDragMode, setIsDragMode] = useState(false);
  const [positions, setPositions] = useState({});
  const [transforms, setTransforms] = useState({});
  const [savedDefaults, setSavedDefaults] = useState({ positions: {}, transforms: {} });
  const [showDropdown, setShowDropdown] = useState(false);
  const [missingTeeth, setMissingTeeth] = useState({});

  // Dental chart layout - standard FDI numbering (matching the image layout)
  const upperTeeth = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
  const lowerTeeth = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

  useEffect(() => {
    fetchTeethData();
    loadDefaults();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchTeethData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teeth');
      const data = await response.json();
      setTeethData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teeth data:', error);
      setLoading(false);
    }
  };

  const loadDefaults = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/defaults');
      const defaults = await response.json();
      
      // Save the loaded defaults for reset functionality
      setSavedDefaults({
        positions: defaults.positions || {},
        transforms: defaults.transforms || {}
      });
      
      if (defaults.positions && Object.keys(defaults.positions).length > 0) {
        setPositions(defaults.positions);
      }
      
      if (defaults.transforms && Object.keys(defaults.transforms).length > 0) {
        setTransforms(defaults.transforms);
      }
      
      console.log('Loaded defaults:', defaults);
    } catch (error) {
      console.error('Error loading defaults:', error);
      // Continue with empty defaults if loading fails
    }
  };

  const handleToothSelection = (toothNumber, part, isSelected) => {
    setSelections(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        [part]: isSelected
      }
    }));
  };

  const saveSelections = async () => {
    try {
      await fetch('http://localhost:5000/api/selections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          selections,
          positions,
          transforms,
          missingTeeth
        }),
      });
      alert('Selections, positions, and transforms saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data');
    }
  };

  const clearSelections = () => {
    setSelections({});
  };

  const handlePositionChange = (toothNumber, part, newPosition) => {
    setPositions(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        [part]: newPosition
      }
    }));
  };

  const handleTransformChange = (toothNumber, part, newTransform) => {
    setTransforms(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        [part]: newTransform
      }
    }));
  };

  const handleMissingChange = (toothNumber, missingType) => {
    setMissingTeeth(prev => ({
      ...prev,
      [toothNumber]: missingType
    }));
  };



  const resetPositions = () => {
    setPositions(savedDefaults.positions);
    setTransforms(savedDefaults.transforms);
  };

  const setCurrentAsDefault = async () => {
    try {
      // Save current state as new defaults to the server
      const response = await fetch('http://localhost:5000/api/set-defaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          defaultPositions: positions,
          defaultTransforms: transforms
        }),
      });
      
      if (response.ok) {
        // Update the saved defaults in state
        setSavedDefaults({
          positions: positions,
          transforms: transforms
        });
        alert('Current positions and shapes have been set as the new defaults!');
        console.log('New defaults set:', { positions, transforms });
      } else {
        throw new Error('Failed to set defaults');
      }
    } catch (error) {
      console.error('Error setting defaults:', error);
      
      // Fallback: show the user the values to manually update
      const currentPositionsStr = JSON.stringify(positions, null, 2);
      const currentTransformsStr = JSON.stringify(transforms, null, 2);
      
      const message = `Current positions and transforms:\n\nPositions: ${currentPositionsStr}\n\nTransforms: ${currentTransformsStr}\n\nCopy these values to set as defaults in the code.`;
      alert(message);
    }
  };

  const toggleDragMode = () => {
    setIsDragMode(prev => !prev);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '1.25rem' }}>Loading dental chart...</div>
      </div>
    );
  }

  return (
    <div className="dental-chart-container">
      <div className="dental-chart-content">
        <h1 className="dental-chart-title">
          Interactive Dental Chart
        </h1>
        
        <div className="dental-chart-panel">
          <div className="dental-chart-header">
            <h2>Interactive Dental Chart Controls</h2>
            <div className="button-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={clearSelections} className="btn btn-secondary">
                Clear Selections
              </button>
              <button onClick={saveSelections} className="btn btn-primary">
                Save All
              </button>
              
              {/* Dropdown Menu */}
              <div className="dropdown-container" style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '8px 12px',
                    fontSize: '16px',
                    lineHeight: '1'
                  }}
                >
                  ⋯
                </button>
                
                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '180px',
                    marginTop: '2px'
                  }}>
                    <button 
                      onClick={() => {
                        toggleDragMode();
                        setShowDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: isDragMode ? '#f59e0b' : '#3b82f6'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {isDragMode ? '🔒 Lock (Select Mode)' : '🔓 Unlock (Drag Mode)'}
                    </button>
                    <button 
                      onClick={() => {
                        resetPositions();
                        setShowDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Reset Positions
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentAsDefault();
                        setShowDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Set as Default
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mode-indicator" style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: isDragMode ? '#fef3c7' : '#dbeafe',
            border: `2px solid ${isDragMode ? '#f59e0b' : '#3b82f6'}`,
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            color: isDragMode ? '#92400e' : '#1e40af'
          }}>
            {isDragMode ? 
              '🔓 DRAG MODE: Drag to move • Mouse wheel to resize • Right-click to change shape (Crown: default→round→square→pointed, Root: default→thin→thick→curved)' : 
              '🔒 SELECT MODE: Click crowns/roots to select/deselect them'
            }
          </div>
          


          {/* Upper Teeth */}
          <div className="teeth-section">
            <h3>Upper Teeth</h3>
            <div className="teeth-row">
              {upperTeeth.map(toothNumber => (
                <ToothComponent
                  key={toothNumber}
                  toothNumber={toothNumber}
                  teethData={teethData}
                  selections={selections[toothNumber] || {}}
                  onSelection={handleToothSelection}
                  isUpperJaw={true}
                  isDragMode={isDragMode}
                  positions={positions}
                  onPositionChange={handlePositionChange}
                  transforms={transforms}
                  onTransformChange={handleTransformChange}
                  missingState={missingTeeth[toothNumber] || 'none'}
                  onMissingChange={handleMissingChange}
                />
              ))}
            </div>
          </div>

          {/* Lower Teeth */}
          <div className="teeth-section">
            <h3>Lower Teeth</h3>
            <div className="teeth-row">
              {lowerTeeth.map(toothNumber => (
                <ToothComponent
                  key={toothNumber}
                  toothNumber={toothNumber}
                  teethData={teethData}
                  selections={selections[toothNumber] || {}}
                  onSelection={handleToothSelection}
                  isUpperJaw={false}
                  isDragMode={isDragMode}
                  positions={positions}
                  onPositionChange={handlePositionChange}
                  transforms={transforms}
                  onTransformChange={handleTransformChange}
                  missingState={missingTeeth[toothNumber] || 'none'}
                  onMissingChange={handleMissingChange}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        <div className="dental-chart-panel">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
            Current Selections
          </h3>
          <div className="selections-grid">
            {Object.entries(selections).map(([toothNumber, parts]) => {
              const selectedParts = Object.entries(parts).filter(([, isSelected]) => isSelected);
              if (selectedParts.length === 0) return null;
              
              return (
                <div key={toothNumber} className="selection-item">
                  <div className="selection-tooth">Tooth {toothNumber}</div>
                  <div className="selection-parts">
                    {selectedParts.map(([part]) => part).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(selections).filter(tooth => 
            Object.values(selections[tooth]).some(selected => selected)
          ).length === 0 && (
            <p className="no-selections">No selections made yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DentalChart;