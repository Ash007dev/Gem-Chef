import { CountryInfo, Region } from './worldwide-types';

// Comprehensive list of countries for worldwide food exploration
export const COUNTRIES: CountryInfo[] = [
    // Asia
    { name: 'Japan', code: 'JP', flag: '🇯🇵', region: 'Asia', cuisine: 'Japanese', description: 'Refined, seasonal, umami-rich', popular: true },
    { name: 'China', code: 'CN', flag: '🇨🇳', region: 'Asia', cuisine: 'Chinese', description: 'Diverse regional styles, wok cooking', popular: true },
    { name: 'Thailand', code: 'TH', flag: '🇹🇭', region: 'Asia', cuisine: 'Thai', description: 'Sweet, sour, spicy, aromatic', popular: true },
    { name: 'India', code: 'IN', flag: '🇮🇳', region: 'Asia', cuisine: 'Indian', description: 'Spice-forward, diverse curries', popular: true },
    { name: 'South Korea', code: 'KR', flag: '🇰🇷', region: 'Asia', cuisine: 'Korean', description: 'Fermented flavors, BBQ, kimchi', popular: true },
    { name: 'Vietnam', code: 'VN', flag: '🇻🇳', region: 'Asia', cuisine: 'Vietnamese', description: 'Fresh herbs, pho, balanced flavors' },
    { name: 'Indonesia', code: 'ID', flag: '🇮🇩', region: 'Asia', cuisine: 'Indonesian', description: 'Spicy, coconut-rich, satay' },
    { name: 'Malaysia', code: 'MY', flag: '🇲🇾', region: 'Asia', cuisine: 'Malaysian', description: 'Multicultural fusion, laksa, rendang' },
    { name: 'Philippines', code: 'PH', flag: '🇵🇭', region: 'Asia', cuisine: 'Filipino', description: 'Sweet-savory, adobo, sinigang' },
    { name: 'Singapore', code: 'SG', flag: '🇸🇬', region: 'Asia', cuisine: 'Singaporean', description: 'Hawker culture, fusion cuisine' },
    { name: 'Lebanon', code: 'LB', flag: '🇱🇧', region: 'Asia', cuisine: 'Lebanese', description: 'Mezze, grilled meats, fresh herbs' },
    { name: 'Israel', code: 'IL', flag: '🇮🇱', region: 'Asia', cuisine: 'Israeli', description: 'Mediterranean, shakshuka, falafel' },

    // Europe
    { name: 'Italy', code: 'IT', flag: '🇮🇹', region: 'Europe', cuisine: 'Italian', description: 'Pasta, pizza, regional specialties', popular: true },
    { name: 'France', code: 'FR', flag: '🇫🇷', region: 'Europe', cuisine: 'French', description: 'Refined techniques, sauces, pastries', popular: true },
    { name: 'Spain', code: 'ES', flag: '🇪🇸', region: 'Europe', cuisine: 'Spanish', description: 'Tapas, paella, olive oil-based' },
    { name: 'Greece', code: 'GR', flag: '🇬🇷', region: 'Europe', cuisine: 'Greek', description: 'Mediterranean, feta, olive oil' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪', region: 'Europe', cuisine: 'German', description: 'Hearty, sausages, beer-friendly' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', region: 'Europe', cuisine: 'British', description: 'Comfort food, roasts, pies' },
    { name: 'Turkey', code: 'TR', flag: '🇹🇷', region: 'Europe', cuisine: 'Turkish', description: 'Kebabs, mezze, Ottoman influences' },
    { name: 'Portugal', code: 'PT', flag: '🇵🇹', region: 'Europe', cuisine: 'Portuguese', description: 'Seafood, bacalhau, pastéis' },
    { name: 'Poland', code: 'PL', flag: '🇵🇱', region: 'Europe', cuisine: 'Polish', description: 'Pierogi, hearty stews, dumplings' },
    { name: 'Russia', code: 'RU', flag: '🇷🇺', region: 'Europe', cuisine: 'Russian', description: 'Borscht, blini, cold-weather fare' },
    { name: 'Sweden', code: 'SE', flag: '🇸🇪', region: 'Europe', cuisine: 'Swedish', description: 'Meatballs, pickled fish, fika' },
    { name: 'Ireland', code: 'IE', flag: '🇮🇪', region: 'Europe', cuisine: 'Irish', description: 'Stews, soda bread, potatoes' },

    // Americas
    { name: 'Mexico', code: 'MX', flag: '🇲🇽', region: 'Americas', cuisine: 'Mexican', description: 'Tacos, mole, vibrant flavors', popular: true },
    { name: 'United States', code: 'US', flag: '🇺🇸', region: 'Americas', cuisine: 'American', description: 'BBQ, burgers, regional diversity', popular: true },
    { name: 'Brazil', code: 'BR', flag: '🇧🇷', region: 'Americas', cuisine: 'Brazilian', description: 'Churrasco, feijoada, tropical' },
    { name: 'Argentina', code: 'AR', flag: '🇦🇷', region: 'Americas', cuisine: 'Argentine', description: 'Beef, empanadas, chimichurri' },
    { name: 'Peru', code: 'PE', flag: '🇵🇪', region: 'Americas', cuisine: 'Peruvian', description: 'Ceviche, potatoes, Andean fusion' },
    { name: 'Colombia', code: 'CO', flag: '🇨🇴', region: 'Americas', cuisine: 'Colombian', description: 'Arepas, bandeja paisa, coffee' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦', region: 'Americas', cuisine: 'Canadian', description: 'Poutine, maple, multicultural' },
    { name: 'Jamaica', code: 'JM', flag: '🇯🇲', region: 'Americas', cuisine: 'Jamaican', description: 'Jerk, curry, island spices' },
    { name: 'Cuba', code: 'CU', flag: '🇨🇺', region: 'Americas', cuisine: 'Cuban', description: 'Ropa vieja, rice & beans, mojitos' },
    { name: 'Chile', code: 'CL', flag: '🇨🇱', region: 'Americas', cuisine: 'Chilean', description: 'Seafood, empanadas, wine country' },

    // Africa
    { name: 'Morocco', code: 'MA', flag: '🇲🇦', region: 'Africa', cuisine: 'Moroccan', description: 'Tagines, couscous, aromatic spices' },
    { name: 'Ethiopia', code: 'ET', flag: '🇪🇹', region: 'Africa', cuisine: 'Ethiopian', description: 'Injera, wats, communal dining' },
    { name: 'South Africa', code: 'ZA', flag: '🇿🇦', region: 'Africa', cuisine: 'South African', description: 'Braai, bobotie, diverse influences' },
    { name: 'Egypt', code: 'EG', flag: '🇪🇬', region: 'Africa', cuisine: 'Egyptian', description: 'Koshari, ful medames, ancient flavors' },
    { name: 'Nigeria', code: 'NG', flag: '🇳🇬', region: 'Africa', cuisine: 'Nigerian', description: 'Jollof rice, suya, bold spices' },
    { name: 'Tunisia', code: 'TN', flag: '🇹🇳', region: 'Africa', cuisine: 'Tunisian', description: 'Harissa, couscous, Mediterranean-African' },
    { name: 'Kenya', code: 'KE', flag: '🇰🇪', region: 'Africa', cuisine: 'Kenyan', description: 'Nyama choma, ugali, Swahili coast' },

    // Oceania
    { name: 'Australia', code: 'AU', flag: '🇦🇺', region: 'Oceania', cuisine: 'Australian', description: 'BBQ, seafood, modern fusion' },
    { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', region: 'Oceania', cuisine: 'New Zealand', description: 'Lamb, Māori hangi, fresh produce' },
];

// Region filter options
export const REGIONS: (Region | 'All')[] = ['All', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'];

// Helper functions
export function getCountryByCode(code: string): CountryInfo | undefined {
    return COUNTRIES.find(c => c.code === code);
}

export function getCountriesByRegion(region: Region | 'All'): CountryInfo[] {
    if (region === 'All') return COUNTRIES;
    return COUNTRIES.filter(c => c.region === region);
}

export function getPopularCountries(): CountryInfo[] {
    return COUNTRIES.filter(c => c.popular);
}

export function searchCountries(query: string): CountryInfo[] {
    const lowerQuery = query.toLowerCase();
    return COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.cuisine.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery)
    );
}
