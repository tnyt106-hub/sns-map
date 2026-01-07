/**
 * GoogleマップのナビゲーションURLを生成
 */
export function getGoogleMapsNavigationUrl(lat: number, lng: number, placeName?: string): string {
  const destination = `${lat},${lng}`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination);
  if (placeName) {
    url.searchParams.set("destination_place_id", placeName);
  }
  return url.toString();
}

/**
 * Googleマップで場所を開くURLを生成
 */
export function getGoogleMapsPlaceUrl(lat: number, lng: number, placeName?: string): string {
  const query = placeName || `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
