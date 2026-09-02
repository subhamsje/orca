/**
 * ORCA 4.0 Global Maritime Harbors Dataset
 * Covers Indian coastal harbors, Persian Gulf, South East Asia, Mediterranean, and Global Maritime Hubs.
 */

export interface HarborLocation {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  region: 'INDIA' | 'MIDDLE_EAST' | 'SOUTH_EAST_ASIA' | 'EUROPE' | 'AMERICAS';
}

export const GLOBAL_HARBORS: HarborLocation[] = [
  // India West Coast
  { id: 'malvan', name: 'Malvan Harbor', state: 'Maharashtra', country: 'India', lat: 16.0500, lon: 73.4667, region: 'INDIA' },
  { id: 'mirkarwada', name: 'Mirkarwada Harbor (Ratnagiri)', state: 'Maharashtra', country: 'India', lat: 16.9900, lon: 73.2800, region: 'INDIA' },
  { id: 'panaji', name: 'Panaji Jetty (Goa)', state: 'Goa', country: 'India', lat: 15.5000, lon: 73.8300, region: 'INDIA' },
  { id: 'mumbai_sassoon', name: 'Sassoon Dock (Mumbai)', state: 'Maharashtra', country: 'India', lat: 18.9220, lon: 72.8347, region: 'INDIA' },
  { id: 'veraval', name: 'Veraval Fishing Harbor', state: 'Gujarat', country: 'India', lat: 20.9000, lon: 70.3700, region: 'INDIA' },
  { id: 'mangalore', name: 'Mangalore Old Port', state: 'Karnataka', country: 'India', lat: 12.8600, lon: 74.8300, region: 'INDIA' },
  { id: 'kochi', name: 'Thoppumpady (Kochi)', state: 'Kerala', country: 'India', lat: 9.9400, lon: 76.2600, region: 'INDIA' },
  { id: 'kanyakumari', name: 'Kanyakumari Port', state: 'Tamil Nadu', country: 'India', lat: 8.0800, lon: 77.5500, region: 'INDIA' },

  // India East Coast & Island Territories
  { id: 'chennai', name: 'Royapuram (Chennai)', state: 'Tamil Nadu', country: 'India', lat: 13.1100, lon: 80.2900, region: 'INDIA' },
  { id: 'vizag', name: 'Visakhapatnam Harbor', state: 'Andhra Pradesh', country: 'India', lat: 17.6900, lon: 83.3000, region: 'INDIA' },
  { id: 'paradip', name: 'Paradip Fishing Port', state: 'Odisha', country: 'India', lat: 20.2644, lon: 86.6715, region: 'INDIA' },
  { id: 'port_blair', name: 'Phoenix Bay (Port Blair)', state: 'Andaman & Nicobar', country: 'India', lat: 11.6700, lon: 92.7300, region: 'INDIA' },

  // Middle East & Persian Gulf
  { id: 'dubai', name: 'Port Rashid (Dubai)', state: 'Dubai', country: 'UAE', lat: 25.2700, lon: 55.2700, region: 'MIDDLE_EAST' },
  { id: 'muscat', name: 'Sultan Qaboos Port', state: 'Muscat', country: 'Oman', lat: 23.6200, lon: 58.5600, region: 'MIDDLE_EAST' },
  { id: 'doha', name: 'Doha Port', state: 'Doha', country: 'Qatar', lat: 25.2900, lon: 51.5400, region: 'MIDDLE_EAST' },

  // South East Asia & East Asia
  { id: 'singapore', name: 'Jurong Fishery Port', state: 'Singapore', country: 'Singapore', lat: 1.3100, lon: 103.7100, region: 'SOUTH_EAST_ASIA' },
  { id: 'jakarta', name: 'Muara Baru (Jakarta)', state: 'Jakarta', country: 'Indonesia', lat: -6.1000, lon: 106.8000, region: 'SOUTH_EAST_ASIA' },
  { id: 'tokyo', name: 'Toyosu Port (Tokyo)', state: 'Tokyo', country: 'Japan', lat: 35.6400, lon: 139.7800, region: 'SOUTH_EAST_ASIA' },

  // Europe & Mediterranean
  { id: 'rotterdam', name: 'Port of Rotterdam', state: 'South Holland', country: 'Netherlands', lat: 51.9500, lon: 4.1400, region: 'EUROPE' },
  { id: 'piraeus', name: 'Piraeus Port (Athens)', state: 'Attica', country: 'Greece', lat: 37.9400, lon: 23.6300, region: 'EUROPE' },

  // Americas
  { id: 'new_york', name: 'New York Harbor', state: 'New York', country: 'USA', lat: 40.6800, lon: -74.0400, region: 'AMERICAS' },
  { id: 'san_francisco', name: 'Fisherman\'s Wharf (San Francisco)', state: 'California', country: 'USA', lat: 37.8000, lon: -122.4100, region: 'AMERICAS' }
];

export const INDIAN_HARBORS = GLOBAL_HARBORS;
