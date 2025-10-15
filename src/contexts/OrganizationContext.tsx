import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  organization_type: 'national' | 'international' | 'regional';
  logo_url?: string;
  primary_color?: string;
  country?: string;
  description?: string;
  website_url?: string;
  settings?: any;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  isLoading: boolean;
  organizations: Organization[];
  setCurrentOrgById: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at');

        if (error) throw error;

        setOrganizations(data || []);

        // Determine current organization based on hostname
        const hostname = window.location.hostname;
        let orgSlug = 'npl'; // Default fallback

        // Detection logic
        if (hostname.includes('gpa') || hostname.includes('global')) {
          orgSlug = 'gpa';
        } else if (hostname.includes('npl')) {
          orgSlug = 'npl';
        }

        // Try localStorage override (useful for development)
        const storedOrgSlug = localStorage.getItem('org_slug');
        if (storedOrgSlug && data?.some(org => org.slug === storedOrgSlug)) {
          orgSlug = storedOrgSlug;
        }

        const org = data?.find(o => o.slug === orgSlug) || data?.[0] || null;
        setCurrentOrg(org);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const setCurrentOrgById = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem('org_slug', org.slug);
    }
  };

  return (
    <OrganizationContext.Provider value={{ currentOrg, isLoading, organizations, setCurrentOrgById }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
