import { useState } from 'react';
import { db } from '../storage/db';
import { Assignment } from '../App';
import { convertToJSONLD } from '../storage/converters';

export function useContractStorage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeContract = async (assignment: Assignment) => {
    setIsLoading(true);
    setError(null);
    try {
      const jsonldData = convertToJSONLD(assignment);
      await db.contracts.add({
        ...assignment,
        data: jsonldData
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store contract');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getContracts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await db.contracts.toArray();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve contracts');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContract = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await db.contracts.delete(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contract');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    storeContract,
    getContracts,
    deleteContract,
    isLoading,
    error
  };
} 