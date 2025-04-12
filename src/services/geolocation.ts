import axios from 'axios';

// Types for geocoding response
interface GeocodingResult {
  lat: number;
  lon: number;
}

// Cache for geocoded addresses to minimize API calls
const geocodeCache: Record<string, GeocodingResult> = {};

/**
 * Geocode an address to coordinates using Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  // Check cache first
  if (geocodeCache[address]) {
    return geocodeCache[address];
  }
  
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'TravelNurseContractCalculator/1.0',
      },
    });
    
    if (response.data && response.data.length > 0) {
      const result = {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
      };
      
      // Cache the result
      geocodeCache[address] = result;
      
      return result;
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
}

/**
 * Calculate distance between two addresses
 */
export async function calculateDistance(address1: string, address2: string): Promise<number> {
  const coords1 = await geocodeAddress(address1);
  const coords2 = await geocodeAddress(address2);
  
  return calculateHaversineDistance(
    coords1.lat, 
    coords1.lon, 
    coords2.lat, 
    coords2.lon
  );
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 */
function calculateHaversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in miles
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI/180);
}

/**
 * For demo purposes - get a simulated distance without making API calls
 * This is useful for testing when API calls might be rate-limited
 */
export function getSimulatedDistance(address1: string, address2: string): number {
  // Generate a deterministic but seemingly random distance based on the addresses
  const combinedString = address1 + address2;
  let hash = 0;
  
  for (let i = 0; i < combinedString.length; i++) {
    hash = ((hash << 5) - hash) + combinedString.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Generate a distance between 30 and 60 miles
  const distance = 30 + Math.abs(hash % 30);
  
  return Math.round(distance * 10) / 10;
}
