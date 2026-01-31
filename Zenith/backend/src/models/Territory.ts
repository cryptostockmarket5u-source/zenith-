export interface Point {
    lat: number;
    lng: number;
}

export interface Territory {
    id: string;
    userId: string;
    geometry: {
        type: "MultiPolygon";
        coordinates: number[][][][]; // GeoJSON standard: [Polygon1, Polygon2, ...] where Polygon is [Ring1, Ring2, ...]
    };
    health: number;
    lastVisited: Date;
}
