
import { createClient } from '@supabase/supabase-js';
import { Route } from '../types';

const SUPABASE_URL = 'https://tkkzbfexmjfbkkgvhobr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qJQf0zgADD7L23nmnfdWNQ_kxPh8aiF'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => {
  const key = SUPABASE_ANON_KEY as string;
  return key.startsWith('sb_') && key.length > 20;
};

const normalizeCityName = (name: string) => name.trim().toLowerCase();

export const findCachedRoute = async (city: string): Promise<Route | null> => {
  if (!isSupabaseConfigured()) return null;
  const normalized = normalizeCityName(city);
  
  // Timeout wrapper to prevent hanging
  const fetchPromise = new Promise<Route | null>(async (resolve) => {
    try {
      const { data, error } = await supabase
        .from('public_routes')
        .select('route_data')
        .or(`city.eq."${city}",city.eq."${normalized}"`)
        .limit(1)
        .maybeSingle();

      if (error || !data) resolve(null);
      else resolve(data.route_data);
    } catch (e) {
      resolve(null);
    }
  });

  const timeoutPromise = new Promise<Route | null>((resolve) => 
    setTimeout(() => resolve(null), 3000) // 3 second max wait
  );

  return Promise.race([fetchPromise, timeoutPromise]);
};

export const cacheRoute = async (route: Route) => {
  if (!isSupabaseConfigured()) return;
  try {
    const normalized = normalizeCityName(route.city);
    
    // Check existance
    const { data: existingData } = await supabase
      .from('public_routes')
      .select('id')
      .eq('city', normalized)
      .maybeSingle();

    if (existingData) {
      await supabase
        .from('public_routes')
        .update({ route_data: route })
        .eq('id', existingData.id);
    } else {
      await supabase
        .from('public_routes')
        .insert([{ city: normalized, route_data: route }]);
    }
  } catch (e: any) {
    console.warn("Supabase cache fail", e);
  }
};

export const saveRouteToSupabase = async (route: Route, userId: string): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('saved_routes')
      .insert([{ route_data: route }])
      .select();

    if (error) throw error;
    return data?.[0]?.id || null;
  } catch (e: any) {
    return null;
  }
};

export const getSavedRoutesFromSupabase = async (userId: string): Promise<Route[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(item => ({
      ...item.route_data,
      id: item.id
    }));
  } catch (e: any) {
    return [];
  }
};

export const deleteRouteFromSupabase = async (id: string, userId: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('saved_routes').delete().eq('id', id);
  } catch (e) {}
};
