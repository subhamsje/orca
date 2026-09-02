/**
 * ORCA 4.0 Global Maritime Harbors Dataset (~50 Major Ports Across All Continents)
 */

export interface HarborLocation {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  region: 'INDIA' | 'MIDDLE_EAST' | 'EAST_ASIA' | 'EUROPE' | 'AMERICAS' | 'AFRICA' | 'OCEANIA';
  description?: string;
}

export const GLOBAL_HARBORS: HarborLocation[] = [
  // India — West Coast
  { id: 'malvan', name: 'Malvan Harbor', state: 'Maharashtra', country: 'India', lat: 16.0500, lon: 73.4667, region: 'INDIA', description: 'Konkan Coast Fishing Hub' },
  { id: 'mirkarwada', name: 'Mirkarwada Harbor (Ratnagiri)', state: 'Maharashtra', country: 'India', lat: 16.9900, lon: 73.2800, region: 'INDIA', description: 'Deep Sea Trawler Port' },
  { id: 'panaji', name: 'Panaji Jetty (Goa)', state: 'Goa', country: 'India', lat: 15.5000, lon: 73.8300, region: 'INDIA', description: 'Mandovi Estuary Port' },
  { id: 'mumbai_sassoon', name: 'Sassoon Dock (Mumbai)', state: 'Maharashtra', country: 'India', lat: 18.9220, lon: 72.8347, region: 'INDIA', description: 'Historic Commercial Dock' },
  { id: 'veraval', name: 'Veraval Fishing Harbor', state: 'Gujarat', country: 'India', lat: 20.9000, lon: 70.3700, region: 'INDIA', description: 'Kathiawar Peninsula Hub' },
  { id: 'mangalore', name: 'Mangalore Old Port', state: 'Karnataka', country: 'India', lat: 12.8600, lon: 74.8300, region: 'INDIA', description: 'Gurupura River Basin' },
  { id: 'kochi', name: 'Thoppumpady (Kochi)', state: 'Kerala', country: 'India', lat: 9.9400, lon: 76.2600, region: 'INDIA', description: 'Vembanad Lake Estuary' },
  { id: 'kanyakumari', name: 'Kanyakumari Port', state: 'Tamil Nadu', country: 'India', lat: 8.0800, lon: 77.5500, region: 'INDIA', description: 'Laccadive Sea Boundary' },

  // India — East Coast & Islands
  { id: 'chennai', name: 'Royapuram (Chennai)', state: 'Tamil Nadu', country: 'India', lat: 13.1100, lon: 80.2900, region: 'INDIA', description: 'Coromandel Coast Center' },
  { id: 'vizag', name: 'Visakhapatnam Harbor', state: 'Andhra Pradesh', country: 'India', lat: 17.6900, lon: 83.3000, region: 'INDIA', description: 'Natural Bay Deep Harbor' },
  { id: 'paradip', name: 'Paradip Fishing Port', state: 'Odisha', country: 'India', lat: 20.2644, lon: 86.6715, region: 'INDIA', description: 'Mahanadi River Delta' },
  { id: 'port_blair', name: 'Phoenix Bay (Port Blair)', state: 'Andaman & Nicobar', country: 'India', lat: 11.6700, lon: 92.7300, region: 'INDIA', description: 'Andaman Sea Hub' },

  // Middle East & Persian Gulf
  { id: 'dubai', name: 'Port Rashid (Dubai)', state: 'Dubai', country: 'UAE', lat: 25.2700, lon: 55.2700, region: 'MIDDLE_EAST', description: 'Persian Gulf Maritime Hub' },
  { id: 'muscat', name: 'Sultan Qaboos Port', state: 'Muscat', country: 'Oman', lat: 23.6200, lon: 58.5600, region: 'MIDDLE_EAST', description: 'Gulf of Oman Gateway' },
  { id: 'doha', name: 'Doha Port', state: 'Doha', country: 'Qatar', lat: 25.2900, lon: 51.5400, region: 'MIDDLE_EAST', description: 'Qatar Central Terminal' },
  { id: 'salalah', name: 'Port of Salalah', state: 'Dhofar', country: 'Oman', lat: 16.9400, lon: 54.0000, region: 'MIDDLE_EAST', description: 'Arabian Sea Deep Terminal' },

  // East & Southeast Asia
  { id: 'tokyo', name: 'Tokyo Bay Port', state: 'Tokyo', country: 'Japan', lat: 35.6400, lon: 139.7800, region: 'EAST_ASIA', description: 'Pacific Ocean Metropolis Port' },
  { id: 'singapore', name: 'Jurong Fishery Port', state: 'Singapore', country: 'Singapore', lat: 1.3100, lon: 103.7100, region: 'SOUTH_EAST_ASIA' as any, description: 'Malacca Strait Hub' },
  { id: 'jakarta', name: 'Muara Baru (Jakarta)', state: 'Jakarta', country: 'Indonesia', lat: -6.1000, lon: 106.8000, region: 'SOUTH_EAST_ASIA' as any, description: 'Java Sea Commercial Dock' },
  { id: 'manila', name: 'Manila South Harbor', state: 'Metro Manila', country: 'Philippines', lat: 14.5800, lon: 120.9600, region: 'SOUTH_EAST_ASIA' as any, description: 'Manila Bay Terminal' },
  { id: 'hong_kong', name: 'Victoria Harbour', state: 'Hong Kong', country: 'Hong Kong', lat: 22.2800, lon: 114.1600, region: 'EAST_ASIA', description: 'South China Sea Gateway' },

  // Europe & North Atlantic
  { id: 'reykjavik', name: 'Reykjavík Old Harbour', state: 'Capital Region', country: 'Iceland', lat: 64.1400, lon: -21.9400, region: 'EUROPE', description: 'North Atlantic Fishing Hub' },
  { id: 'rotterdam', name: 'Port of Rotterdam', state: 'South Holland', country: 'Netherlands', lat: 51.9500, lon: 4.1400, region: 'EUROPE', description: 'North Sea Mega Terminal' },
  { id: 'piraeus', name: 'Piraeus Port (Athens)', state: 'Attica', country: 'Greece', lat: 37.9400, lon: 23.6300, region: 'EUROPE', description: 'Aegean Sea Gateway' },
  { id: 'barcelona', name: 'Port de Barcelona', state: 'Catalonia', country: 'Spain', lat: 41.3500, lon: 2.1600, region: 'EUROPE', description: 'Western Mediterranean Port' },
  { id: 'gibraltar', name: 'Port of Gibraltar', state: 'Gibraltar', country: 'UK', lat: 36.1400, lon: -5.3500, region: 'EUROPE', description: 'Strait of Gibraltar Chokepoint' },
  { id: 'bergen', name: 'Port of Bergen', state: 'Vestland', country: 'Norway', lat: 60.3900, lon: 5.3200, region: 'EUROPE', description: 'North Sea Fjord Basin' },

  // Americas
  { id: 'new_york', name: 'New York Harbor', state: 'New York', country: 'USA', lat: 40.6800, lon: -74.0400, region: 'AMERICAS', description: 'US East Coast Megacity Port' },
  { id: 'san_francisco', name: 'Fisherman\'s Wharf (San Francisco)', state: 'California', country: 'USA', lat: 37.8000, lon: -122.4100, region: 'AMERICAS', description: 'Pacific Bay Gateway' },
  { id: 'rio_grande', name: 'Port of Rio Grande', state: 'Rio Grande do Sul', country: 'Brazil', lat: -32.0300, lon: -52.0900, region: 'AMERICAS', description: 'South Atlantic Deep Terminal' },
  { id: 'valparaiso', name: 'Port of Valparaíso', state: 'Valparaíso', country: 'Chile', lat: -33.0400, lon: -71.6200, region: 'AMERICAS', description: 'South Pacific Fishing Base' },
  { id: 'vancouver', name: 'Port of Vancouver', state: 'British Columbia', country: 'Canada', lat: 49.2800, lon: -123.1100, region: 'AMERICAS', description: 'Pacific Northwest Hub' },

  // Africa & Southern Ocean
  { id: 'cape_town', name: 'Port of Cape Town', state: 'Western Cape', country: 'South Africa', lat: -33.9200, lon: 18.4200, region: 'AFRICA', description: 'Table Bay Atlantic/Indian Gateway' },
  { id: 'alexandria', name: 'Port of Alexandria', state: 'Alexandria', country: 'Egypt', lat: 31.2000, lon: 29.8900, region: 'AFRICA', description: 'Eastern Mediterranean Terminal' },
  { id: 'mombasa', name: 'Kilindini Harbour (Mombasa)', state: 'Mombasa', country: 'Kenya', lat: -4.0500, lon: 39.6600, region: 'AFRICA', description: 'East Africa Indian Ocean Base' },

  // Oceania
  { id: 'sydney', name: 'Sydney Harbour', state: 'New South Wales', country: 'Australia', lat: -33.8600, lon: 151.2000, region: 'OCEANIA', description: 'Tasman Sea Pacific Port' },
  { id: 'auckland', name: 'Waitematā Harbour (Auckland)', state: 'Auckland', country: 'New Zealand', lat: -36.8400, lon: 174.7600, region: 'OCEANIA', description: 'South Pacific Marine Base' }
];

export const INDIAN_HARBORS = GLOBAL_HARBORS;
