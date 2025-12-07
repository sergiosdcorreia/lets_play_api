"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherForecast = getWeatherForecast;
exports.getWeatherAdvice = getWeatherAdvice;
async function getWeatherForecast(latitude, longitude, matchDate) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        console.error("OpenWeather API key not configured");
        return {
            success: false,
            error: "Weather service not configured",
        };
    }
    try {
        // Check if match is more than 5 days away (free API only gives 5-day forecast)
        const today = new Date();
        const daysUntilMatch = Math.ceil((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilMatch > 5) {
            return {
                success: false,
                error: "Weather forecast only available for matches within 5 days",
            };
        }
        if (daysUntilMatch < 0) {
            return {
                success: false,
                error: "Cannot get weather for past matches",
            };
        }
        // Call OpenWeather 5-day forecast API
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API returned ${response.status}`);
        }
        const data = await response.json();
        // Find the forecast closest to match time
        const matchTime = matchDate.getTime();
        let closestForecast = data.list[0];
        let smallestDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - matchTime);
        for (const forecast of data.list) {
            const forecastTime = new Date(forecast.dt * 1000).getTime();
            const diff = Math.abs(forecastTime - matchTime);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestForecast = forecast;
            }
        }
        // Format weather data
        const weather = {
            date: new Date(closestForecast.dt * 1000).toISOString(),
            temp: Math.round(closestForecast.main.temp),
            feelsLike: Math.round(closestForecast.main.feels_like),
            description: closestForecast.weather[0].description,
            icon: closestForecast.weather[0].icon,
            humidity: closestForecast.main.humidity,
            windSpeed: Math.round(closestForecast.wind.speed * 3.6), // Convert m/s to km/h
            precipitation: closestForecast.pop * 100, // Probability of precipitation (%)
            cloudCover: closestForecast.clouds.all,
        };
        return {
            success: true,
            weather,
        };
    }
    catch (error) {
        console.error("Weather API error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch weather",
        };
    }
}
function getWeatherAdvice(weather) {
    const advice = [];
    // Temperature advice
    if (weather.temp < 5) {
        advice.push("⛄ Very cold! Dress warmly with layers.");
    }
    else if (weather.temp < 10) {
        advice.push("🧥 Cold weather. Bring a jacket for warm-up.");
    }
    else if (weather.temp > 28) {
        advice.push("🌡️ Very hot! Stay hydrated and take breaks.");
    }
    else if (weather.temp > 22) {
        advice.push("☀️ Warm weather. Bring water and sunscreen.");
    }
    else {
        advice.push("✅ Perfect temperature for football!");
    }
    // Precipitation advice
    if (weather.precipitation > 70) {
        advice.push("🌧️ High chance of rain. Bring waterproof gear!");
    }
    else if (weather.precipitation > 40) {
        advice.push("☔ Some rain possible. Consider bringing a jacket.");
    }
    // Wind advice
    if (weather.windSpeed > 30) {
        advice.push("💨 Very windy conditions. Long passes will be tricky!");
    }
    else if (weather.windSpeed > 20) {
        advice.push("🌬️ Moderately windy. Adjust your game accordingly.");
    }
    // Cloud cover
    if (weather.cloudCover > 80 && weather.temp > 25) {
        advice.push("☁️ Overcast but warm. Good playing conditions!");
    }
    return advice.join(" ");
}
