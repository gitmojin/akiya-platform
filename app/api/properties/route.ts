// app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres({
  host: process.env.AKIYA_DB_HOST || 'localhost',
  port: 5432,
  database: process.env.AKIYA_DB_NAME || 'akiya_municipality_db',
  username: process.env.AKIYA_DB_USER || 'akiya_user',
  password: process.env.AKIYA_DB_PASS || 'akiya_pass',
  ssl: process.env.NODE_ENV === 'production',
})

export async function GET(req: NextRequest) {
  try {
    const properties = await sql`
      SELECT 
        p.*,
        ST_AsGeoJSON(p.location)::json as location,
        json_agg(
          json_build_object(
            'url', pi.url,
            'caption_jp', pi.caption_jp,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order
        ) as images
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      WHERE p.location IS NOT NULL
      GROUP BY p.id
    `

    console.log('API: Fetched properties', {
      count: properties.length,
      sampleCoordinates: properties[0]?.location?.coordinates,
      sampleImages: properties[0]?.images?.slice(0, 2)
    });

    return NextResponse.json({
      properties: properties.map(property => ({
        ...property,
        location: property.location || null,
        images: property.images || []
      }))
    })
  } catch (error) {
    console.error('API: Error fetching properties', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}