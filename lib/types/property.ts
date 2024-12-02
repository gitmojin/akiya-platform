// lib/types/property.ts
export interface Property {
  id: string;
  title_jp: string;
  area: string;
  prefecture: string;
  city: string;
  detailed_address_jp: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  type: '売買' | '賃貸';
  source: string;
  source_id?: string;
  price?: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  last_scraped: string;
  images?: Array<{
    url: string;
    caption_jp?: string;
    display_order?: number;
  }>;
}

export interface PropertyFilters {
  area?: string;
  type?: '売買' | '賃貸';
  minPrice?: number;
  maxPrice?: number;
  prefecture?: string;
  city?: string;
  searchTerm?: string;
  showFavorites?: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}