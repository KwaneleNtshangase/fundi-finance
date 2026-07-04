import { supabase } from "@/lib/supabaseClient";

export function useProfileHandlers() {
  const handleProfileSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("fundi-")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      window.location.href = "/";
    }
  };

  const handleDownloadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const lsData: Record<string, string> = {};
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("fundi-")) lsData[k] = localStorage.getItem(k) ?? "";
      }
    }
    let profileData: Record<string, unknown> = {};
    let progressData: Record<string, unknown> = {};
    if (user) {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) profileData = p as Record<string, unknown>;
      if (pr) progressData = pr as Record<string, unknown>;
    }
    const exportPayload = {
      exportDate: new Date().toISOString(),
      exportNote: "Your Fundi Finance data export - requested under POPIA Section 23 (Right of Access)",
      account: { email: user?.email ?? "guest" },
      profile: profileData,
      progress: progressData,
      localStorageSnapshot: lsData,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fundi-finance-data-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (typeof window === "undefined") return;
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? This will permanently erase all your progress, streaks, badges, and personal data. This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // We call the edge function directly since Supabase client doesn't allow self-deletion by default
      const res = await fetch("/api/admin/deleteUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to delete account");
      
      await handleProfileSignOut();
    } catch (e) {
      console.error("Account deletion error:", e);
      alert("There was an error deleting your account. Please try again or contact support.");
    }
  };

  return {
    handleProfileSignOut,
    handleDownloadData,
    handleDeleteAccount,
  };
}
