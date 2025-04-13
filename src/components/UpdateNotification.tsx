import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationProps {
  onRefresh: () => void;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onRefresh, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg p-4 border border-blue-100 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          <p className="text-sm text-gray-700">📥 New update available! Click here to get the latest version.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Update Now
          </button>
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
