import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut, LayoutDashboard, Code2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">NPL Rankings</span>
            <span className="inline xs:hidden sm:hidden">NPL</span>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-wrap justify-end">
            <Link to="/rankings">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">Rankings</Button>
            </Link>
            <Link to="/how-it-works" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">How It Works</Button>
            </Link>
            
            {user ? (
              <>
                {isAdmin && (
                  <>
                    <Link to="/admin" className="hidden md:block">
                      <Button variant="outline" size="sm">
                        <LayoutDashboard className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden lg:inline">Admin Dashboard</span>
                        <span className="lg:hidden">Admin</span>
                      </Button>
                    </Link>
                    <Link to="/widget/embed-guide" className="hidden lg:block">
                      <Button variant="outline" size="sm">
                        <Code2 className="mr-2 h-4 w-4" />
                        Widget Embeds
                      </Button>
                    </Link>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-4">
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
