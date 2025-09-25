import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Use process.env.PORT for Vercel
const API_KEY = process.env.OPEN_WEATHER_API_KEY; // Use process.env.API_KEY for Vercel

app.use(cors());

app.use(express.json());

let requests = 0;
app.get("/api/data", async (req: Request, res: Response) => {
    const city = req.query.city as string;
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    // console.log("requests", requests, city, lat, lon);
    requests++;
    if (requests > 30) {
        return res.json({ message: "Error from backend!" });
    }
    const fetchWeather = async (params: { lat: number; lon: number }) => {
        const weatherData = await getWeather(params);
        if (weatherData) {
            res.json(weatherData);
        } else {
            res.json({ message: "Could not Load Data!" });
        }
    };
    if (city) {
        const cities = await getCities(city);
        return res.json(cities);
    } else if (lat && lon) {
        return fetchWeather({ lat, lon });
    }
});

// Add other API routes here

// Export the app for Vercel Serverless Functions
module.exports = app;

// For local development, you can add:
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`Backend server listening on port ${port}`);
    });
}

async function getCities(city: string) {
    const response = await axios.get(
        `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${API_KEY}`,
    );
    return response.status === 200 ? response.data : [];
}

async function getWeather({ lat, lon }: { lat: number; lon: number }) {
    const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
    );
    if (response.status === 200) {
        const { weather, main, wind, sys, name, coord } = response.data;
        // console.log("coord", coord, name, sys);
        const weatherData: {
            place: string;
            temp: string;
            description: string;
            icon: string;
            humidity: string;
            wind: string;
            feels_like: string;
            rain_chance: string;
            forecast: {
                avgTemp: string;
                condition: string;
                date: string;
                day: string;
                icon: string;
            }[];
        } = {
            place: `${name}, ${sys.country}`,
            temp: `${Math.round(main.temp)}°C`,
            description: weather[0]?.description,
            icon: `http://openweathermap.org/img/wn/${weather[0]?.icon}@2x.png`,
            humidity: `${main.humidity}%`,
            wind: `${Math.round(wind.speed * 3.6)} km/h`,
            feels_like: `${Math.round(main.feels_like)}°C`,
            rain_chance: "",
            forecast: [],
        };
        const result = await getWeatherForecast({
            lat,
            lon,
        });
        if (result) {
            const { forecast, rain_chance } = result;
            if (rain_chance) {
                weatherData.rain_chance = rain_chance;
                weatherData.forecast = forecast;
            }
            return weatherData;
        }
        return null;
    } else {
        return null;
    }
}

let dateFormat: any;
async function getDateFormat() {
    if (dateFormat) return dateFormat;
    const { default: format } = await import("dateformat");
    dateFormat = format;
    return dateFormat;
}

async function getWeatherForecast({ lat, lon }: { lat: number; lon: number }) {
    const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
    );

    const data = response.status === 200 ? response.data : null;
    if (!data) return null;
    // Group by date
    const daily: Record<string, any[]> = {};
    data.list.forEach((item: any) => {
        const date = item.dt_txt.split(" ")[0]; // "YYYY-MM-DD"
        if (!daily[date]) {
            daily[date] = [];
        }
        daily[date].push(item);
    });
    const dateFormat = await getDateFormat();
    // Extract average or noon reading
    const forecast = Object.keys(daily).slice(0, 5).map((date) => {
        const dayData = daily[date];
        const temps = dayData.map((d) => d.main.temp);
        const avgTemp = temps.reduce((a, b) => a + b, 0) /
            temps.length;
        return {
            date,
            day: dateFormat(date, "ddd"),
            avgTemp: `${Math.round(parseFloat(avgTemp.toFixed(1)))}°C`,
            condition: dayData[0].weather[0].description,
            icon: `http://openweathermap.org/img/wn/${
                dayData[0].weather[0].icon
            }@2x.png`,
        };
    });

    return { forecast, rain_chance: `${Math.round(data.list[0].pop * 100)}%` };
}
