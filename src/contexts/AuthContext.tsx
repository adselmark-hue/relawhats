import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase';
import type { Profile, Organization, AppRole } from '@/lib/supabase-types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  organizationId: string | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signInWithFacebook: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refetchOrganization: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and organization data
  const fetchUserData = async (userId: string) => {
    try {
      console.log('Debug Auth: Fetching user data for:', userId);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('Debug Profile Fetch:', { userId, profileData, profileError });

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch organization membership (usando limit(1) para evitar erro com múltiplos registros)
      const { data: orgUserData, error: orgUserError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      console.log('Debug Org User Fetch:', { userId, orgUserData, orgUserError });

      if (orgUserData?.organization_id) {
        setOrganizationId(orgUserData.organization_id);

        // Fetch organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgUserData.organization_id)
          .maybeSingle();

        console.log('Debug Org Fetch:', { orgId: orgUserData.organization_id, orgData, orgError });

        if (orgData) {
          setOrganization(orgData as Organization);
        }
      } else {
        console.warn('Debug: No organization_users entry found for user:', userId);
        // Clear org state if no membership found
        setOrganizationId(null);
        setOrganization(null);
      }

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Debug Role Fetch:', { userId, roleData, roleError });

      if (roleData?.role) {
        setRole(roleData.role as AppRole);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Function to refetch organization data
  const refetchOrganization = async () => {
    if (!user?.id) return null;
    
    console.log('Debug: Refetching organization for user:', user.id);
    
    const { data: orgUserData, error } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Debug Org Refetch:', { userId: user.id, orgUserData, error });

    if (orgUserData?.organization_id) {
      setOrganizationId(orgUserData.organization_id);
      
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgUserData.organization_id)
        .maybeSingle();

      if (orgData) {
        setOrganization(orgData as Organization);
      }
      return orgUserData.organization_id;
    }
    return null;
  };

  useEffect(() => {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          setOrganizationId(null);
          setRole(null);
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signInWithFacebook = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganization(null);
    setOrganizationId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        organizationId,
        role,
        isLoading,
        signIn,
        signUp,
        signInWithFacebook,
        signOut,
        refetchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
