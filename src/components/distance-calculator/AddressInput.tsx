import React, { useState, useEffect, useRef } from 'react';

interface AddressInputProps {
  label: string;
  value: string;
  onChange: (value: string, metadata?: AddressSuggestionMetadata) => void;
  placeholder?: string;
  disabled?: boolean;
  includeFacilities?: boolean;
  returnMetadata?: boolean;
}

interface AddressSuggestion {
  place_id: string;
  description: string;
  facility_name?: string;
  address?: string;
  type?: 'address' | 'facility';
}

export interface AddressSuggestionMetadata {
  facility_name?: string;
  address?: string;
  type?: 'address' | 'facility';
}

export function AddressInput({ 
  label, 
  value, 
  onChange, 
  placeholder = 'Enter address', 
  disabled = false,
  includeFacilities = false,
  returnMetadata = false
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
        const mockSuggestions = await simulateAddressLookup(debouncedValue, includeFacilities);
        setSuggestions(mockSuggestions);
        setShowSuggestions(mockSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [debouncedValue, disabled, includeFacilities]);

  // Simulate address lookup API
  const simulateAddressLookup = async (query: string, includeFacilities: boolean): Promise<AddressSuggestion[]> => {
    // In a production environment, this would be replaced with a real API call
    // For example: return axios.get(`/api/places/autocomplete?input=${query}&types=address,establishment`).then(res => res.data);
    
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
    
    // Mock healthcare facilities with addresses
    const facilities = [
      { name: 'Memorial Hospital', address: '123 Main St, New York, NY 10001' },
      { name: 'City Medical Center', address: '456 Oak Ave, Los Angeles, CA 90001' },
      { name: 'University Hospital', address: '789 University Blvd, Chicago, IL 60601' },
      { name: 'General Hospital', address: '321 Center St, Houston, TX 77001' },
      { name: 'St. Mary\'s Medical Center', address: '555 Health Way, Phoenix, AZ 85001' },
      { name: 'County Hospital', address: '777 County Road, Philadelphia, PA 19019' },
      { name: 'Children\'s Hospital', address: '888 Pediatric Lane, San Antonio, TX 78201' },
      { name: 'Veterans Medical Center', address: '999 Veterans Blvd, San Diego, CA 92101' },
      { name: 'Community Hospital', address: '111 Community Circle, Dallas, TX 75201' },
      { name: 'Mercy Hospital', address: '222 Mercy Drive, San Jose, CA 95101' },
      { name: 'Regional Medical Center', address: '333 Regional Pkwy, Austin, TX 78701' },
      { name: 'Baptist Hospital', address: '444 Faith Street, Jacksonville, FL 32099' },
      { name: 'Presbyterian Medical', address: '666 Church Road, San Francisco, CA 94101' },
      { name: 'Kaiser Permanente', address: '777 Health Blvd, Seattle, WA 98101' },
      { name: 'Mayo Clinic', address: '888 Research Drive, Rochester, MN 55901' },
      { name: 'Cleveland Clinic', address: '999 Excellence Way, Cleveland, OH 44101' },
      { name: 'Johns Hopkins Hospital', address: '111 Academic Circle, Baltimore, MD 21201' },
      { name: 'Massachusetts General', address: '222 Medical Drive, Boston, MA 02101' },
      { name: 'Cedars-Sinai', address: '333 Cedar Avenue, Los Angeles, CA 90048' },
      { name: 'NYU Langone', address: '444 University Place, New York, NY 10016' }
    ];
    
    let results: AddressSuggestion[] = [];
    
    // Add address suggestions
    const filteredCities = cities
      .filter(city => city.toLowerCase().includes(query.toLowerCase()))
      .map((description, index) => ({
        place_id: `place_id_${index}_${Date.now()}`,
        description,
        type: 'address' as 'address'
      }));
    
    results = [...results, ...filteredCities];
    
    // Add facility suggestions if enabled
    if (includeFacilities) {
      const filteredFacilities = facilities
        .filter(facility => 
          facility.name.toLowerCase().includes(query.toLowerCase()) || 
          facility.address.toLowerCase().includes(query.toLowerCase())
        )
        .map((facility, index) => ({
          place_id: `facility_id_${index}_${Date.now()}`,
          description: `${facility.name} (${facility.address})`,
          facility_name: facility.name,
          address: facility.address,
          type: 'facility' as 'facility'
        }));
      
      results = [...results, ...filteredFacilities];
    }
    
    // Sort results: facilities first (if searching by facility), then addresses
    results.sort((a, b) => {
      // If searching by facility name and both are facilities, sort alphabetically
      if (includeFacilities && a.type === 'facility' && b.type === 'facility') {
        return (a.facility_name || '').localeCompare(b.facility_name || '');
      }
      
      // Facilities first when searching by facility name
      if (includeFacilities) {
        if (a.type === 'facility' && b.type !== 'facility') return -1;
        if (a.type !== 'facility' && b.type === 'facility') return 1;
      }
      
      return a.description.localeCompare(b.description);
    });
    
    return results;
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    // If it's a facility, use the address
    const valueToUse = suggestion.type === 'facility' ? suggestion.address || suggestion.description : suggestion.description;
    
    // If returnMetadata is true, pass the metadata to the onChange handler
    if (returnMetadata && suggestion.type === 'facility') {
      const metadata: AddressSuggestionMetadata = {
        facility_name: suggestion.facility_name,
        address: suggestion.address,
        type: suggestion.type
      };
      onChange(valueToUse, metadata);
    } else {
      onChange(valueToUse);
    }
    
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When the input changes, we only pass the value without metadata
    onChange(e.target.value);
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
          onChange={handleInputChange}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          placeholder={includeFacilities ? 'Enter facility name or address' : placeholder}
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
              {suggestion.type === 'facility' ? (
                <div className="flex flex-col">
                  <span className="font-medium text-blue-600">
                    {suggestion.facility_name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {suggestion.address}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="font-normal block truncate">
                    {suggestion.description}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
