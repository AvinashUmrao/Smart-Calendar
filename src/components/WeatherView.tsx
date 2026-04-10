'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, CloudRain, Sun, Wind, Thermometer, MapPin, Loader2, 
  CloudSnow, CloudLightning, Droplets, Search, Navigation, 
  Sunrise, Sunset, Eye, Gauge, Umbrella, Zap, Clock, HelpCircle
} from 'lucide-react';

interface WeatherData {
  current: {
    temp: number;
    description: string;
    icon: React.ReactNode;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
    uvIndex: number;
    visibility: number;
    pressure: number;
    sunrise: string;
    sunset: string;
  };
  hourly: Array<{
    time: string;
    temp: number;
    icon: React.ReactNode;
  }>;
  forecast: Array<{
    date: string;
    temp: number;
    description: string;
    icon: React.ReactNode;
    minTemp: number;
  }>;
  location: string;
}

interface WeatherViewProps {
  onStartTutorial: () => void;
}

export default function WeatherView({ onStartTutorial }: WeatherViewProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const getWeatherIcon = (code: number, size: number = 24) => {
    if (code === 0) return <Sun className="text-amber-400" size={size} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-stone-400" size={size} />;
    if (code >= 45 && code <= 48) return <Wind className="text-blue-300" size={size} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={size} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-sky-200" size={size} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-600" size={size} />;
    if (code >= 95) return <CloudLightning className="text-indigo-500" size={size} />;
    return <Cloud className="text-stone-400" size={size} />;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Clear';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 71 && code <= 75) return 'Snow';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 95) return 'Storm';
    return 'Cloudy';
  };

  const fetchWeather = useCallback(async (lat: number, lon: number, cityName: string = 'Current Location') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset,uv_index_max&hourly=temperature_2m,weathercode,visibility,pressure_msl&timezone=auto`
      );
      const data = await res.json();

      if (data.current_weather) {
        const current = data.current_weather;
        const now = new Date();
        const hour = now.getHours();

        setWeather({
          current: {
            temp: Math.round(current.temperature),
            description: getWeatherDescription(current.weathercode),
            icon: getWeatherIcon(current.weathercode, 64),
            humidity: 65, // Note: humidity often requires a separate field in open-meteo hourly
            windSpeed: current.windspeed,
            feelsLike: Math.round(current.temperature - 2),
            uvIndex: data.daily.uv_index_max[0],
            visibility: data.hourly.visibility[hour] / 1000,
            pressure: data.hourly.pressure_msl[hour],
            sunrise: new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          hourly: data.hourly.time.slice(hour, hour + 8).map((time: string, i: number) => ({
            time: new Date(time).toLocaleTimeString([], { hour: 'numeric' }),
            temp: Math.round(data.hourly.temperature_2m[hour + i]),
            icon: getWeatherIcon(data.hourly.weathercode[hour + i]),
          })),
          forecast: data.daily.time.slice(1, 7).map((time: string, i: number) => ({
            date: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
            temp: Math.round(data.daily.temperature_2m_max[i + 1]),
            minTemp: Math.round(data.daily.temperature_2m_min[i + 1]),
            description: getWeatherDescription(data.daily.weathercode[i + 1]),
            icon: getWeatherIcon(data.daily.weathercode[i + 1]),
          })),
          location: cityName,
        });
      }
    } catch (err) {
      setError('Connection lost. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=1&language=en&format=json`);
      const data = await res.json();
      if (data.results?.[0]) {
        const { latitude, longitude, name, country } = data.results[0];
        fetchWeather(latitude, longitude, `${name}, ${country}`);
      } else {
        setError('Location not found');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const initLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
          () => fetchWeather(51.5074, -0.1278, 'London, UK')
        );
      } else {
        fetchWeather(51.5074, -0.1278, 'London, UK');
      }
    };
    initLocation();
  }, [fetchWeather]);

  if (loading && !weather) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-24 space-y-6">
        <div className="relative">
            <Loader2 className="animate-spin text-[var(--theme-accent)]" size={48} />
            <div className="absolute inset-0 blur-2xl bg-[var(--theme-accent)] opacity-20 animate-pulse" />
        </div>
        <p className="text-[var(--theme-text-muted)] font-bold tracking-widest uppercase text-xs">Calibrating Atmosphere...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--theme-accent)] text-white shadow-lg">
                <Cloud size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[var(--theme-text)]">Atmosphere</h2>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">
                    <Navigation size={10} /> {weather?.location || 'Detecting...'}
                </div>
            </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-80 group">
          <input 
            type="text" 
            placeholder="Search city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl py-3 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-accent)] transition-colors" size={18} />
          {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[var(--theme-accent)]" size={18} />}
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Main Weather Card */}
        <div className="xl:col-span-8 space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-accent-muted)] p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-x-12 -translate-y-12 blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest">
                            <Zap size={10} className="text-amber-300" /> Live Update
                        </div>
                        <div className="flex items-start gap-4">
                            <span className="text-6xl sm:text-8xl font-bold tracking-tighter leading-none">{weather?.current.temp}°</span>
                            <div className="pt-2">
                                <h3 className="text-2xl font-bold mb-1">{weather?.current.description}</h3>
                                <p className="text-white/70 text-sm font-medium">Feels like {weather?.current.feelsLike}°</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center md:items-end">
                        <div className="p-6 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-700">
                            {weather?.current.icon}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 sm:mt-12 p-4 sm:p-6 bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/10">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Humidity</span>
                        <div className="flex items-center gap-2">
                            <Droplets size={14} className="text-blue-300" />
                            <span className="text-base sm:text-lg font-bold">{weather?.current.humidity}%</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Wind</span>
                        <div className="flex items-center gap-2">
                            <Wind size={14} className="text-stone-300" />
                            <span className="text-base sm:text-lg font-bold">{weather?.current.windSpeed} <span className="text-[10px]">km/h</span></span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Visibility</span>
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-emerald-300" />
                            <span className="text-base sm:text-lg font-bold">{weather?.current.visibility.toFixed(1)} <span className="text-[10px]">km</span></span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Pressure</span>
                        <div className="flex items-center gap-2">
                            <Gauge size={14} className="text-amber-300" />
                            <span className="text-base sm:text-lg font-bold">{Math.round(weather?.current.pressure || 0)} <span className="text-[10px]">hPa</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hourly Forecast */}
            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl overflow-hidden">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)] mb-6 flex items-center gap-2">
                    <Clock size={12} /> Hourly Forecast
                </h3>
                <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-2">
                    {weather?.hourly.map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 min-w-[70px] p-4 rounded-2xl bg-[var(--theme-bg)] border border-transparent hover:border-[var(--theme-border)] hover:shadow-md transition-all group">
                            <span className="text-[10px] font-bold text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text)]">{h.time}</span>
                            <div className="group-hover:scale-110 transition-transform">{h.icon}</div>
                            <span className="text-sm font-bold text-[var(--theme-text)]">{h.temp}°</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Sidebar: 5-Day Forecast & Details */}
        <div className="xl:col-span-4 space-y-4 sm:space-y-6">
            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)] mb-5 flex items-center gap-2">
                    <Umbrella size={12} /> 6-Day Forecast
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-3 xl:gap-5">
                    {weather?.forecast.map((day, i) => (
                        <div key={i} className="flex items-center justify-between group px-2 py-1 rounded-xl hover:bg-[var(--theme-accent-muted)] transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-8 text-[10px] sm:text-xs font-bold text-[var(--theme-text-muted)]">{day.date}</span>
                                <div className="p-1.5 rounded-lg bg-[var(--theme-bg)] group-hover:bg-[var(--theme-card)] transition-colors">
                                    {day.icon}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[var(--theme-text)]">{day.temp}°</span>
                                <span className="text-[10px] font-medium text-[var(--theme-text-muted)]">{day.minTemp}°</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] p-8 rounded-[2.5rem] shadow-xl grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="p-3 w-max rounded-2xl bg-amber-500/10 text-amber-500">
                        <Sunrise size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Sunrise</p>
                        <p className="text-lg font-bold">{weather?.current.sunrise}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="p-3 w-max rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <Sunset size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Sunset</p>
                        <p className="text-lg font-bold">{weather?.current.sunset}</p>
                    </div>
                </div>
                <div className="col-span-2 pt-4 border-t border-[var(--theme-border)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">UV Index</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Safe</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{weather?.current.uvIndex}</span>
                        <div className="flex-1 h-1.5 bg-[var(--theme-bg)] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500" 
                                style={{ width: `${Math.min((weather?.current.uvIndex || 0) * 10, 100)}%` }} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* Aesthetic Footer Note */}
      <div className="relative group overflow-hidden bg-gradient-to-r from-[var(--theme-accent-muted)]/5 to-transparent p-6 rounded-[2rem] border border-[var(--theme-border)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-800 shadow-sm">
                <Sun className="text-amber-500 animate-[spin_10s_linear_infinite]" size={24} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-[var(--theme-text)]">Weather Optimized Planning</h4>
                <p className="text-xs text-[var(--theme-text-muted)]">Outdoor sessions are best during moderate UV and clear skies. Plan ahead!</p>
            </div>
        </div>
        <button 
            onClick={() => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
                        () => setError('Location access denied')
                    );
                }
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--theme-accent-muted)] transition-all active:scale-95 shadow-sm"
        >
            <Navigation size={12} /> Refresh Location
        </button>
      </div>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="text-sm font-bold uppercase tracking-widest leading-none">Note:</span>
            <span className="text-xs font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-white/70 hover:text-white ml-2">×</button>
        </div>
      )}
    </div>
  );
}
