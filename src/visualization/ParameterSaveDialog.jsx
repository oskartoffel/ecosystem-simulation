// visualization/ParameterSaveDialog.jsx
import React from 'react';

const ParameterSaveDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDownload,
  onDiscard
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Save Simulation Parameters?</h2>
        <p className="mb-6">
          You've run a simulation with custom parameters. Would you like to:
        </p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save as Default Parameters
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download as JavaScript File
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterSaveDialog;