import React from 'react';
import { useContractStorage } from '../hooks/useContractStorage';
import { Assignment } from '../App';
import { Download, Database } from 'lucide-react';

interface ContractStorageButtonProps {
  assignments: Assignment[];
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function ContractStorageButton({ assignments, onSuccess, onError }: ContractStorageButtonProps) {
  const { storeContract, isStoring, error } = useContractStorage();

  // Only render in development environment
  if (import.meta.env.PROD) {
    return null;
  }

  const handleClick = async () => {
    try {
      const results = await Promise.all(
        assignments.map(assignment => storeContract(assignment))
      );

      // Check if all contracts were stored successfully
      const allSuccessful = results.every(result => result.success);
      const allData = results.map(result => result.data);

      if (allSuccessful) {
        // Create a single JSON file containing all contracts
        const jsonData = {
          contracts: allData,
          timestamp: new Date().toISOString(),
          totalContracts: assignments.length
        };

        // Create and download the JSON file
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const link = document.createElement('a');
        link.href = jsonUrl;
        link.download = `all-contracts-${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(jsonUrl);
        
        onSuccess?.(allData);
      } else {
        const errors = results
          .filter(result => !result.success)
          .map(result => result.error)
          .join(', ');
        onError?.(`Some contracts failed to store: ${errors}`);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isStoring}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isStoring ? (
        <>
          <Database className="w-4 h-4 animate-spin" />
          <span>Storing All Contracts...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Store & Export All Contracts</span>
        </>
      )}
    </button>
  );
} 