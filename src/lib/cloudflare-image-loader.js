/**
 * Custom image loader for Cloudflare Pages
 * 
 * Problem: Next.js default image optimization doesn't work on Cloudflare Pages
 * Solution: Use Cloudflare Images or direct URLs with query parameters
 * 
 * This loader generates optimized image URLs compatible with Cloudflare's edge runtime
 */
export default function cloudflareImageLoader({ src, width, quality }) {
  // If using Cloudflare Images (requires setup)
  if (process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL) {
    const params = [`width=${width}`];
    if (quality) {
      params.push(`quality=${quality}`);
    }
    return `${process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL}/${src}?${params.join('&')}`;
  }

  // For external images, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // For local images, use query parameters for client-side handling
  const params = [`w=${width}`];
  if (quality) {
    params.push(`q=${quality}`);
  }

  // Handle absolute and relative paths
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
  const imagePath = src.startsWith('/') ? src : `/${src}`;
  
  return `${baseUrl}${imagePath}?${params.join('&')}`;
}