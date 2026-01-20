import type { Celebrity } from '../types';

export const CELEBRITIES: Celebrity[] = [
  // Sorted alphabetically by first name (A-Z)

  {
    id: 'ayanakamura',
    name: 'Aya Nakamura',
    imageUrl: '/celebrities/ayanakamura.jpg',
    color: '#FFB703',
    category: 'music',
    description: 'Artiste française la plus écoutée au monde',
  },
  {
    id: 'beyonce',
    name: 'Beyoncé',
    imageUrl: '/celebrities/beyonce.jpg',
    color: '#9d4edd',
    category: 'music',
    description: 'Icône de la musique et du divertissement',
  },
  {
    id: 'agbegnenou',
    name: 'Clarisse Agbégnénou',
    imageUrl: '/celebrities/agbegnenou.jpg',
    color: '#FFD700',
    category: 'sports',
    description: 'Judokate française, championne olympique',
  },
  {
    id: 'ronaldo',
    name: 'Cristiano Ronaldo',
    imageUrl: '/celebrities/ronaldo.jpg',
    color: '#e63946',
    category: 'sports',
    description: 'Superstar du football portugais',
  },
  {
    id: 'dujardin',
    name: 'Jean Dujardin',
    imageUrl: '/celebrities/dujardin.jpg',
    color: '#FF8C42',
    category: 'entertainment',
    description: 'Acteur français oscarisé, star de The Artist',
  },
  {
    id: 'messi',
    name: 'Lionel Messi',
    imageUrl: '/celebrities/messi.jpg',
    color: '#6cb4ee',
    category: 'sports',
    description: 'Légende du football argentin',
  },
  {
    id: 'mauresmo',
    name: 'Amélie Mauresmo',
    imageUrl: '/celebrities/mauresmo.jpg',
    color: '#FF1493',
    category: 'sports',
    description: 'Championne française de tennis, ex-n°1 mondiale',
  },
  {
    id: 'cotillard',
    name: 'Marion Cotillard',
    imageUrl: '/celebrities/cotillard.jpg',
    color: '#C71585',
    category: 'entertainment',
    description: 'Actrice française oscarisée',
  },
  {
    id: 'omarsy',
    name: 'Omar Sy',
    imageUrl: '/celebrities/omarsy.jpg',
    color: '#FF6B35',
    category: 'entertainment',
    description: 'Acteur français, star d\'Intouchables et Lupin',
  },
  {
    id: 'dembele',
    name: 'Ousmane Dembélé',
    imageUrl: '/celebrities/dembele.jpg',
    color: '#0055A4', // French blue
    category: 'sports',
    description: 'Footballeur français, champion du monde 2018',
  },
  {
    id: 'taylor',
    name: 'Taylor Swift',
    imageUrl: '/celebrities/taylor.jpg',
    color: '#d60270',
    category: 'music',
    description: 'Superstar internationale de la pop',
  },
  {
    id: 'zidane',
    name: 'Zinedine Zidane',
    imageUrl: '/celebrities/zidane.jpg',
    color: '#EF4135', // French red
    category: 'sports',
    description: 'Légende du football français, champion du monde 1998',
  },
];

// Helper function to get celebrity by ID
export const getCelebrityById = (id: string): Celebrity | undefined => {
  return CELEBRITIES.find((celebrity) => celebrity.id === id);
};

// Helper function to get all celebrity categories
export const getCelebrityCategories = (): string[] => {
  const categories = new Set(CELEBRITIES.map((c) => c.category).filter(Boolean));
  return Array.from(categories);
};

// Helper function to get celebrities by category
export const getCelebritiesByCategory = (category: string): Celebrity[] => {
  return CELEBRITIES.filter((c) => c.category === category);
};
