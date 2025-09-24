import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Data {
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
}

interface Suggestion {
  name: string;
  lat: string;
  lon: string;
  country: string;
  state?: string;
}

export default function App() {
  const [weather, setWeather] = useState<Data>({
    place: "Downtown Toronto, CA",
    temp: "26°C",
    description: "Sunny",
    icon: "https://openweathermap.org/img/wn/01d@2x.png",
    humidity: "60%",
    wind: "12 km/h",
    feels_like: "28°C",
    rain_chance: "0%",
    forecast: [],
  });
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (geolocationPosition) => {
        const { coords } = geolocationPosition;
        fetch(
          `http://localhost:3000/api/data?lat=${coords.latitude}&lon=${coords.longitude}`
        )
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            setWeather(data as Data);
            setLoading(false);
          });
      },
      () => {
        initialFetcher();
      }
    );
  }, []);
  const initialFetcher = () => {
    const searchQuery = search ? search : "Toronto";
    setLoading(true);
    fetch(`http://localhost:3000/api/data?city=${searchQuery}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        const suggestion = data[0];
        fetcher(suggestion);
      });
  };
  const fetcher = (suggestion: Suggestion) => {
    fetch(
      `http://localhost:3000/api/data?lat=${suggestion.lat}&lon=${suggestion.lon}`
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setWeather(data as Data);
        setLoading(false);
        if (search) {
          setSearch("");
        }
      });
  };
  const updateSuggestions = () => {
    if (search.length > 0) {
      fetch(`http://localhost:3000/api/data?city=${search}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          setSuggestions(data);
        });
    } else {
      setSuggestions([]);
    }
  };
  const handleSelectCity = (suggestion: Suggestion) => {
    console.log(suggestion);
    fetcher(suggestion);
    setSuggestions([]);
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-indigo-700 flex flex-col items-center p-6">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white text-3xl font-bold mb-6"
      >
        WeatherNow
      </motion.h1>

      {/* Search */}
      <div className="relative w-full max-w-md mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Enter city name..."
            className="rounded-2xl bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button className="rounded-2xl" onClick={updateSuggestions}>
            Search
          </Button>
        </div>
        {suggestions.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-white rounded-xl shadow-lg z-10">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 cursor-pointer hover:bg-gray-100 rounded-xl"
                onClick={() => handleSelectCity(suggestion)}
              >
                {[suggestion.name, suggestion.state, suggestion.country]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weather Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {loading ? (
          <Card className="rounded-2xl shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-20" />
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <MapPin className="text-blue-600" />
              <h2 className="text-xl font-semibold">{weather.place}</h2>
              <div className="my-4">
                <img
                  src={weather.icon}
                  alt="Weather Icon"
                  className="w-16 h-16"
                />
              </div>
              <p className="text-5xl font-bold">{weather.temp}</p>
              <p className="text-gray-600 capitalize">{weather.description}</p>

              {/* Extra Info */}
              <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <p className="text-gray-600 text-sm">Humidity</p>
                  <p className="text-lg font-bold">{weather.humidity}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <p className="text-gray-600 text-sm">Wind</p>
                  <p className="text-lg font-bold">{weather.wind}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <p className="text-gray-600 text-sm">Feels Like</p>
                  <p className="text-lg font-bold">{weather.feels_like}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <p className="text-gray-600 text-sm">Rain Chance</p>
                  <p className="text-lg font-bold">{weather.rain_chance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 w-full max-w-md"
      >
        <h3 className="text-white text-lg font-semibold mb-4">
          5-Day Forecast
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {weather.forecast.map((f, i) => (
            <Card
              key={i}
              className="rounded-xl bg-white/80 backdrop-blur text-center"
            >
              <CardContent className="p-3 flex flex-col items-center">
                <p className="font-semibold">{f.day}</p>
                <img src={f.icon} alt="Weather Icon" className="w-8 h-8" />
                <p className="font-bold">{f.avgTemp}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
