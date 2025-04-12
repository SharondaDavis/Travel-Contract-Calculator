import React, { useState, useEffect, useRef } from 'react';

interface AddressInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface AddressSuggestion {
  place_id: string;
  description: string;
}

export function AddressInput({ 
  label, 
  value, 
  onChange, 
  placeholder = 'Enter address', 
  disabled = false 
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicks outside the suggestion box to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce input value to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  // Fetch address suggestions when debounced value changes
  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 3 || disabled) {
      setSuggestions([]);
      return;
    }

    async function fetchSuggestions() {
      setLoading(true);
      try {
        // In a real implementation, this would call a geocoding API like Google Places API
        // For demo purposes, we'll simulate the API response with some mock data
        const mockSuggestions = await simulateAddressLookup(debouncedValue);
        setSuggestions(mockSuggestions);
        setShowSuggestions(mockSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [debouncedValue, disabled]);

  // Simulate address lookup API
  const simulateAddressLookup = async (query: string): Promise<AddressSuggestion[]> => {
    // In a production environment, this would be replaced with a real API call
    // For example: return axios.get(`/api/places/autocomplete?input=${query}`).then(res => res.data);
    
    // For demo purposes, we'll return mock data based on the input
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    
    if (!query || query.length < 3) return [];
    
    const cities = [
      'New York, NY',
      'Los Angeles, CA',
      'Chicago, IL',
      'Houston, TX',
      'Phoenix, AZ',
      'Philadelphia, PA',
      'San Antonio, TX',
      'San Diego, CA',
      'Dallas, TX',
      'San Jose, CA',
      'Austin, TX',
      'Jacksonville, FL',
      'San Francisco, CA',
      'Indianapolis, IN',
      'Columbus, OH',
      'Fort Worth, TX',
      'Charlotte, NC',
      'Seattle, WA',
      'Denver, CO',
      'Washington, DC'
    ];
    
    const filteredCities = cities
      .filter(city => city.toLowerCase().includes(query.toLowerCase()))
      .map((description, index) => ({
        place_id: `place_id_${index}_${Date.now()}`,
        description
      }));
    
    return filteredCities;
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-1 relative">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
            >
              <div className="flex items-center">
                <span className="font-normal block truncate">
                  {suggestion.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
