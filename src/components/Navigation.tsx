import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Code2, Menu, UserPlus, Trophy, Users, Info, User as UserIcon, Calendar } from "lucide-react";
import nplLogo from "@/assets/npl-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0">
            <img src={nplLogo} alt="NPL Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
          </Link>
          
          {/* Center: Title */}
          <h1 className="text-sm sm:text-lg md:text-xl font-bold font-heading text-foreground whitespace-nowrap flex-shrink truncate">
            Pickleball Rankings
          </h1>
          
          {/* Right: Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
            <ThemeToggle />
            
            {/* Rankings - always visible */}
            <Link to="/rankings" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">Rankings</Button>
            </Link>
            
            {/* Desktop Navigation - hidden on mobile/tablet */}
            <Link to="/tournaments" className="hidden lg:block">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">Tournaments</Button>
            </Link>
            <Link to="/players" className="hidden lg:block">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">Players</Button>
            </Link>
            <Link to="/how-it-works" className="hidden lg:block">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">How It Works</Button>
            </Link>
            
            {user ? (
              <>
                {isAdmin ? (
                  <>
                    <Link to="/admin" className="hidden lg:block">
                      <Button variant="outline" size="sm">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                    <Link to="/widget/embed-guide" className="hidden lg:block">
                      <Button variant="outline" size="sm">
                        <Code2 className="mr-2 h-4 w-4" />
                        Widget Embeds
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden lg:flex text-xs sm:text-sm px-2 sm:px-4">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/player/profile" className="hidden lg:block">
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                        My Profile
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden lg:flex text-xs sm:text-sm px-2 sm:px-4">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/player/claim" className="hidden lg:block">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Claim Profile
                  </Button>
                </Link>
                <Link to="/auth" className="hidden lg:block">
                  <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">Sign In</Button>
                </Link>
              </>
            )}
            
            {/* Universal Mobile Menu - visible on mobile/tablet */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-6">
                  {/* Common Navigation Items */}
                  <Link to="/rankings" onClick={() => setIsMenuOpen(false)} className="sm:hidden">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Trophy className="mr-2 h-4 w-4" />
                      Rankings
                    </Button>
                  </Link>
                  <Link to="/tournaments" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Tournaments
                    </Button>
                  </Link>
                  <Link to="/players" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Players
                    </Button>
                  </Link>
                  <Link to="/how-it-works" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Info className="mr-2 h-4 w-4" />
                      How It Works
                    </Button>
                  </Link>
                  
                  {user ? (
                    <>
                      {isAdmin && (
                        <>
                          <Separator className="my-2" />
                          <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </Button>
                          </Link>
                          <Link to="/widget/embed-guide" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <Code2 className="mr-2 h-4 w-4" />
                              Widget Embeds
                            </Button>
                          </Link>
                        </>
                      )}
                      {!isAdmin && (
                        <>
                          <Separator className="my-2" />
                          <Link to="/player/profile" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <UserIcon className="mr-2 h-4 w-4" />
                              My Profile
                            </Button>
                          </Link>
                        </>
                      )}
                      <Separator className="my-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }} 
                        className="w-full justify-start"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Separator className="my-2" />
                      <Link to="/player/claim" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Claim Profile
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        <Button size="sm" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
