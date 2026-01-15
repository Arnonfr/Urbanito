
/**
 * Utility function for generating placeholder queries.
 * Note: Authentic images are now fetched via Google Maps Places Service in components.
 */
export const getCityImage = (city: string, keyword?: string) => {
  const query = keyword ? `${keyword} ${city}` : `${city} landmark`;
  return `https://images.unsplash.com/featured/?${encodeURIComponent(query)}`;
};
