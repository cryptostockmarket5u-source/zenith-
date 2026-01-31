import { Request, Response } from 'express';
import { query } from '../db';

// Get all territories (World State)
export const getWorldState = async (req: Request, res: Response) => {
    try {
        // Return GeoJSON directly from PostGIS
        const result = await query(`
      SELECT 
        json_build_object(
          'type', 'FeatureCollection',
          'features', json_agg(ST_AsGeoJSON(t.*)::json)
        ) as geojson
      FROM (
        SELECT id, user_id, health, geog::geometry as geometry FROM territories
      ) as t;
    `);
        res.json(result.rows[0].geojson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Create or Update Territory (The Capture)
// This is a simplified version. The real "Capture" involves complex union logic.
// For now, we assume the client sends a valid polygon to merge.
export const captureTerritory = async (req: Request, res: Response) => {
    const { userId, coordinates } = req.body; // coordinates: array of [lng, lat] forming a loop

    try {
        // 1. Convert input loop to a Polygon
        // 2. Union with existing territory for this user
        // 3. Subtract from overlapping rivals (The "Swallow" - simplified for now)

        // Simple insert/update logic for prototype:
        // If user has no territory, create one.
        // If user has territory, ST_Union it.

        // Note: coordinates must be closed loop
        const polygonString = `POLYGON((${coordinates.map((c: number[]) => `${c[0]} ${c[1]}`).join(',')}))`;

        const result = await query(`
      INSERT INTO territories (user_id, geog)
      VALUES ($1, ST_GeogFromText($2))
      ON CONFLICT DO NOTHING -- In real app we would Update/Union
      RETURNING id;
    `, [userId, polygonString]);

        // TODO: Implement the ST_Union logic for existing users

        res.json({ success: true, id: result.rows[0]?.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Capture failed' });
    }
};
