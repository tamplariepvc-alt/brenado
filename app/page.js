"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== "https://PROJECT_ID.supabase.co" &&
    SUPABASE_ANON_KEY !== "PUBLIC_ANON_KEY"
);

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
  
const TASK_PHOTOS_BUCKET = "task-photos";

async function uploadTaskPhoto(file) {
  if (!supabase || !file) return "";

  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const filePath = `tasks/${fileName}`;

  const { error } = await supabase.storage
    .from(TASK_PHOTOS_BUCKET)
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from(TASK_PHOTOS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function uploadTaskPhotos(files) {
  if (!files || files.length === 0) return [];
  const uploaded = [];

  for (const file of files) {
    const url = await uploadTaskPhoto(file);
    if (url) uploaded.push(url);
  }

  return uploaded;
}

const statusStyles = {
  Noua: "bg-blue-100 text-blue-700 border-blue-200",
  "In lucru": "bg-amber-100 text-amber-700 border-amber-200",
  Finalizata: "bg-green-100 text-green-700 border-green-200",
};

const statusOptions = ["Noua", "In lucru", "Finalizata"];

const demoTasks = [
  {
    id: 1,
    title: "Montaj ferestre - Str. Lalelelor 12",
    description: "Montaj 4 ferestre PVC si 1 usa balcon.",
    notes: "Clientul a confirmat programarea pentru ora 10:00.",
    photo_url: "",
    final_photo_urls: [],
    status: "Noua",
    deadline: "2026-03-24",
    assigned_name: "Andrei",
    profiles: { full_name: "Administrator" },
  },
  {
    id: 2,
    title: "Masuratori client Popescu",
    description: "Masuratori pentru oferta tamplarie PVC.",
    notes: "Se verifica si balconul inchis.",
    photo_url: "",
    final_photo_urls: [],
    status: "In lucru",
    deadline: "2026-03-25",
    assigned_name: "Mihai",
    profiles: { full_name: "Administrator" },
  },
];

function formatDate(value) {
  if (!value) return "Fara termen";
  const date = new Date(value);
  return new Intl.DateTimeFormat("ro-RO").format(date);
}

function LoginScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const LOGO_URL = "/logo.png";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) throw error;

        const userId = data.user?.id;
        if (userId) {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: fullName,
            role: "admin",
          });
        }

        setMessage("Cont creat cu succes. Acum te poti autentifica.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onAuth?.();
      }
    } catch (error) {
      setMessage(error.message || "A aparut o eroare.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-md">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <img src={LOGO_URL} alt="Logo" className="h-16 object-contain" />
            </div>
            <p className="text-sm uppercase tracking-wide text-slate-500"></p>
            <h1 className="mt-1 text-2xl font-bold">GESTIUNE SARCINI TAMPLARIE</h1>
            <p className="mt-2 text-sm text-slate-600">
              Administrare si vizualizare sarcini in timp real
            </p>
          </div>

          <div className="mt-6 flex rounded-2xl bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-xl px-4 py-2 ${mode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-xl px-4 py-2 ${mode === "signup" ? "bg-white shadow-sm" : "text-slate-500"}`}
            >
              Inregistrare
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Nume complet</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                  placeholder="Ex: Andrei Popescu"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="nume@firma.ro"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Parola</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="••••••••"
              />
            </label>

            {message && (
              <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>
            )}

            <button
              disabled={loading || !isSupabaseConfigured}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Se proceseaza..." : mode === "login" ? "Intra in cont" : "Creeaza cont"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TaskForm({ onCreate, creating }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedName, setAssignedName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    await onCreate({
      title,
      description,
      assigned_name: assignedName,
      deadline,
      notes,
      photo_url: photoUrl,
      status: "Noua",
    });

    setTitle("");
    setDescription("");
    setAssignedName("");
    setDeadline("");
    setNotes("");
    setPhotoUrl("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold">Adauga sarcina</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        placeholder="Titlu sarcina"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[96px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        placeholder="Descriere"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          value={assignedName}
          onChange={(e) => setAssignedName(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          placeholder="Responsabil"
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[80px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        placeholder="Notite initiale"
      />
      <input
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        placeholder="Link poza (optional)"
      />
      <button
        disabled={creating}
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {creating ? "Se salveaza..." : "Salveaza sarcina"}
      </button>
    </form>
  );
}

function TaskCard({ task, onUpdateStatus, onSaveDetails }) {
  const galleryImages = [
    ...(task.photo_url
      ? [{ url: task.photo_url, label: "Poza principala" }]
      : []),
    ...((Array.isArray(task.final_photo_urls) ? task.final_photo_urls : []).map(
      (url, index) => ({
        url,
        label: `Poza finalizare ${index + 1}`,
      })
    )),
  ];

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const [photoUrl, setPhotoUrl] = useState(task.photo_url || "");
  const [saving, setSaving] = useState(false);

  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newPhotoName, setNewPhotoName] = useState("");

  const [completionFiles, setCompletionFiles] = useState([]);
  const [completionNames, setCompletionNames] = useState([]);
  const [uploadingCompletion, setUploadingCompletion] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  function openGallery(startIndex = 0) {
    setGalleryIndex(startIndex);
    setIsGalleryOpen(true);
  }

  function closeGallery() {
    setIsGalleryOpen(false);
  }

  function showPrevImage() {
    setGalleryIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  }

  function showNextImage() {
    setGalleryIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  }

  useEffect(() => {
    setNotes(task.notes || "");
    setPhotoUrl(task.photo_url || "");
    setNewPhotoFile(null);
    setNewPhotoName("");
    setCompletionFiles([]);
    setCompletionNames([]);
    setUploadSuccess("");
  }, [task.notes, task.photo_url, task.final_photo_urls]);

  async function handleSave() {
    setSaving(true);

    let finalPhotoUrl = photoUrl;

    try {
      if (newPhotoFile) {
        finalPhotoUrl = await uploadTaskPhoto(newPhotoFile);
      }

      await onSaveDetails(task.id, {
        notes,
        photo_url: finalPhotoUrl,
      });

      setIsEditing(false);
      setNewPhotoFile(null);
      setNewPhotoName("");
    } catch (error) {
      alert(error.message || "Modificarile nu au putut fi salvate.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadCompletionPhotos() {
    if (!completionFiles.length) return;

    setUploadingCompletion(true);
    setUploadSuccess("");

    try {
      const uploadedUrls = await uploadTaskPhotos(completionFiles);
      const existingUrls = Array.isArray(task.final_photo_urls)
        ? task.final_photo_urls
        : [];

      await onSaveDetails(task.id, {
        final_photo_urls: [...existingUrls, ...uploadedUrls],
      });

      setCompletionFiles([]);
      setCompletionNames([]);
      setUploadSuccess("Incarcat cu succes");
    } catch (error) {
      alert(error.message || "Pozele nu au putut fi incarcate.");
      console.error(error);
    } finally {
      setUploadingCompletion(false);
    }
  }
async function handleDeleteFinalPhoto(indexToDelete) {
  try {
    const updatedUrls = (task.final_photo_urls || []).filter(
      (_, index) => index !== indexToDelete
    );

    await onSaveDetails(task.id, {
      final_photo_urls: updatedUrls,
    });

    setUploadSuccess("Poza a fost stearsa");
  } catch (error) {
    alert("Nu s-a putut sterge poza.");
    console.error(error);
  }
}

  function removeCompletionFile(indexToRemove) {
    setCompletionFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    setCompletionNames((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  }

const hasFinalPhotos =
  Array.isArray(task.final_photo_urls) &&
  task.final_photo_urls.length > 0;

  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">{task.title}</h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            statusStyles[task.status] || statusStyles.Noua
          }`}
        >
          {task.status}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {task.description || "Fara descriere"}
      </p>

      {task.photo_url && (
        <button
          type="button"
          onClick={() => openGallery(0)}
          className="mt-4 block w-full overflow-hidden rounded-2xl border border-slate-200 text-left"
        >
          <img
            src={task.photo_url}
            alt="Poza sarcina"
            className="h-48 w-full object-cover"
          />
        </button>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Responsabil</div>
          <div className="mt-1 font-medium">
            {task.assigned_name || "Neatribuit"}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Termen</div>
          <div className="mt-1 font-medium">{formatDate(task.deadline)}</div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
        <div className="mb-1 text-xs text-slate-500">Notite</div>
        <div>{task.notes || "Nu exista notite."}</div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Creat de: {task.profiles?.full_name || "Necunoscut"}
      </div>

{hasFinalPhotos && (
  <div className="mt-4 rounded-2xl border border-slate-200 p-3">
    <div className="mb-2 text-sm font-semibold text-slate-900">
      Poze lucrare finalizata
    </div>

    <div className="grid grid-cols-2 gap-2">
      {task.final_photo_urls.slice(0, 2).map((url, index) => {
        const startIndex = task.photo_url ? index + 1 : index;
        const isSecondImageWithMore =
          index === 1 && task.final_photo_urls.length > 2;
        const extraCount = task.final_photo_urls.length - 2;

        return (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => openGallery(startIndex)}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          >
            <img
              src={url}
              alt={`Finalizare ${index + 1}`}
              className="h-28 w-full object-cover"
            />

            {isSecondImageWithMore && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                +{extraCount} mai multe
              </div>
            )}
          </button>
        );
      })}
    </div>
  </div>
)}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {task.status === "Noua" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(task.id, "In lucru")}
            className="col-span-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Trece in lucru
          </button>
        )}

        {task.status === "In lucru" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(task.id, "Finalizata")}
            className="col-span-3 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Inchide sarcina
          </button>
        )}

        {task.status === "Finalizata" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(task.id, "In lucru")}
            className="col-span-3 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Redeschide sarcina
          </button>
        )}
      </div>

{!hasFinalPhotos && (
  <div className="mt-4 rounded-2xl border border-slate-200 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Poze lucrare finalizata
          </div>

          <div className="mt-3 space-y-3">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setCompletionFiles(files);
                setCompletionNames(files.map((file) => file.name));
                setUploadSuccess("");
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />

            {completionFiles.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {completionFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-28 w-full object-cover"
                      />
                      <div className="flex items-center justify-between gap-2 p-2">
                        <p className="truncate text-xs text-slate-500">
                          {file.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeCompletionFile(index)}
                          className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-600"
                        >
                          Sterge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleUploadCompletionPhotos}
              disabled={uploadingCompletion || completionFiles.length === 0}
              className="w-full rounded-2xl bg-[#009c5b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {uploadingCompletion
                ? "Se incarca pozele..."
                : "Incarca poze finalizare"}
            </button>

            {uploadSuccess && (
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {uploadSuccess}
              </div>
            )}
          </div>
        </div>
      )}

{!hasFinalPhotos && (
  <div className="mt-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            {isEditing ? "Ascunde editare" : "Editeaza notite"}
          </button>
        </div>
      )}

      {isEditing && (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 p-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            placeholder="Scrie notite despre lucrare"
          />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Schimba poza principala
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setNewPhotoFile(file);
                setNewPhotoName(file?.name || "");
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            {newPhotoName && (
              <p className="mt-2 text-xs text-slate-500">
                Selectata: {newPhotoName}
              </p>
            )}
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Se salveaza..." : "Salveaza modificarile"}
          </button>
        </div>
      )}

      {isGalleryOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={closeGallery}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Inchide
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-xl font-bold text-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-xl font-bold text-white"
              >
                ›
              </button>
            </>
          )}

          <div className="w-full max-w-3xl text-center">
            <div className="mb-3 text-sm font-medium text-white">
              {galleryImages[galleryIndex]?.label} · {galleryIndex + 1}/
              {galleryImages.length}
            </div>

            <div className="overflow-auto rounded-3xl bg-black/20 p-2">
              <img
                src={galleryImages[galleryIndex]?.url}
                alt={galleryImages[galleryIndex]?.label || "Poza"}
                className="mx-auto max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
              />
            </div>

            <p className="mt-3 text-xs text-slate-300">
              Pe telefon poti face zoom cu gestul de apropiere/departare.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState(isSupabaseConfigured ? [] : demoTasks);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("taskuri");
  const [statusFilter, setStatusFilter] = useState("Toate");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  async function loadProfile() {
    if (!supabase || !session?.user?.id) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    setProfile(data || null);
  }

  async function loadUsers() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setUsers(data || []);
  }

  async function loadTasks() {
    if (!supabase) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        profiles:created_by (
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Eroare loadTasks:", error);
      alert(error.message);
    } else {
      setTasks(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!supabase) return;

    loadProfile();
    loadTasks();
    loadUsers();

    const channel = supabase
      .channel("taskuri-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadTasks();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          loadUsers();
          loadProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  async function createTask(payload) {
    if (profile?.role !== "admin") {
      alert("Doar administratorul poate crea sarcini.");
      return;
    }

    if (!supabase) {
      setTasks((prev) => [
        { id: Date.now(), ...payload, profiles: { full_name: "Demo" } },
        ...prev,
      ]);
      return;
    }

    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

const { error } = await supabase.from("tasks").insert({
  ...payload,
  final_photo_urls: [],
  created_by: user?.id || null,
});

    if (error) {
      alert(error.message);
      console.error(error);
    }

    setCreating(false);
  }

  async function updateStatus(taskId, nextStatus) {
    if (!supabase) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: nextStatus } : task
        )
      );
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", taskId);

    if (error) {
      alert(error.message);
      console.error(error);
    }
  }

async function saveTaskDetails(taskId, details) {
  if (!supabase) {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...details } : task))
    );
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .update(details)
    .eq("id", taskId);

  if (error) {
    alert(error.message);
    console.error(error);
    return;
  }

  setTasks((prev) =>
    prev.map((task) => (task.id === taskId ? { ...task, ...details } : task))
  );
}

  async function updateUserRole(userId, nextRole) {
    if (profile?.role !== "admin") return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      console.error(error);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "Toate" || task.status === statusFilter;
      const haystack = `${task.title || ""} ${task.description || ""} ${task.assigned_name || ""} ${task.notes || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, search, statusFilter]);

  const showTaskArea = !(profile?.role === "admin" && activeTab === "useri");

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-900">
      <div className="mx-auto max-w-md px-4 pt-4">
        <header className="mb-4 border-b border-slate-200 bg-white p-5">
<div className="flex items-center justify-between gap-3">

  {/* STANGA */}
  <div className="flex items-center gap-3">

    <img
      src="/logo.png"
      alt="Logo"
      className="h-8 w-auto object-contain"
    />

    <div className="flex flex-col justify-center">
      <p className="text-base font-semibold text-slate-900 leading-tight">
        {profile?.full_name || "Utilizator"}
      </p>

      <p className="text-xs text-slate-500">
        {profile?.role === "admin" ? "Administrator" : "Utilizator"}
      </p>
    </div>

  </div>

  {/* DREAPTA */}
  <button
    onClick={signOut}
    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
  >
    Iesire
  </button>

</div>
        </header>

        <section className="mb-4 rounded-[2rem] bg-[#009c5b] p-4 text-white shadow-sm">
          <h2 className="text-2xl font-bold">Sarcini in timp real</h2>
          <p className="mt-2 text-sm text-slate-300">
            {profile?.role === "admin"
              ? "Gestioneaza sarcinile si utilizatorii dintr-un panou curat si usor de folosit."
              : "Vezi si gestioneaza sarcinile in timp real."}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-lg font-bold">{tasks.length}</div>
              <div className="text-xs text-slate-300">Total</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-lg font-bold">{tasks.filter((t) => t.status === "In lucru").length}</div>
              <div className="text-xs text-slate-300">In lucru</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-lg font-bold">{tasks.filter((t) => t.status === "Finalizata").length}</div>
              <div className="text-xs text-slate-300">Finalizate</div>
            </div>
          </div>
        </section>

        {profile?.role === "admin" && (
          <section className="mb-4 rounded-3xl bg-white p-2 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("taskuri")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  activeTab === "taskuri" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                Sarcini
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("adauga")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  activeTab === "adauga" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                Adauga
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("useri")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  activeTab === "useri" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                Utilizatori
              </button>
            </div>
          </section>
        )}

        {profile?.role === "admin" && activeTab === "adauga" && (
          <div className="mb-4">
            <TaskForm onCreate={createTask} creating={creating} />
          </div>
        )}

        {profile?.role === "admin" && activeTab === "useri" && (
          <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">Panou control utilizatori</h3>
              <p className="mt-1 text-sm text-slate-500">
                Schimba rolul fiecarui utilizator direct din aplicatie.
              </p>
            </div>

            <div className="space-y-3">
              {users.map((userItem) => (
                <div key={userItem.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{userItem.full_name || "Fara nume"}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        Rol curent: {userItem.role === "admin" ? "Admin" : "User"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateUserRole(userItem.id, "admin")}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                          userItem.role === "admin" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => updateUserRole(userItem.id, "user")}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                          userItem.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showTaskArea && (
          <>
            <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <span className="text-slate-400">🔎</span>
                <input
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
              {loading && (
                <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  Se incarca taskurile...
                </div>
              )}

              {!loading && filteredTasks.length === 0 && (
                <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  Nu exista taskuri pentru filtrul selectat.
                </div>
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
          </>
        )}
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