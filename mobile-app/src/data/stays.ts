import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';

export type Stay = {
  id: string;
  name: string;
  city: string;
  price: number;
  rating?: number;
  ratings?: number;
  verified: boolean;
  color: string;
  image?: string;
  images?: string[];
  description: string;
  amenities: string[];
  latitude: number;
  longitude: number;
  phone: string;
  sample: boolean;
};

// What the backend sends for each guesthouse
type ApiGuesthouse = {
  _id: string;
  name: string;
  logo?: string;
  gallery?: string[];
  description: string;
  amenities?: string[];
  pricePerNight: number;
  city: string;
  location?: { latitude: number; longitude: number };
  contact?: { phone: string; email: string };
  verificationStatus: string;
};

// Set in mobile-app/.env.local, for example EXPO_PUBLIC_API_URL=http://localhost:5000
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Used while there is no photo
const colorPalette = ['#4F8F9A', '#D98F4E', '#3E6B5E', '#6E8F6A', '#C27A4A'];

const sampleDescription =
  'A quiet riverside guesthouse with shaded decks, a small pool and sunrise breakfasts. Contact the host directly to check dates and rates.';

// Turns a bundled image into an address the screens can use
function local(file: number) {
  return Asset.fromModule(file).uri;
}

// AI-generated sample photos for the fictional sample guesthouses
const sampleImages: Record<string, string[]> = {
  '1': [
    local(require('@/assets/images/stays/thamalakane-1.jpg')),
    local(require('@/assets/images/stays/thamalakane-2.jpg')),
    local(require('@/assets/images/stays/thamalakane-3.jpg')),
  ],
  '2': [
    local(require('@/assets/images/stays/kalahari-1.jpg')),
    local(require('@/assets/images/stays/kalahari-2.jpg')),
    local(require('@/assets/images/stays/kalahari-3.jpg')),
  ],
  '3': [
    local(require('@/assets/images/stays/kubu-1.jpg')),
    local(require('@/assets/images/stays/kubu-2.jpg')),
    local(require('@/assets/images/stays/kubu-3.jpg')),
  ],
  '4': [
    local(require('@/assets/images/stays/delta-1.jpg')),
    local(require('@/assets/images/stays/delta-2.jpg')),
    local(require('@/assets/images/stays/delta-3.jpg')),
  ],
   '5': [
    local(require('@/assets/images/stays/boteti-1.jpg')),
    local(require('@/assets/images/stays/boteti-2.jpg')),
    local(require('@/assets/images/stays/boteti-3.jpg')),
  ],
};

function makeSample(
  id: string,
  name: string,
  city: string,
  price: number,
  rating: number,
  ratings: number,
  color: string,
  latitude: number,
  longitude: number
): Stay {
  const images = sampleImages[id];
  return {
    id,
    name,
    city,
    price,
    rating,
    ratings,
    verified: true,
    color,
    image: images?.[0],
    images,
    description: sampleDescription,
    amenities: ['Wi-Fi', 'Pool', 'Breakfast', 'Parking'],
    latitude,
    longitude,
    phone: '+26700000000',
    sample: true,
  };
}

export const sampleStays: Stay[] = [
  makeSample('1', 'Thamalakane River Haven', 'Maun', 1250, 4.9, 128, '#4F8F9A', -19.9833, 23.4167),
  makeSample('2', 'Kalahari Rest Lodge', 'Kasane', 1400, 4.7, 64, '#D98F4E', -17.8, 25.15),
  makeSample('3', 'Kubu Island Eco Retreat', 'Gaborone', 950, 4.6, 41, '#3E6B5E', -24.65, 25.91),
  makeSample('4', 'Delta Reed Camp', 'Maun', 780, 4.4, 33, '#6E8F6A', -19.98, 23.42),
  makeSample('5', 'Boteti Sunset Lodge', 'Maun', 1100, 4.6, 52, '#C27A4A', -20.0, 23.45),
];

// Turns a backend guesthouse into the shape the screens use
function toStay(item: ApiGuesthouse, index: number): Stay {
  const images =
    item.gallery && item.gallery.length > 0 ? item.gallery : item.logo ? [item.logo] : undefined;

  return {
    id: item._id,
    name: item.name,
    city: item.city,
    price: item.pricePerNight,
    verified: item.verificationStatus === 'verified',
    color: colorPalette[index % colorPalette.length],
    image: images?.[0],
    images,
    description: item.description,
    amenities: item.amenities ?? [],
    latitude: item.location?.latitude ?? 0,
    longitude: item.location?.longitude ?? 0,
    phone: item.contact?.phone ?? '',
    sample: false,
  };
}

// Loads the guesthouses. Falls back to sample data if the backend is not set up or not reachable.
export function useStays() {
  const [stays, setStays] = useState<Stay[]>(API_URL ? [] : sampleStays);
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [usingSample, setUsingSample] = useState(!API_URL);

  useEffect(() => {
    if (!API_URL) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    fetch(API_URL + '/api/guesthouses', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then((data: { guesthouses: ApiGuesthouse[] }) => {
        if (data.guesthouses.length > 0) {
          setStays(data.guesthouses.map(toStay));
          setUsingSample(false);
        } else {
          setStays(sampleStays);
          setUsingSample(true);
        }
      })
      .catch(() => {
        setStays(sampleStays);
        setUsingSample(true);
      })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return { stays, loading, usingSample };
}