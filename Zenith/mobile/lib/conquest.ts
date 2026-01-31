import * as turf from '@turf/turf';

/**
 * KALMAN FILTER: GPS SMOOTHING ENGINE
 * Reduces jitter for tactical, straight run lines.
 */
export class KalmanFilter {
    private readonly Q: number; // Process noise covariance
    private readonly R: number; // Measurement noise covariance
    private x: number | null = null; // Estimated value
    private p: number = 1; // Estimation error covariance
    private k: number = 0; // Kalman gain

    constructor(processNoise: number = 0.0001, measurementNoise: number = 0.001) {
        this.Q = processNoise;
        this.R = measurementNoise;
    }

    filter(measurement: number): number {
        if (this.x === null) {
            this.x = measurement;
            return measurement;
        }

        // Prediction update
        this.p = this.p + this.Q;

        // Measurement update
        this.k = this.p / (this.p + this.R);
        this.x = this.x + this.k * (measurement - this.x);
        this.p = (1 - this.k) * this.p;

        return this.x;
    }
}

/**
 * CONQUEST ENGINE: TACTICAL GEOMETRY CORE
 */
export class ConquestEngine {
    private latFilter = new KalmanFilter();
    private lngFilter = new KalmanFilter();

    /**
     * Smooths incoming GPS coordinates.
     */
    smoothLocation(lng: number, lat: number): [number, number] {
        return [
            this.lngFilter.filter(lng),
            this.latFilter.filter(lat)
        ];
    }

    /**
     * Check if user is currently inside their own territory.
     * State A (Safe Zone).
     */
    isInside(point: [number, number], territoryGeoJSON: any): boolean {
        if (!territoryGeoJSON || !territoryGeoJSON.features || territoryGeoJSON.features.length === 0) {
            return false;
        }
        const pt = turf.point(point);
        return territoryGeoJSON.features.some((feature: any) => turf.booleanPointInPolygon(pt, feature));
    }

    /**
     * Detects when a path closes a loop or crosses itself.
     * State C (The Conquest).
     */
    detectCapture(path: [number, number][]): [number, number][] | null {
        if (path.length < 5) return null;

        const line = turf.lineString(path);
        const kinks = turf.kinks(line);

        if (kinks.features.length > 0) {
            // Self-intersection detected
            // Return the full path plus closure
            return [...path, path[0]];
        }

        // Simple distance-to-start closure (Mapbox Edition)
        const start = path[0];
        const last = path[path.length - 1];
        const distance = turf.distance(turf.point(start), turf.point(last), { units: 'meters' });

        if (distance < 15 && path.length > 15) {
            return [...path, path[0]];
        }

        return null;
    }

    /**
     * Merges captured loop with existing territory (Union).
     * Handles stealing from rivals (Difference).
     */
    processGeometry(newLoop: [number, number][], currentTerritory: any, rivals: any[]): any {
        let polygon = turf.polygon([newLoop]);

        // Minimum Area rule (100 sqm)
        const area = turf.area(polygon);
        if (area < 100) return null;

        // UNION: Merge with owner's territory
        if (currentTerritory && currentTerritory.features.length > 0) {
            const currentMulti = turf.union(turf.featureCollection(currentTerritory.features));
            if (currentMulti) {
                polygon = turf.union(turf.featureCollection([polygon, currentMulti])) as any;
            }
        }

        // DIFFERENCE: Subtract from rivals (Stealing)
        rivals.forEach(rivalFeature => {
            const diff = turf.difference(turf.featureCollection([rivalFeature, polygon]));
            if (diff) {
                // In a real app, you'd send this difference back to Supabase for User B
                console.log("Sector stolen from rival!");
            }
        });

        return polygon;
    }
}
