import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { CategoryPanel } from "@/components/rankings/CategoryPanel";
import { useAllTimeRankingsByCategory, useCurrentRankingsByCategory } from "@/hooks/useRankings";

const categoryLabels: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mixed_doubles: "Mixed Doubles",
};

export default function Rankings() {
  const [viewMode, setViewMode] = useState<'current' | 'lifetime'>('current');
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [currentCategory, setCurrentCategory] = useState<string>("mens_singles");

  // Fetch only the active category to build the country list and avoid global 1000-row caps
  const { data: currentCategoryData } = useCurrentRankingsByCategory(currentCategory);
  const { data: lifetimeCategoryData } = useAllTimeRankingsByCategory(currentCategory);
  const categoryDataset = viewMode === 'current' ? currentCategoryData : lifetimeCategoryData;

  // Get unique countries based on the active category dataset
  const countries = useMemo(() => {
    const list = categoryDataset || [];
    const uniqueCountries = new Set(
      list
        .map((p) => p.country)
        .filter((country): country is string => !!country)
    );
    return Array.from(uniqueCountries).sort();
  }, [categoryDataset]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div 
        className="py-16 px-4"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-primary-foreground mb-4">
            NPL Rankings
          </h1>
          <p className="text-xl text-primary-foreground/90">
            Official National Pickleball League Player Rankings
          </p>
          <Link to="/how-it-works" className="inline-block mt-4">
            <p className="text-sm text-primary-foreground/80 hover:text-primary-foreground underline transition-colors">
              How do rankings work?
            </p>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          <div className="inline-flex rounded-lg border bg-muted p-1">
            <button
              onClick={() => setViewMode('current')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'current'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Current (12-month)
            </button>
            <button
              onClick={() => setViewMode('lifetime')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'lifetime'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All-Time
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentCategory === "mixed_doubles" && (
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Tabs defaultValue="mens_singles" className="w-full" onValueChange={setCurrentCategory}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs md:text-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categoryLabels).map(([key]) => (
            <TabsContent key={key} value={key}>
              <CategoryPanel
                category={key}
                viewMode={viewMode}
                selectedCountry={selectedCountry}
                selectedGender={selectedGender}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
