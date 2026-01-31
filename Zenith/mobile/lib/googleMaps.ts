export interface AQIData {
    aqi: number;
    category: string;
    code: string;
    pollutants: any;
    color: string;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export const fetchLocalAQI = async (lat: number, lng: number): Promise<AQIData | null> => {
    try {
        if (!GOOGLE_API_KEY) {
            console.error('[AQI] Missing Google API Key');
            return null;
        }

        const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location: {
                    latitude: lat,
                    longitude: lng
                },
                extraComputations: ["HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION", "POLLUTANT_CONCENTRATION", "LOCAL_AQI", "POLLUTANT_ADDITIONAL_INFO"]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('[AQI] API Error:', err);
            return null;
        }

        const data = await response.json();

        // Parse Google Response
        // Typically indexes[0] is the Universal AQI or Local AQI
        const index = data.indexes?.[0];

        if (!index) return null;

        const aqiScore = index.aqi;
        const category = index.category;

        let color = '#00E5FF'; // Default Cyan (Good)
        if (aqiScore > 50) color = '#FFFF00'; // Moderate
        if (aqiScore > 100) color = '#FF7F00'; // Unhealthy Sensitive
        if (aqiScore > 150) color = '#FF0000'; // Unhealthy
        if (aqiScore > 200) color = '#8F3F97'; // Very Unhealthy
        if (aqiScore > 300) color = '#7E0023'; // Hazardous

        return {
            aqi: aqiScore,
            category: category,
            code: index.code,
            pollutants: data.pollutants,
            color: color
        };

    } catch (e) {
        console.error('[AQI] Exception:', e);
        return null;
    }
};
