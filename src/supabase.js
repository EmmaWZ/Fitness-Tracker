// supabase.js — lightweight Supabase client (no SDK needed)

const SUPABASE_URL = "https://crvdgmdznwgmeqbinnrg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydmRnbWR6bndnbWVxYmlubnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDU4OTIsImV4cCI6MjA5NDQ4MTg5Mn0.ngLhHznn-XvTn06IPyFU3dLsGU2yj0LhJeaaY0TO08A";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

// Load all data for a user
export async function loadData(userId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/fitness_data?user_id=eq.${encodeURIComponent(userId)}&select=data`,
    { headers }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows.length > 0 ? rows[0].data : null;
}

// Save all data for a user (upsert)
export async function saveData(userId, data) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/fitness_data`,
    {
      method: "POST",
      headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: userId,
        data,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  return res.ok;
}
