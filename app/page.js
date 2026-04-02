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
  Noua: "border-blue-200 bg-blue-50 text-blue-700",
  "In lucru": "border-orange-200 bg-orange-50 text-orange-700",
  Finalizata: "border-green-200 bg-green-50 text-green-700",
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

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getCalendarDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const days = [];

  for (let i = 0; i < startWeekday; i++) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

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

function TaskForm({ onCreate, creating, users }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedNames, setAssignedNames] = useState([]);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    await onCreate({
      title,
      description,
      assigned_names: assignedNames,
      assigned_name: assignedNames.join(", "),
      deadline,
      notes,
      photo_url: photoUrl,
      status: "Noua",
    });

    setTitle("");
    setDescription("");
    setAssignedNames([]);
    setShowUserSelect(false);
    setDeadline("");
    setNotes("");
    setPhotoUrl("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
    >
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

      <div className="grid grid-cols-1 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Responsabili
          </span>

          <button
            type="button"
            onClick={() => setShowUserSelect((prev) => !prev)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700"
          >
            {assignedNames.length > 0
              ? assignedNames.join(", ")
              : "Selecteaza responsabili"}
          </button>

          {showUserSelect && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow">
              {users?.length > 0 ? (
                users.map((userItem) => (
                  <label
                    key={userItem.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={assignedNames.includes(userItem.full_name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedNames((prev) => [
                            ...prev,
                            userItem.full_name,
                          ]);
                        } else {
                          setAssignedNames((prev) =>
                            prev.filter(
                              (name) => name !== userItem.full_name
                            )
                          );
                        }
                      }}
                    />
                    <span className="text-sm text-slate-700">
                      {userItem.full_name || "Fara nume"}
                    </span>
                  </label>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  Nu exista utilizatori disponibili.
                </div>
              )}
            </div>
          )}
        </label>

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

      <button
        disabled={creating}
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {creating ? "Se salveaza..." : "Salveaza sarcina"}
      </button>
    </form>
  );
}

function TaskCard({
  task,
  onUpdateStatus,
  onSaveDetails,
  onDeleteTask,
  profile,
}) {
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
  
  async function handleDeleteTask() {
  const confirmDelete = window.confirm("Esti sigur ca vrei sa stergi sarcina?");
  if (!confirmDelete) return;

  await onDeleteTask(task.id);
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
const isWorkInProgress = task.status === "In lucru";
const isCompleted = task.status === "Finalizata";
const canUploadPhotos =
  profile?.role === "admin" || task.status !== "Noua";

  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm">
<div className="flex items-start justify-between gap-3">
  <div className="flex-1">
    <h3 className="text-base font-semibold leading-snug">{task.title}</h3>
  </div>

  <div className="flex items-center gap-2">
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        statusStyles[task.status] || statusStyles.Noua
      }`}
    >
      {task.status}
    </span>

    {profile?.role === "admin" && (
      <button
        type="button"
        onClick={handleDeleteTask}
        className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white"
      >
        Sterge
      </button>
    )}
  </div>
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
            {Array.isArray(task.assigned_names) && task.assigned_names.length > 0
  ? task.assigned_names.join(", ")
  : task.assigned_name || "Neatribuit"}
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

{hasFinalPhotos && isWorkInProgress && (
  <div className="mt-4 rounded-2xl border border-slate-200 p-3">
    <div className="mb-2 text-sm font-semibold text-slate-900">
      Poze lucrare
    </div>

    <div className="grid grid-cols-2 gap-2">
      {task.final_photo_urls.map((url, index) => {
        const startIndex = task.photo_url ? index + 1 : index;

        return (
          <div
            key={`${url}-${index}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          >
            <button
              type="button"
              onClick={() => openGallery(startIndex)}
              className="block w-full"
            >
              <img
                src={url}
                alt={`Poza ${index + 1}`}
                className="h-28 w-full object-cover"
              />
            </button>

            <div className="p-2">
              <button
                type="button"
                onClick={() => handleDeleteFinalPhoto(index)}
                className="w-full rounded-lg bg-red-100 px-2 py-2 text-xs font-semibold text-red-600"
              >
                Sterge poza
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

{hasFinalPhotos && isCompleted && (
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
            onClick={() => {
  const confirmAction = window.confirm("Esti sigur ca vrei sa treci sarcina in lucru?");
  if (!confirmAction) return;

  onUpdateStatus(task.id, "In lucru");
}}
            className="col-span-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Trece in lucru
          </button>
        )}

        {task.status === "In lucru" && (
          <button
            type="button"
            onClick={() => {
  const confirmAction = window.confirm("Esti sigur ca vrei sa inchizi sarcina?");
  if (!confirmAction) return;

  onUpdateStatus(task.id, "Finalizata");
}}
            className="col-span-3 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Inchide sarcina
          </button>
        )}

        {task.status === "Finalizata" && (
          <button
            type="button"
onClick={() => {
  const confirmAction = window.confirm("Esti sigur ca vrei sa redeschizi sarcina?");
  if (!confirmAction) return;

  onUpdateStatus(task.id, "In lucru");
}}
            className="col-span-3 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Redeschide sarcina
          </button>
        )}
      </div>

{task.status === "In lucru" && canUploadPhotos && (
  <div className="mt-4 rounded-2xl border border-slate-200 p-3">
  {task.status === "Noua" && profile?.role !== "admin" && (
  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
    Pozele pot fi adaugate doar de administrator cat timp sarcina este in stadiul Noua.
  </div>
)}
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

{task.status !== "Finalizata" && (
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

<TaskComments
  taskId={task.id}
  profile={profile}
  taskStatus={task.status}
/>

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

function MontageCalendar({ profile }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [showCreateMontajForm, setShowCreateMontajForm] = useState(false);

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const isAdmin = profile?.role === "admin";
  const calendarDays = getCalendarDays(currentMonth);

  async function loadEntries() {
    if (!supabase) return;

    setLoadingEntries(true);

    const startDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const { data, error } = await supabase
      .from("montaj_calendar")
      .select("*")
      .gte("event_date", toISODate(startDate))
      .lte("event_date", toISODate(endDate))
      .order("event_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setEntries(data || []);
    }

    setLoadingEntries(false);
  }

  useEffect(() => {
    loadEntries();
  }, [currentMonth]);

  const selectedEntries = entries.filter(
    (entry) => entry.event_date === selectedDate
  );

  function getEntriesForDay(date) {
    if (!date) return [];
    const iso = toISODate(date);
    return entries.filter((entry) => entry.event_date === iso);
  }

  async function handleCreateEntry(e) {
    e.preventDefault();
    if (!clientName.trim()) return;

    setSavingEntry(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("montaj_calendar").insert({
        event_date: selectedDate,
        client_name: clientName,
        phone,
        address,
        notes,
        created_by: user?.id || null,
      });

      if (error) throw error;

      setClientName("");
      setPhone("");
      setAddress("");
      setNotes("");
	  setShowCreateMontajForm(false);
      await loadEntries();
    } catch (error) {
      alert(error.message || "Montajul nu a putut fi salvat.");
      console.error(error);
    } finally {
      setSavingEntry(false);
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!isAdmin) return;

    const confirmDelete = window.confirm("Stergi acest montaj?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("montaj_calendar")
      .delete()
      .eq("id", entryId);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    await loadEntries();
  }
  
  async function handleCompleteEntry(entryId) {
  if (!isAdmin) return;

  const confirmComplete = window.confirm(
    "Esti sigur ca vrei sa finalizezi acest montaj?"
  );
  if (!confirmComplete) return;

  const { error } = await supabase
    .from("montaj_calendar")
    .update({ is_completed: true })
    .eq("id", entryId);

  if (error) {
    alert(error.message);
    console.error(error);
    return;
  }

  await loadEntries();
}

return (
  <section className="w-full bg-white">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
<h3 className="text-base font-semibold text-slate-900">
  Calendar montaj
</h3>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Adminul poate adauga si sterge montajele din calendar."
              : "Poti vizualiza montajele planificate, fara editare."}
          </p>
        </div>
      </div>

<div className="mb-5 space-y-3">
  <div className="text-center text-lg font-bold capitalize text-slate-900">
    {formatMonthLabel(currentMonth)}
  </div>

  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() =>
        setCurrentMonth(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        )
      }
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
    >
      Luna anterioara
    </button>

    <button
      type="button"
      onClick={() =>
        setCurrentMonth(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        )
      }
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
    >
      Luna urmatoare
    </button>
  </div>
</div>

      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
return (
  <div
    key={`empty-${index}`}
    className="aspect-square rounded-2xl bg-slate-50"
  />
);
          }

          const iso = toISODate(date);
          const isSelected = iso === selectedDate;
          const dayEntries = getEntriesForDay(date);

          return (
<button
  key={iso}
  type="button"
  onClick={() => setSelectedDate(iso)}
  className={`aspect-square rounded-2xl border p-1 text-center transition ${
    isSelected
      ? "border-[#009c5b] bg-green-50 shadow-sm"
      : "border-slate-200 bg-white"
  }`}
>
  <div className="pt-1 text-lg font-bold leading-none text-slate-900">
    {date.getDate()}
  </div>

{dayEntries.length > 0 && (
  <div className="mt-2 flex justify-center gap-1">
    {dayEntries.slice(0, 3).map((entry) => (
      <span
        key={entry.id}
        className={`h-2.5 w-2.5 rounded-full ${
          entry.is_completed ? "bg-green-500" : "bg-blue-500"
        }`}
      />
    ))}

    {dayEntries.length > 3 && (
      <span className="text-[10px] font-semibold text-slate-500">
        +{dayEntries.length - 3}
      </span>
    )}
  </div>
)}
</button>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-900">
          Detalii pentru data: {formatDate(selectedDate)}
        </div>

        {loadingEntries ? (
          <div className="text-sm text-slate-500">Se incarca montajele...</div>
        ) : selectedEntries.length > 0 ? (
          <div className="space-y-3">
            {selectedEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="font-semibold text-slate-900">
                  {entry.client_name}
                </div>
				
				<div className="mt-2">
  <span
    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
      entry.is_completed
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-blue-200 bg-blue-50 text-blue-700"
    }`}
  >
    {entry.is_completed ? "Finalizat" : "Nefinalizat"}
  </span>
</div>

                {entry.phone && (
                  <div className="mt-1 text-sm text-slate-600">
                    Telefon: {entry.phone}
                  </div>
                )}

                {entry.address && (
                  <div className="mt-1 text-sm text-slate-600">
                    Adresa: {entry.address}
                  </div>
                )}

                {entry.notes && (
                  <div className="mt-2 text-sm text-slate-600">
                    Notite: {entry.notes}
                  </div>
                )}

{isAdmin && (
  <div className="mt-3 grid grid-cols-2 gap-3">
    {!entry.is_completed && (
      <button
        type="button"
        onClick={() => handleCompleteEntry(entry.id)}
        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
      >
        Finalizeaza montaj
      </button>
    )}

    <button
      type="button"
      onClick={() => handleDeleteEntry(entry.id)}
      className="rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-600"
    >
      Sterge
    </button>
  </div>
)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Nu exista montaj planificat pentru aceasta data.
          </div>
        )}

{isAdmin && (
  <div className="mt-4 border-t border-slate-200 pt-4">
    <button
      type="button"
      onClick={() => setShowCreateMontajForm((prev) => !prev)}
      className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-base font-semibold text-white"
    >
      {showCreateMontajForm ? "Ascunde formularul" : "Adauga montaj"}
    </button>

    {showCreateMontajForm && (
      <form onSubmit={handleCreateEntry} className="mt-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">
          Adauga montaj
        </h4>

        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          placeholder="Nume client"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          placeholder="Nr telefon"
        />

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          placeholder="Adresa"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[90px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          placeholder="Notite"
        />

        <button
          type="submit"
          disabled={savingEntry}
          className="w-full rounded-2xl bg-[#009c5b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {savingEntry ? "Se salveaza..." : "Salveaza montaj"}
        </button>
      </form>
    )}
  </div>
)}
      </div>
    </section>
  );
}

function TaskComments({ taskId, profile, taskStatus }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  
  const visibleComments = showAllComments ? comments : comments.slice(-1);

  const canShowComments =
    taskStatus === "In lucru" || taskStatus === "Finalizata";

  async function loadComments() {
    if (!supabase || !taskId || !canShowComments) return;

    setLoadingComments(true);

    const { data, error } = await supabase
      .from("task_comments")
      .select("*, profiles:user_id(full_name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setComments(data || []);
    }

    setLoadingComments(false);
  }

  useEffect(() => {
    if (!canShowComments) return;

    loadComments();

    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, taskStatus]);

  async function handleSendComment(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setSendingComment(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("task_comments").insert({
        task_id: taskId,
        user_id: user?.id || null,
        message: message.trim(),
      });

      if (error) throw error;

      setMessage("");
    } catch (error) {
      alert(error.message || "Comentariul nu a putut fi trimis.");
      console.error(error);
    } finally {
      setSendingComment(false);
    }
  }

  if (!canShowComments) return null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 p-3">
      <div className="mb-3 text-sm font-semibold text-slate-900">
        Comentarii
      </div>

      {loadingComments ? (
        <div className="text-sm text-slate-500">Se incarca mesajele...</div>
      ) : comments.length > 0 ? (
        <div className="space-y-2">
          {visibleComments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl bg-slate-50 px-3 py-2"
            >
              <div className="text-xs font-semibold text-slate-700">
                {comment.profiles?.full_name || "Utilizator"}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                {comment.message}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {formatDate(comment.created_at)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-500">
          Nu exista comentarii pentru aceasta sarcina.
        </div>
      )}
	  
	  {comments.length > 1 && (
  <div className="mt-2">
    <button
      type="button"
      onClick={() => setShowAllComments((prev) => !prev)}
      className="text-sm font-semibold text-[#009c5b]"
    >
      {showAllComments ? "Ascunde comentariile" : "Vezi toate comentariile"}
    </button>
  </div>
)}

      <form onSubmit={handleSendComment} className="mt-3 space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[80px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          placeholder="Scrie un comentariu..."
        />

        <button
          type="submit"
          disabled={sendingComment}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sendingComment ? "Se trimite..." : "Trimite comentariu"}
        </button>
      </form>
    </div>
  );
}

function ClientsManagement({
  profile,
  autoOpenClientId,
  onAutoOpenHandled,
}) {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [clientsFilter, setClientsFilter] = useState("toate");
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("toate");
  const [showBusinessFilters, setShowBusinessFilters] = useState(false);

  const [clientName, setClientName] = useState("");
  const [quantityMp, setQuantityMp] = useState("");
  const [profileSeries, setProfileSeries] = useState([]);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [totalValue, setTotalValue] = useState("");
  const [advanceValue, setAdvanceValue] = useState("");
  const [remainingValue, setRemainingValue] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [clientStatus, setClientStatus] = useState("in asteptare");
  const [businessUnit, setBusinessUnit] = useState("comanda_noua");
  
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientName, setEditClientName] = useState("");
  const [editQuantityMp, setEditQuantityMp] = useState("");
  const [editProfileSeries, setEditProfileSeries] = useState("");
  const [editTotalValue, setEditTotalValue] = useState("");
  const [editAdvanceValue, setEditAdvanceValue] = useState("");
  const [editRemainingValue, setEditRemainingValue] = useState("");
  const [editRegistrationDate, setEditRegistrationDate] = useState("");
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editClientStatus, setEditClientStatus] = useState("in asteptare");
  const [updatingClient, setUpdatingClient] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);
  


  const isAdmin = profile?.role === "admin";
  
useEffect(() => {
  const total = Number(String(totalValue).replace(",", ".")) || 0;
  const advance = Number(String(advanceValue).replace(",", ".")) || 0;
  const remaining = total - advance;

  setRemainingValue(remaining >= 0 ? remaining.toFixed(2) : "0.00");
}, [totalValue, advanceValue]);

useEffect(() => {
  if (profile?.role !== "admin") return;
  if (!autoOpenClientId || !clients.length) return;

  const foundClient = clients.find(
    (client) => Number(client.id) === Number(autoOpenClientId)
  );

  if (!foundClient) return;

  setSelectedClient(foundClient);
  setShowDetailsModal(true);
  setIsEditingClient(false);

  setEditClientName(foundClient.client_name || "");
  setEditQuantityMp(foundClient.quantity_mp || "");
  setEditProfileSeries(foundClient.profile_series || "");
  setEditTotalValue(foundClient.total_value || "");
  setEditAdvanceValue(foundClient.advance_value || "");
  setEditRemainingValue(foundClient.remaining_value || "");
  setEditRegistrationDate(foundClient.registration_date || "");
  setEditDeliveryDate(foundClient.delivery_date || "");
  setEditClientStatus(foundClient.status || "in asteptare");

  onAutoOpenHandled?.();
}, [autoOpenClientId, clients, profile, onAutoOpenHandled]);

useEffect(() => {
  const total = Number(String(editTotalValue).replace(",", ".")) || 0;
  const advance = Number(String(editAdvanceValue).replace(",", ".")) || 0;
  const remaining = total - advance;

  setEditRemainingValue(remaining >= 0 ? remaining.toFixed(2) : "0.00");
}, [editTotalValue, editAdvanceValue]);
  
const profileOptions = [
  "Klass400",
  "Klass600",
  "Klass 76 MD",
  "proEvolution72",
  "proEvolution82",
  "Profilco 26 culisant",
  "Profilco 43",
  "Profilco 63",
  "Weiss 30 Culisant",
  "Weiss 40",
  "Weiss 78",
  "Weiss 85",
  "Sticla",
  "Alte servicii",
];
  
  const months = [
  { value: "01", label: "Ianuarie" },
  { value: "02", label: "Februarie" },
  { value: "03", label: "Martie" },
  { value: "04", label: "Aprilie" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Iunie" },
  { value: "07", label: "Iulie" },
  { value: "08", label: "August" },
  { value: "09", label: "Septembrie" },
  { value: "10", label: "Octombrie" },
  { value: "11", label: "Noiembrie" },
  { value: "12", label: "Decembrie" },
];

  const clientStatusStyles = {
    "in asteptare": "bg-blue-50 text-blue-700 border-blue-200",
    "in lucru": "bg-orange-50 text-orange-700 border-orange-200",
    executat: "bg-slate-100 text-slate-700 border-slate-200",
    livrat: "bg-green-50 text-green-700 border-green-200",
  };

  async function loadClients() {
    if (!supabase) return;

    setLoadingClients(true);

    const { data, error } = await supabase
      .from("clients_management")
      .select("*")
      .order("registration_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setClients(data || []);
    }

    setLoadingClients(false);
  }

  useEffect(() => {
    loadClients();

    if (!supabase) return;

    const channel = supabase
      .channel("clients-management-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients_management" },
        () => {
          loadClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleCreateClient(e) {
    e.preventDefault();
    if (!clientName.trim()) return;

    setSavingClient(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("clients_management").insert({
        client_name: clientName,
        quantity_mp: quantityMp || null,
        profile_series: profileSeries.length ? profileSeries.join(", ") : null,
        total_value: totalValue || null,
        advance_value: advanceValue || null,
        remaining_value: remainingValue || null,
        registration_date: registrationDate || null,
        delivery_date: deliveryDate || null,
        status: clientStatus,
		business_unit: businessUnit || null,
        created_by: user?.id || null,
      });

      if (error) throw error;
	  
const { data: latestClient } = await supabase
  .from("clients_management")
  .select("id")
  .eq("client_name", clientName)
  .order("created_at", { ascending: false })
  .limit(1)
  .single();

await sendAdminPushNotification(
  "Comanda nouă",
  `A fost creata comanda pentru ${clientName}`,
  latestClient?.id
    ? `/?openSection=clients&openClientId=${latestClient.id}`
    : `/`
);

      setClientName("");
      setQuantityMp("");
      setProfileSeries([]);
      setShowProfileSelect(false);
      setTotalValue("");
      setAdvanceValue("");
      setRemainingValue("");
      setRegistrationDate("");
      setDeliveryDate("");
      setClientStatus("in asteptare");
	  setBusinessUnit("comanda_noua");
      setShowCreateClientForm(false);

      await loadClients();
    } catch (error) {
      alert(error.message || "Clientul nu a putut fi salvat.");
      console.error(error);
    } finally {
      setSavingClient(false);
    }
  }
  
async function handleUpdateClient(e) {
  e.preventDefault();
  if (!selectedClient?.id) return;

  const previousAdvance = Number(selectedClient?.advance_value || 0);
  const nextAdvance = Number(editAdvanceValue || 0);

  const previousRemaining = Number(selectedClient?.remaining_value || 0);
  const nextRemaining = Number(editRemainingValue || 0);

  setUpdatingClient(true);

  try {
    const { error } = await supabase
      .from("clients_management")
      .update({
        client_name: editClientName,
        quantity_mp: editQuantityMp || null,
        profile_series: editProfileSeries || null,
        total_value: editTotalValue || null,
        advance_value: editAdvanceValue || null,
        remaining_value: editRemainingValue || null,
        registration_date: editRegistrationDate || null,
        delivery_date: editDeliveryDate || null,
        status: editClientStatus,
      })
      .eq("id", selectedClient.id);

    if (error) throw error;

    if (nextAdvance > previousAdvance && nextAdvance > 0) {
      await sendAdminPushNotification(
        "Avans încasat",
        `Comanda ${editClientName} a incasat avans`,
        `/?openSection=clients&openClientId=${selectedClient.id}`
      );
    }

    if (previousRemaining > 0 && nextRemaining === 0) {
      await sendAdminPushNotification(
        "Comandă achitată",
        `Comanda ${editClientName} a fost achitata`,
        `/?openSection=clients&openClientId=${selectedClient.id}`
      );
    }

    setSelectedClient((prev) =>
      prev
        ? {
            ...prev,
            client_name: editClientName,
            quantity_mp: editQuantityMp || null,
            profile_series: editProfileSeries || null,
            total_value: editTotalValue || null,
            advance_value: editAdvanceValue || null,
            remaining_value: editRemainingValue || null,
            registration_date: editRegistrationDate || null,
            delivery_date: editDeliveryDate || null,
            status: editClientStatus,
          }
        : prev
    );

    setIsEditingClient(false);
    await loadClients();
  } catch (error) {
    alert(error.message || "Comanda nu a putut fi actualizata.");
    console.error(error);
  } finally {
    setUpdatingClient(false);
  }
}

async function handleDeleteClient() {
  if (!selectedClient?.id) return;

  const confirmDelete = window.confirm("Sigur vrei sa stergi aceasta comanda?");
  if (!confirmDelete) return;

  setDeletingClient(true);

  try {
    const { error } = await supabase
      .from("clients_management")
      .delete()
      .eq("id", selectedClient.id);

    if (error) throw error;

    setShowDetailsModal(false);
    setSelectedClient(null);
    await loadClients();
  } catch (error) {
    alert(error.message || "Comanda nu a putut fi stearsa.");
    console.error(error);
  } finally {
    setDeletingClient(false);
  }
}

const filteredClients = clients.filter((client) => {
  const total = Number(client.total_value || 0);
  const remaining = Number(client.remaining_value || 0);

  let matchesFilter = true;

  if (clientsFilter === "achitate") {
    matchesFilter = total > 0 && remaining <= 0;
  }

  if (clientsFilter === "restante") {
    matchesFilter = remaining > 0;
  }

  let matchesMonth = true;
  if (selectedMonth) {
    const registrationDate = client.registration_date || "";
    matchesMonth = registrationDate.slice(5, 7) === selectedMonth;
  }

  let matchesSearch = true;
  if (clientSearch.trim()) {
    matchesSearch = (client.client_name || "")
      .toLowerCase()
      .includes(clientSearch.toLowerCase());
  }

let matchesCompany = true;

if (companyFilter === "constructii") {
  matchesCompany = client.business_unit === "constructii";
}

if (companyFilter === "mentenanta") {
  matchesCompany = client.business_unit === "mentenanta";
}

if (companyFilter === "ambele") {
  matchesCompany =
    client.business_unit === "constructii" ||
    client.business_unit === "mentenanta";
}

  return matchesFilter && matchesMonth && matchesSearch && matchesCompany;
});

const filteredClientsTotal = filteredClients.reduce((sum, client) => {
  return sum + Number(client.total_value || 0);
}, 0);

const filteredClientsCount = filteredClients.length;

  return (
    <>
      <section className="w-full bg-white">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Gestiune comenzi
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Adminul poate adauga si gestiona clientii."
              : "Lista clientilor este disponibila doar pentru vizualizare."}
          </p>
        </div>

<div className="mb-4 flex flex-wrap gap-3">
<button
  type="button"
  onClick={() => {
    setClientsFilter("toate");
    setSelectedMonth("");
    setCompanyFilter("toate");
    setClientSearch("");
  }}
  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
    clientsFilter === "toate" &&
    !selectedMonth &&
    companyFilter === "toate" &&
    !clientSearch
      ? "bg-slate-900 text-white"
      : "bg-slate-100 text-slate-700"
  }`}
>
  Toate comenzile
</button>

  <button
    type="button"
    onClick={() => setShowMonthFilter((prev) => !prev)}
    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
      selectedMonth
        ? "bg-slate-900 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    După lună
  </button>

<button
  type="button"
  onClick={() => {
    setClientsFilter("achitate");
  }}
  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
    clientsFilter === "achitate"
      ? "bg-green-600 text-white"
      : "bg-green-50 text-green-700"
  }`}
>
  Achitate
</button>

<button
  type="button"
  onClick={() => {
    setClientsFilter("restante");
  }}
  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
    clientsFilter === "restante"
      ? "bg-red-600 text-white"
      : "bg-red-50 text-red-700"
  }`}
>
  Restante
</button>

  <button
    type="button"
    onClick={() => setShowSearchBox((prev) => !prev)}
    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
      clientSearch
        ? "bg-slate-900 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    Caută
  </button>
</div>

<div className="mb-4">
  <button
    type="button"
    onClick={() => setShowBusinessFilters((prev) => !prev)}
    className="w-full rounded-2xl bg-slate-100 px-4 py-4 text-sm font-semibold text-slate-900"
  >
    {showBusinessFilters
      ? "ASCUNDE FILTRE PENTRU BRENADO SRL"
      : "ARATA FILTRE PENTRU BRENADO SRL"}
  </button>
</div>

{showBusinessFilters && (
  <div className="mb-4 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => setCompanyFilter("constructii")}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
        companyFilter === "constructii"
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      BRENADO SRL - CONSTRUCTII
    </button>

    <button
      type="button"
      onClick={() => setCompanyFilter("mentenanta")}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
        companyFilter === "mentenanta"
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      BRENADO SRL - MENTENANTA
    </button>

    <button
      type="button"
      onClick={() => setCompanyFilter("ambele")}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
        companyFilter === "ambele"
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      BRENADO SRL - AMBELE GRUPE
    </button>
  </div>
)}

{showMonthFilter && (
  <div className="mb-4 rounded-3xl border border-slate-200 p-4">
    <div className="mb-3 text-sm font-semibold text-slate-900">
      Selecteaza luna
    </div>

    <div className="grid grid-cols-2 gap-3">
      {months.map((month) => (
        <button
          key={month.value}
          type="button"
          onClick={() => {
            setSelectedMonth(month.value);
            setClientsFilter("toate");
            setShowMonthFilter(false);
          }}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            selectedMonth === month.value
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700"
          }`}
        >
          {month.label}
        </button>
      ))}
    </div>

    {selectedMonth && (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setSelectedMonth("")}
          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Reseteaza filtrul de luna
        </button>
      </div>
    )}
  </div>
)}

{showSearchBox && (
  <div className="mb-4 rounded-3xl border border-slate-200 p-4">
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-900">
        Cauta dupa nume client
      </span>
      <input
        value={clientSearch}
        onChange={(e) => setClientSearch(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        placeholder="Scrie numele clientului"
      />
    </label>

    {clientSearch && (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setClientSearch("")}
          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Reseteaza cautarea
        </button>
      </div>
    )}
  </div>
)}

        {isAdmin && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowCreateClientForm((prev) => !prev)}
              className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-base font-semibold text-white"
            >
              {showCreateClientForm ? "Ascunde formularul" : "+ Adauga comanda"}
            </button>

            {showCreateClientForm && (
              <form
                onSubmit={handleCreateClient}
                className="mt-4 space-y-3 rounded-3xl border border-slate-200 p-4"
              >
<div className="space-y-2">
  <span className="block text-sm font-medium text-slate-700">
    Tip comanda
  </span>

  <div className="grid grid-cols-1 gap-3">
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
      <input
        type="radio"
        name="businessUnit"
        value="comanda_noua"
        checked={businessUnit === "comanda_noua"}
        onChange={(e) => setBusinessUnit(e.target.value)}
      />
      <span className="text-sm font-medium text-slate-700">
        COMANDA NOUA
      </span>
    </label>

    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
      <input
        type="radio"
        name="businessUnit"
        value="constructii"
        checked={businessUnit === "constructii"}
        onChange={(e) => setBusinessUnit(e.target.value)}
      />
      <span className="text-sm font-medium text-slate-700">
        BRENADO SRL - CONSTRUCTII
      </span>
    </label>

    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
      <input
        type="radio"
        name="businessUnit"
        value="mentenanta"
        checked={businessUnit === "mentenanta"}
        onChange={(e) => setBusinessUnit(e.target.value)}
      />
      <span className="text-sm font-medium text-slate-700">
        BRENADO SRL - MENTENANTA
      </span>
    </label>
  </div>
</div>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  placeholder="Nume client"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={quantityMp}
                    onChange={(e) => setQuantityMp(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    placeholder="Cantitate mp"
                  />
<div className="relative">
  <button
    type="button"
    onClick={() => setShowProfileSelect((prev) => !prev)}
    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm outline-none focus:border-slate-400"
  >
    {profileSeries.length > 0
      ? profileSeries.join(", ")
      : "Selecteaza serie profil"}
  </button>

  {showProfileSelect && (
    <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow">
      {profileOptions.map((profile) => (
        <label
          key={profile}
          className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
        >
          <input
            type="checkbox"
            checked={profileSeries.includes(profile)}
            onChange={(e) => {
              if (e.target.checked) {
                setProfileSeries((prev) => [...prev, profile]);
              } else {
                setProfileSeries((prev) =>
                  prev.filter((item) => item !== profile)
                );
              }
            }}
          />
          <span className="text-sm text-slate-700">{profile}</span>
        </label>
      ))}
    </div>
  )}
</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    placeholder="V. totală"
                  />
                  <input
                    value={advanceValue}
                    onChange={(e) => setAdvanceValue(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    placeholder="Avans"
                  />
<input
  value={remainingValue}
  readOnly
  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
  placeholder="Rest"
/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Data inregistrare
                    </span>
                    <input
                      type="date"
                      value={registrationDate}
                      onChange={(e) => setRegistrationDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Data livrare
                    </span>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <select
                    value={clientStatus}
                    onChange={(e) => setClientStatus(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="in asteptare">In asteptare</option>
                    <option value="in lucru">In lucru</option>
                    <option value="executat">Executat</option>
                    <option value="livrat">Livrat</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={savingClient}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingClient ? "Se salveaza..." : "Salveaza comanda"}
                </button>
              </form>
            )}
          </div>
        )}

<div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
  <div className="text-sm text-slate-500">
    {selectedMonth
      ? "Valoare totala pentru luna selectata"
      : clientSearch
      ? "Valoare totala pentru cautarea curenta"
      : clientsFilter === "achitate"
      ? "Valoare totala comenzi achitate"
      : clientsFilter === "restante"
      ? "Valoare totala comenzi restante"
      : "Valoare totala toate comenzile"}
  </div>

  <div className="mt-1 text-xl font-bold text-slate-900">
    {formatCurrency(filteredClientsTotal)}
  </div>

  <div className="mt-2 text-sm font-medium text-slate-600">
    Nr. comenzi: {filteredClientsCount}
  </div>
</div>



        {loadingClients ? (
          <div className="text-sm text-slate-500">Se incarca clientii...</div>
        ) : filteredClients.length > 0 ? (
          <div className="space-y-3">
            {filteredClients.map((client) => (
<button
  key={client.id}
  type="button"
onClick={() => {
  setSelectedClient(client);
  setShowDetailsModal(true);
  setIsEditingClient(false);

  setEditClientName(client.client_name || "");
  setEditQuantityMp(client.quantity_mp || "");
  setEditProfileSeries(client.profile_series || "");
  setEditTotalValue(client.total_value || "");
  setEditAdvanceValue(client.advance_value || "");
  setEditRemainingValue(client.remaining_value || "");
  setEditRegistrationDate(client.registration_date || "");
  setEditDeliveryDate(client.delivery_date || "");
  setEditClientStatus(client.status || "in asteptare");
}}
  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
>
  <div className="font-semibold text-slate-900">
    {client.client_name}
  </div>
  
<div className="mt-1 text-xs font-medium text-slate-500">
  {client.business_unit === "comanda_noua"
    ? "COMANDA NOUA"
    : client.business_unit === "constructii"
    ? "BRENADO SRL - CONSTRUCTII"
    : client.business_unit === "mentenanta"
    ? "BRENADO SRL - MENTENANTA"
    : "Fara selectie"}
</div>

  <div className="mt-1 text-sm text-slate-500">
    Data inregistrare: {formatDate(client.registration_date)}
  </div>

  <div className="mt-1 text-sm font-medium text-slate-700">
    {formatCurrency(client.total_value)}
  </div>

  <div className="mt-2 flex flex-wrap gap-2">
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        clientStatusStyles[client.status] ||
        "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {client.status || "-"}
    </span>

    {Number(client.remaining_value || 0) <= 0 ? (
      <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        Achitata
      </span>
    ) : (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        Restanta: {formatCurrency(client.remaining_value)}
      </span>
    )}
  </div>
</button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Nu exista comenzi pentru filtrul selectat.
          </div>
        )}
      </section>

{showDetailsModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <button
              type="button"
onClick={() => {
  setShowDetailsModal(false);
  setIsEditingClient(false);
  setSelectedClient(null);
}}
              className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-2 text-sm font-semibold text-white"
            >
              ✕
            </button>

            <div className="pr-10">
              {!isEditingClient ? (
                <>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedClient.client_name}
                  </h3>
				  
<div>
  <span className="font-semibold">Tip comanda:</span>{" "}
  {selectedClient.business_unit === "comanda_noua"
    ? "COMANDA NOUA"
    : selectedClient.business_unit === "constructii"
    ? "BRENADO SRL - CONSTRUCTII"
    : selectedClient.business_unit === "mentenanta"
    ? "BRENADO SRL - MENTENANTA"
    : "-"}
</div>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <span className="font-semibold">Cantitate mp:</span>{" "}
                      {selectedClient.quantity_mp || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Serie profil:</span>{" "}
                      {selectedClient.profile_series || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Valoare totala:</span>{" "}
                      {formatCurrency(selectedClient.total_value)}
                    </div>
                    <div>
                      <span className="font-semibold">Valoare avans:</span>{" "}
                      {formatCurrency(selectedClient.advance_value)}
                    </div>
                    <div>
                      <span className="font-semibold">Rest de plata:</span>{" "}
                      {formatCurrency(selectedClient.remaining_value)}
                    </div>
                    <div>
                      <span className="font-semibold">Data inregistrare:</span>{" "}
                      {formatDate(selectedClient.registration_date)}
                    </div>
                    <div>
                      <span className="font-semibold">Data livrare:</span>{" "}
                      {formatDate(selectedClient.delivery_date)}
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span>{" "}
                      {selectedClient.status || "-"}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingClient(true)}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                      >
                        Editeaza
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteClient}
                        disabled={deletingClient}
                        className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {deletingClient ? "Se sterge..." : "Sterge comanda"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleUpdateClient} className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Editeaza comanda
                  </h3>

                  <input
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    placeholder="Nume client"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={editQuantityMp}
                      onChange={(e) => setEditQuantityMp(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      placeholder="Cantitate mp"
                    />
                    <input
                      value={editProfileSeries}
                      onChange={(e) => setEditProfileSeries(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      placeholder="Serie profil"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <input
                      value={editTotalValue}
                      onChange={(e) => setEditTotalValue(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      placeholder="Valoare totala"
                    />
                    <input
                      value={editAdvanceValue}
                      onChange={(e) => setEditAdvanceValue(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      placeholder="Avans"
                    />
                    <input
                      value={editRemainingValue}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                      placeholder="Rest de plata"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">
                        Data inregistrare
                      </span>
                      <input
                        type="date"
                        value={editRegistrationDate}
                        onChange={(e) => setEditRegistrationDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">
                        Data livrare
                      </span>
                      <input
                        type="date"
                        value={editDeliveryDate}
                        onChange={(e) => setEditDeliveryDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </span>
                    <select
                      value={editClientStatus}
                      onChange={(e) => setEditClientStatus(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="in asteptare">In asteptare</option>
                      <option value="in lucru">In lucru</option>
                      <option value="executat">Executat</option>
                      <option value="livrat">Livrat</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={updatingClient}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {updatingClient ? "Se salveaza..." : "Salveaza modificarile"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditingClient(false)}
                      className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      Renunta
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WinarhiOffers({ profile }) {
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [uploadingOffer, setUploadingOffer] = useState(false);
  const [offersFilter, setOffersFilter] = useState("toate");
  const [selectedOfferMonth, setSelectedOfferMonth] = useState("");
  const [showOfferMonthFilter, setShowOfferMonthFilter] = useState(false);

  const isAdmin = profile?.role === "admin";
  
  const months = [
  { value: "01", label: "Ianuarie" },
  { value: "02", label: "Februarie" },
  { value: "03", label: "Martie" },
  { value: "04", label: "Aprilie" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Iunie" },
  { value: "07", label: "Iulie" },
  { value: "08", label: "August" },
  { value: "09", label: "Septembrie" },
  { value: "10", label: "Octombrie" },
  { value: "11", label: "Noiembrie" },
  { value: "12", label: "Decembrie" },
];

  async function loadOffers() {
    if (!supabase) return;

    setLoadingOffers(true);

    const { data, error } = await supabase
      .from("winarhi_offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setOffers(data || []);
    }

    setLoadingOffers(false);
  }

  useEffect(() => {
    loadOffers();

    if (!supabase) return;

    const channel = supabase
      .channel("winarhi-offers-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "winarhi_offers" },
        () => {
          loadOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

async function handleUploadOffer(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const pdfFiles = files.filter((file) => file.type === "application/pdf");

  if (!pdfFiles.length) {
    alert("Se accepta doar fisiere PDF.");
    return;
  }

  setUploadingOffer(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    for (const file of pdfFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `offers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("winarhi-offers")
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("winarhi-offers")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("winarhi_offers")
        .insert({
          file_name: file.name,
          file_path: filePath,
          public_url: publicData.publicUrl,
          uploaded_by: user?.id || null,
        });

      if (insertError) throw insertError;
    }

    await loadOffers();
    alert("Ofertele au fost incarcate cu succes.");
  } catch (error) {
    alert(error.message || "Ofertele nu au putut fi incarcate.");
    console.error(error);
  } finally {
    setUploadingOffer(false);
    e.target.value = "";
  }
}

  async function handleDeleteOffer(offer) {
    const confirmDelete = window.confirm(
      "Esti sigur ca vrei sa stergi aceasta oferta?"
    );
    if (!confirmDelete) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("winarhi-offers")
        .remove([offer.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("winarhi_offers")
        .delete()
        .eq("id", offer.id);

      if (dbError) throw dbError;

      await loadOffers();
    } catch (error) {
      alert(error.message || "Oferta nu a putut fi stearsa.");
      console.error(error);
    }
  }


const todayIso = new Date().toISOString().slice(0, 10);

const filteredOffers = offers.filter((offer) => {
  const createdAt = offer.created_at || "";
  const createdDate = createdAt.slice(0, 10);
  const createdMonth = createdAt.slice(5, 7);

  let matchesFilter = true;

  if (offersFilter === "azi") {
    matchesFilter = createdDate === todayIso;
  }

  if (offersFilter === "luna") {
    matchesFilter = selectedOfferMonth
      ? createdMonth === selectedOfferMonth
      : true;
  }

  return matchesFilter;
});

  return (
    <section className="w-full bg-white">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          Oferte Winarhi
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Vizualizeaza ofertele exportate din Winarhi.
        </p>
      </div>
	  
	  <div className="mb-4 flex flex-col gap-3">
  <button
    type="button"
    onClick={() => {
      setOffersFilter("toate");
      setSelectedOfferMonth("");
      setShowOfferMonthFilter(false);
    }}
    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
      offersFilter === "toate"
        ? "bg-slate-900 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    Toate ofertele
  </button>

  <button
    type="button"
    onClick={() => {
      setOffersFilter("luna");
      setShowOfferMonthFilter((prev) => !prev);
    }}
    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
      offersFilter === "luna"
        ? "bg-slate-900 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    Oferte dupa luna
  </button>

  <button
    type="button"
    onClick={() => {
      setOffersFilter("azi");
      setSelectedOfferMonth("");
      setShowOfferMonthFilter(false);
    }}
    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
      offersFilter === "azi"
        ? "bg-slate-900 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    Oferte create azi
  </button>
</div>

{offersFilter === "luna" && showOfferMonthFilter && (
  <div className="mb-4 rounded-3xl border border-slate-200 p-4">
    <div className="mb-3 text-sm font-semibold text-slate-900">
      Selecteaza luna
    </div>

    <div className="grid grid-cols-2 gap-3">
      {months.map((month) => (
        <button
          key={month.value}
          type="button"
          onClick={() => {
            setSelectedOfferMonth(month.value);
            setShowOfferMonthFilter(false);
          }}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            selectedOfferMonth === month.value
        ? "bg-slate-900 text-white"
        : "bg-slate-100 text-slate-700"
          }`}
        >
          {month.label}
        </button>
      ))}
    </div>

    {selectedOfferMonth && (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setSelectedOfferMonth("")}
          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Reseteaza luna
        </button>
      </div>
    )}
  </div>
)}


<div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
  <div className="text-sm text-slate-500">Numar oferte afisate</div>
  <div className="mt-1 text-xl font-bold text-slate-900">
    {filteredOffers.length}
  </div>
</div>

      {loadingOffers ? (
        <div className="text-sm text-slate-500">Se incarca ofertele...</div>
) : filteredOffers.length > 0 ? (
  <div className="space-y-3">
    {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="font-semibold text-slate-900">
                {offer.file_name}
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Incarcata la: {formatDate(offer.created_at)}
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={offer.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Deschide PDF
                </a>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOffer(offer)}
                    className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Sterge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
 ) : (
        <div className="text-sm text-slate-500">
          Nu exista oferte Winarhi pentru filtrul selectat.
        </div>
      )}
    </section>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function sendAdminPushNotification(title, message, url = "/") {
  try {
    await fetch("/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        message,
        url,
      }),
    });
  } catch (error) {
    console.error("Eroare trimitere push:", error);
  }
}

function NotificationsPopup({
  notifications,
  onClose,
  onNotificationClick,
  onMarkAllRead,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4">
      <div className="mx-auto mt-16 w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            Notificari
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Marcheaza toate ca citite
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-red-500 px-3 py-2 text-sm font-semibold text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNotificationClick(notification)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {notification.title}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {notification.message}
                    </div>

                    <div className="mt-2 text-xs text-slate-400">
                      {formatDate(notification.created_at)}
                    </div>
                  </div>

                  {!notification.is_read && (
                    <span className="mt-1 h-3 w-3 rounded-full bg-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Nu exista notificari.
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState(isSupabaseConfigured ? [] : demoTasks);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("taskuri");
  const [statusFilter, setStatusFilter] = useState("Noua");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showWinarhiOffersModal, setShowWinarhiOffersModal] = useState(false);
  const countNoua = tasks.filter((t) => t.status === "Noua").length;
  const countInLucru = tasks.filter((t) => t.status === "In lucru").length;
  const countFinalizata = tasks.filter((t) => t.status === "Finalizata").length;
  const [autoOpenTaskId, setAutoOpenTaskId] = useState(null);
  const [autoOpenClientId, setAutoOpenClientId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  
  useEffect(() => {
  if (!supabase || !session?.user?.id) return;

  loadAppNotifications();

  const channel = supabase
    .channel(`app-notifications-${session.user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_notifications",
        filter: `user_id=eq.${session.user.id}`,
      },
      () => {
        loadAppNotifications();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [session?.user?.id]);
  
  useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service worker inregistrat.");
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  }
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!profile) return;

  const params = new URLSearchParams(window.location.search);
  const openSection = params.get("openSection");
  const openClientId = params.get("openClientId");
  const openTaskIdParam = params.get("openTaskId");

  if (
    profile?.role === "admin" &&
    openSection === "clients" &&
    openClientId
  ) {
    setShowClientsModal(true);
    setAutoOpenClientId(Number(openClientId));
  }

  if (openTaskIdParam) {
    setAutoOpenTaskId(Number(openTaskIdParam));
  }

  if (openClientId || openTaskIdParam || openSection) {
    window.history.replaceState({}, "", window.location.pathname);
  }
}, [profile]);



async function enablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("Browserul nu suporta notificari push.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("Permisiunea pentru notificari nu a fost acordata.");
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ),
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscriptionJson = subscription.toJSON();

const { error } = await supabase
  .from("push_subscriptions")
  .upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
    },
    {
      onConflict: "endpoint",
    }
  );

if (error) {
  console.error("Eroare salvare push subscription:", error);
  alert(error.message || "Subscription-ul nu a putut fi salvat.");
  return;
}

  alert("Notificarile au fost activate.");
}

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
	const currentTask = tasks.find((task) => task.id === taskId);
    if (!supabase) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: nextStatus } : task
        )
      );
      return;
    }

if (currentTask?.status === "In lucru" && nextStatus === "Finalizata") {
await sendAdminPushNotification(
  "Sarcina finalizata",
  `Sarcina "${currentTask.title}" a fost finalizata`,
  `/?openTaskId=${currentTask.id}`
);
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

async function deleteTask(taskId) {
  if (!supabase) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    alert(error.message);
    console.error(error);
    return;
  }

  setTasks((prev) => prev.filter((task) => task.id !== taskId));
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

async function loadAppNotifications() {
  if (!supabase || !session?.user?.id) return;

  const { data, error } = await supabase
    .from("app_notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Eroare load notificari:", error);
    return;
  }

  setNotifications(data || []);
}

async function markNotificationAsRead(notificationId) {
  const { error } = await supabase
    .from("app_notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Eroare mark as read:", error);
    return;
  }

  setNotifications((prev) =>
    prev.map((item) =>
      item.id === notificationId ? { ...item, is_read: true } : item
    )
  );
}

async function markAllNotificationsAsRead() {
  if (!session?.user?.id) return;

  const unreadIds = notifications
    .filter((item) => !item.is_read)
    .map((item) => item.id);

  if (!unreadIds.length) return;

  const { error } = await supabase
    .from("app_notifications")
    .update({ is_read: true })
    .in("id", unreadIds);

  if (error) {
    console.error("Eroare mark all read:", error);
    return;
  }

  setNotifications((prev) =>
    prev.map((item) => ({ ...item, is_read: true }))
  );
}

async function handleNotificationClick(notification) {
  if (!notification.is_read) {
    await markNotificationAsRead(notification.id);
  }

  setShowNotificationsPopup(false);

  if (notification.url) {
    window.location.href = notification.url;
  }
}


const filteredTasks = tasks.filter((task) => {
  const matchesStatus = task.status === statusFilter;

  const haystack = `
    ${task.title || ""}
    ${task.description || ""}
    ${task.assigned_name || ""}
    ${Array.isArray(task.assigned_names) ? task.assigned_names.join(" ") : ""}
    ${task.notes || ""}
  `.toLowerCase();

  const matchesSearch = haystack.includes(search.toLowerCase());

  return matchesStatus && matchesSearch;
});

  const showTaskArea = !(profile?.role === "admin" && activeTab === "useri");
  
  const hasUnreadNotifications = notifications.some((item) => !item.is_read);

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-900">
	{showNotificationsPopup && (
  <NotificationsPopup
    notifications={notifications}
    onClose={() => setShowNotificationsPopup(false)}
    onNotificationClick={handleNotificationClick}
    onMarkAllRead={markAllNotificationsAsRead}
  />
)}
      <div className="mx-auto max-w-md px-4 pt-4">
<header className="mb-4 border-b border-slate-200 bg-white p-5">
  {/* RAND SUS */}
<div className="flex items-center justify-between">
  
  {/* STANGA - IESIRE */}
  <button
    onClick={signOut}
    className="rounded-2xl bg-red-500 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 active:scale-95 transition"
  >
    Iesire
  </button>

  {/* MIJLOC - LOGO */}
  <img
    src="/logo.png"
    alt="Logo"
    className="h-10 w-auto object-contain"
  />

  {/* DREAPTA - CLOPOTEL */}
  <button
    type="button"
    onClick={() => setShowNotificationsPopup(true)}
    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-700"
  >
    🔔
    {hasUnreadNotifications && (
      <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-red-500" />
    )}
  </button>

</div>

  {/* RAND JOS - NUME + ROL */}
  <div className="mt-4 text-center">
    <p className="text-xs font-semibold text-slate-900">
      {(profile?.full_name || "Utilizator") +
        " - " +
        (profile?.role === "admin" ? "(Administrator)" : "(Utilizator)")}
    </p>
  </div>
</header>

<section className="mb-4 rounded-[2rem] bg-[#009c5b] p-4 text-white shadow-sm">
  <div className="space-y-3">
    <button
      type="button"
      onClick={() => setShowCalendarModal(true)}
      className="w-full rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-900"
    >
      CALENDAR MONTAJE
    </button>

    {profile?.role === "admin" && (
      <button
        type="button"
        onClick={() => {
  setAutoOpenClientId(null);
  setShowClientsModal(true);
}}
        className="w-full rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-900"
      >
        GESTIUNE COMENZI
      </button>
    )}
    {profile?.role === "admin" && (
    <button
      type="button"
      onClick={() => setShowWinarhiOffersModal(true)}
      className="w-full rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-900"
    >
OFERTE WINARHI
      </button>
    )}
</div>

{/* 🔽 NU mai închizi section aici */}

<div className="mt-6">
  <h2 className="text-xl font-semibold tracking-tight">
    Sarcini in timp real
  </h2>

  <p className="mt-2 text-sm text-white/80">
    Gestioneaza sarcinile, comenzile si membrii echipei.
  </p>

  <div className="mt-4 grid grid-cols-3 gap-2">
    <div className="rounded-2xl bg-white/10 p-3 text-center">
      <div className="text-xl font-semibold">{tasks.length}</div>
      <div className="mt-1 text-sm text-white/80">Total</div>
    </div>

    <div className="rounded-2xl bg-white/10 p-3 text-center">
      <div className="text-xl font-semibold">
        {tasks.filter((t) => t.status === "In lucru").length}
      </div>
      <div className="mt-1 text-sm text-white/80">In lucru</div>
    </div>

    <div className="rounded-2xl bg-white/10 p-3 text-center">
      <div className="text-xl font-semibold">
        {tasks.filter((t) => t.status === "Finalizata").length}
      </div>
      <div className="mt-1 text-sm text-white/80">Finalizate</div>
    </div>
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
                + Adaugă
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("useri")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  activeTab === "useri" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                Membrii
              </button>
            </div>
          </section>
        )}

        {profile?.role === "admin" && activeTab === "adauga" && (
          <div className="mb-4">
            <TaskForm onCreate={createTask} creating={creating} users={users} />
          </div>
        )}

        {profile?.role === "admin" && activeTab === "useri" && (
          <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">Utilizatori</h3>
              <p className="mt-1 text-sm text-slate-500">
                Vezi rolul fiecarui utilizator înregistrat.
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
<div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
  {userItem.role === "admin" ? "Admin" : "User"}
</div>
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
<div className="mt-4 flex flex-wrap justify-center gap-3 pb-1">
 {["Noua", "In lucru", "Finalizata"].map((status) => {
    const isActive = statusFilter === status;

    let activeClass = "bg-slate-900 text-white";
    let inactiveClass = "bg-slate-100 text-slate-700";

    if (status === "Noua") {
      activeClass = "bg-blue-600 text-white";
      inactiveClass = "bg-blue-50 text-blue-700";
    }

    if (status === "In lucru") {
      activeClass = "bg-orange-500 text-white";
      inactiveClass = "bg-orange-50 text-orange-700";
    }

    if (status === "Finalizata") {
      activeClass = "bg-green-600 text-white";
      inactiveClass = "bg-green-50 text-green-700";
    }

    if (status === "Toate") {
      activeClass = "bg-slate-900 text-white";
      inactiveClass = "bg-slate-100 text-slate-700";
    }

    return (
      <button
        key={status}
        type="button"
        onClick={() => setStatusFilter(status)}
        className={`whitespace-nowrap rounded-2xl px-4 py-2 text-base font-semibold shadow-sm ${
          isActive ? activeClass : inactiveClass
        }`}
      >
        {status}
      </button>
    );
  })}
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
    onDeleteTask={deleteTask}
    profile={profile}
  />
))}
            </section>
          </>
        )}
{showCalendarModal && (
  <div className="fixed inset-0 z-50 bg-black/50">
    {/* BUTON X */}
    <button
      type="button"
      onClick={() => setShowCalendarModal(false)}
      className="absolute right-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-2xl font-bold text-white shadow-lg"
    >
      ×
    </button>

    {/* CONTAINER */}
    <div className="mx-auto h-[100vh] w-full max-w-none overflow-y-auto bg-white px-3 pb-4 pt-6">
      <MontageCalendar profile={profile} />
    </div>
  </div>
)}

{showClientsModal && (
  <div className="fixed inset-0 z-50 bg-black/50">
    <button
      type="button"
      onClick={() => setShowClientsModal(false)}
      className="absolute right-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-2xl font-bold text-white shadow-lg"
    >
      ×
    </button>

    <div className="mx-auto h-[100vh] w-full max-w-none overflow-y-auto bg-white px-3 pb-4 pt-6">
<ClientsManagement
  profile={profile}
  autoOpenClientId={autoOpenClientId}
  onAutoOpenHandled={() => setAutoOpenClientId(null)}
/>
    </div>
  </div>
)}

{showWinarhiOffersModal && (
  <div className="fixed inset-0 z-50 bg-black/50">
    <button
      type="button"
      onClick={() => setShowWinarhiOffersModal(false)}
      className="absolute right-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-2xl font-bold text-white shadow-lg"
    >
      ×
    </button>

    <div className="mx-auto h-[100vh] w-full max-w-none overflow-y-auto bg-white px-3 pb-4 pt-6">
      <WinarhiOffers profile={profile} />
    </div>
  </div>
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