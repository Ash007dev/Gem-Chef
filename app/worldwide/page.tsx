'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Globe, TrendingUp, MapPin } from 'lucide-react';
import { COUNTRIES, REGIONS, getCountriesByRegion, searchCountries, getPopularCountries } from '@/utils/worldwide-data';
import type { Region, CountryInfo } from '@/utils/worldwide-types';

// Helper to get region color
const getRegionColor = (region: string) => {
    switch (region) {
        case 'Asia': return 'text-red-400 bg-red-500/10';
        case 'Europe': return 'text-blue-400 bg-blue-500/10';
        case 'Americas': return 'text-green-400 bg-green-500/10';
        case 'Africa': return 'text-yellow-400 bg-yellow-500/10';
        case 'Oceania': return 'text-purple-400 bg-purple-500/10';
        default: return 'text-gray-400 bg-gray-500/10';
    }
};

export default function WorldwidePage() {
    const router = useRouter();
    const [selectedRegion, setSelectedRegion] = useState<Region | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCountries, setFilteredCountries] = useState<CountryInfo[]>(COUNTRIES);

    // Handle region filter
    const handleRegionChange = (region: Region | 'All') => {
        setSelectedRegion(region);
        setSearchQuery('');
        setFilteredCountries(getCountriesByRegion(region));
    };

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredCountries(getCountriesByRegion(selectedRegion));
        } else {
            const results = searchCountries(query);
            setFilteredCountries(
                selectedRegion === 'All'
                    ? results
                    : results.filter(c => c.region === selectedRegion)
            );
        }
    };

    const popularCountries = getPopularCountries();

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => router.back()} className="text-gray-400">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-8 h-8 text-white" />
                    <h1 className="text-3xl font-bold text-white">What's Cooking Worldwide</h1>
                </div>
                <p className="text-gray-500 text-sm">Explore authentic dishes from around the world</p>
            </header>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search countries or cuisines..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                    />
                </div>
            </div>

            {/* Region Filters */}
            <div className="mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {REGIONS.map((region) => (
                        <button
                            key={region}
                            onClick={() => handleRegionChange(region)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedRegion === region
                                ? 'bg-white text-black'
                                : 'bg-dark-card text-gray-400 border border-dark-border'
                                }`}
                        >
                            {region}
                        </button>
                    ))}
                </div>
            </div>

            {/* Popular Countries Section */}
            {selectedRegion === 'All' && searchQuery === '' && (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-semibold text-white">Popular Cuisines</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {popularCountries.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => router.push(`/worldwide/${country.code.toLowerCase()}`)}
                                className="bg-gradient-to-br from-dark-card to-dark-elevated border border-dark-border rounded-xl p-4 text-left hover:border-white transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-full ${getRegionColor(country.region)} flex items-center justify-center mb-3`}>
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white mb-1 group-hover:text-white transition-colors">
                                    {country.name}
                                </h3>
                                <p className="text-xs text-gray-500">{country.description}</p>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* All Countries Grid */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">
                    {searchQuery ? `Results for "${searchQuery}"` : selectedRegion === 'All' ? 'All Countries' : `${selectedRegion} Cuisines`}
                </h2>

                {filteredCountries.length === 0 ? (
                    <div className="text-center py-12">
                        <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">No countries found</p>
                        <p className="text-gray-600 text-sm mt-1">Try a different search or region</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredCountries.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => router.push(`/worldwide/${country.code.toLowerCase()}`)}
                                className="bg-dark-card border border-dark-border rounded-xl p-4 text-left hover:border-gray-500 transition-all"
                            >
                                <div className={`w-10 h-10 rounded-full ${getRegionColor(country.region)} flex items-center justify-center mb-2`}>
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <h3 className="font-medium text-white mb-1">{country.name}</h3>
                                <p className="text-xs text-gray-600">{country.cuisine}</p>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
