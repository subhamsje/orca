export interface HarborLocation {
  id: string;
  name: string;
  state: string;
  coast: 'West' | 'East' | 'Islands';
  lat: number;
  lon: number;
  description: string;
}

export const INDIAN_HARBORS: HarborLocation[] = [
  {
    id: 'panaji',
    name: 'Panaji Port (Betim / Mandovi)',
    state: 'Goa',
    coast: 'West',
    lat: 15.5000,
    lon: 73.8300,
    description: 'Primary Goan mechanized fishing harbor & wholesale auction center',
  },
  {
    id: 'malvan',
    name: 'Malvan Port (Chivla / Dandi)',
    state: 'Maharashtra',
    coast: 'West',
    lat: 16.0580,
    lon: 73.4650,
    description: 'Sindhudurg coastal fishing hub famous for Bangda & Surmai catches',
  },
  {
    id: 'ratnagiri',
    name: 'Mirkarwada Harbor (Ratnagiri)',
    state: 'Maharashtra',
    coast: 'West',
    lat: 16.9850,
    lon: 73.2850,
    description: 'Major Konkan mechanized deep-sea trawler harbor',
  },
  {
    id: 'mumbai',
    name: 'Sassoon Dock (Mumbai)',
    state: 'Maharashtra',
    coast: 'West',
    lat: 18.9220,
    lon: 72.8347,
    description: 'Historic & largest wholesale seafood dock in South Mumbai',
  },
  {
    id: 'veraval',
    name: 'Veraval Fisheries Harbour',
    state: 'Gujarat',
    coast: 'West',
    lat: 20.9000,
    lon: 70.3700,
    description: 'Largest seafood processing & trawler harbor in Saurashtra',
  },
  {
    id: 'mangalore',
    name: 'Old Mangalore Port (Bunder)',
    state: 'Karnataka',
    coast: 'West',
    lat: 12.8600,
    lon: 74.8350,
    description: 'Karnataka coastal hub for purse-seine & mechanized trawlers',
  },
  {
    id: 'kochi',
    name: 'Cochin Fisheries Harbour (Thoppumpady)',
    state: 'Kerala',
    coast: 'West',
    lat: 9.9400,
    lon: 76.2600,
    description: 'Major South Indian pelagic sardine & tuna fishing terminal',
  },
  {
    id: 'kanyakumari',
    name: 'Kanyakumari Fishing Harbour',
    state: 'Tamil Nadu',
    coast: 'East',
    lat: 8.0883,
    lon: 77.5385,
    description: 'Triple-sea confluence fishing center at the southern tip of India',
  },
  {
    id: 'chennai',
    name: 'Chennai Fishing Harbour (Royapuram)',
    state: 'Tamil Nadu',
    coast: 'East',
    lat: 13.1000,
    lon: 80.2900,
    description: 'Coromandel coast deep-sea gillnet & trawler harbor',
  },
  {
    id: 'vizag',
    name: 'Visakhapatnam Fishing Harbour',
    state: 'Andhra Pradesh',
    coast: 'East',
    lat: 17.6900,
    lon: 83.3000,
    description: 'Northern Andhra deep-sea prawn & kingfish trawler hub',
  },
  {
    id: 'paradip',
    name: 'Paradip Commercial Harbour',
    state: 'Odisha',
    coast: 'East',
    lat: 20.2644,
    lon: 86.6715,
    description: 'Odisha Bay of Bengal mechanized trawler port & cyclone shelter',
  },
  {
    id: 'portblair',
    name: 'Port Blair Harbour',
    state: 'Andaman & Nicobar Islands',
    coast: 'Islands',
    lat: 11.6670,
    lon: 92.7350,
    description: 'Bay of Bengal island deep-water oceanic tuna fishing base',
  },
];
