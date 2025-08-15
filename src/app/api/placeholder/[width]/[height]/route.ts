import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ width: string; height: string }> }
) {
  const { width: widthParam, height: heightParam } = await params;
  const width = parseInt(widthParam) || 512;
  const height = parseInt(heightParam) || 512;
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(147, 51, 234);stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:rgb(168, 85, 247);stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
      <rect width="${width}" height="${height}" fill="rgb(15, 15, 15)" />
      <g transform="translate(${width/2}, ${height/2})">
        <text 
          x="0" 
          y="-20" 
          text-anchor="middle" 
          fill="rgb(147, 51, 234)" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="24" 
          font-weight="600"
        >
          AI Generated
        </text>
        <text 
          x="0" 
          y="10" 
          text-anchor="middle" 
          fill="rgb(168, 85, 247)" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="16"
        >
          ${width} × ${height}
        </text>
        <text 
          x="0" 
          y="40" 
          text-anchor="middle" 
          fill="rgb(115, 115, 115)" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="14"
        >
          Demo Mode
        </text>
      </g>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}