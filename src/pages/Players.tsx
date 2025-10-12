import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import { usePlayerSearch } from "@/hooks/usePlayerSearch";
import { Skeleton } from "@/components/ui/skeleton";

export default function Players() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: players, isLoading } = usePlayerSearch(searchTerm, true);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Players</h1>
          <p className="text-muted-foreground">Search and browse player profiles</p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, country, or player code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : players && players.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player: any) => (
              <Link key={player.id || player.player_id} to={`/player/${player.id || player.player_id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={player.avatar_url || ""} />
                        <AvatarFallback>
                          {player.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{player.name}</h3>
                        <p className="text-sm text-muted-foreground">{player.country}</p>
                        {player.player_code && (
                          <Badge variant="outline" className="mt-1">
                            {player.player_code}
                          </Badge>
                        )}
                        {player.total_points !== undefined && (
                          <p className="text-sm font-medium mt-1">
                            {player.total_points} points
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "No players found" : "Start searching"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try a different search term"
                : "Enter a name, country, or player code above"}
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
