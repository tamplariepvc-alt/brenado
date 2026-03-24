"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const isSupabaseConfigured = Boolean(
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Cauta dupa lucrare, descriere, responsabil sau notite"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {["Toate", ...statusOptions].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  statusFilter === status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {loading && <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">Se incarca taskurile...</div>}

          {!loading && filteredTasks.length === 0 && (
            <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">Nu exista taskuri pentru filtrul selectat.</div>
          )}

          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={updateStatus}
              onSaveDetails={saveTaskDetails}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-sm text-slate-600">
        Se verifica autentificarea...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onAuth={() => null} />;
  }

  return <Dashboard session={session} />;
}
