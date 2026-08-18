import { useState, useEffect } from "react";
import {
  listAdminJobOffers,
  saveJobOffer,
  listJobApplications,
  updateJobApplication,
  createCvSignedUrl,
} from "../features/jobs/api";
import type {
  JobOffer,
  JobApplication,
  JobOfferInput,
  JobOfferStatus,
  JobApplicationStatus,
} from "../features/jobs/types";
import {
  JOB_OFFER_STATUS_LABELS,
  JOB_APPLICATION_STATUS_LABELS,
} from "../features/jobs/types";
import {
  Briefcase,
  Users,
  Plus,
  Edit2,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

export function AdminJobsSection() {
  const [subTab, setSubTab] = useState<"offers" | "applications">("offers");
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para crear/editar convocatoria
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);
  const [offerForm, setOfferForm] = useState<JobOfferInput>({
    title: "",
    slug: "",
    department: "Servicio",
    location: "Ayacucho",
    work_mode: "onsite",
    summary: "",
    description: "",
    responsibilities: [],
    requirements: [],
    benefits: [],
    status: "published",
    application_deadline: "",
    sort_order: 1,
  });

  // Cadenas multilínea para textareas de arrays
  const [respText, setRespText] = useState("");
  const [reqText, setReqText] = useState("");
  const [benText, setBenText] = useState("");

  const [savingOffer, setSavingOffer] = useState(false);

  // Filtros de postulaciones
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [offerFilter, setOfferFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [offData, appData] = await Promise.all([
        listAdminJobOffers(),
        listJobApplications(),
      ]);
      setOffers(offData);
      setApplications(appData);
    } catch (err) {
      console.error(err);
      setError("Error al cargar la información de convocatorias y postulantes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewOffer = () => {
    setEditingOffer(null);
    setOfferForm({
      title: "",
      slug: "",
      department: "Servicio",
      location: "Ayacucho",
      work_mode: "onsite",
      summary: "",
      description: "",
      responsibilities: [],
      requirements: [],
      benefits: [],
      status: "published",
      application_deadline: "",
      sort_order: offers.length + 1,
    });
    setRespText("");
    setReqText("");
    setBenText("");
    setShowOfferModal(true);
  };

  const handleOpenEditOffer = (offer: JobOffer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      slug: offer.slug,
      department: offer.department,
      location: offer.location,
      work_mode: offer.work_mode,
      summary: offer.summary,
      description: offer.description,
      responsibilities: offer.responsibilities || [],
      requirements: offer.requirements || [],
      benefits: offer.benefits || [],
      status: offer.status,
      application_deadline: offer.application_deadline || "",
      sort_order: offer.sort_order,
    });
    setRespText((offer.responsibilities || []).join("\n"));
    setReqText((offer.requirements || []).join("\n"));
    setBenText((offer.benefits || []).join("\n"));
    setShowOfferModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOffer(true);
    try {
      const formattedInput: JobOfferInput = {
        ...offerForm,
        slug: offerForm.slug || offerForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        responsibilities: respText.split("\n").map((s) => s.trim()).filter(Boolean),
        requirements: reqText.split("\n").map((s) => s.trim()).filter(Boolean),
        benefits: benText.split("\n").map((s) => s.trim()).filter(Boolean),
        application_deadline: offerForm.application_deadline || null,
      };

      await saveJobOffer(formattedInput, editingOffer?.id);
      setShowOfferModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la convocatoria.");
    } finally {
      setSavingOffer(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: JobApplicationStatus) => {
    try {
      await updateJobApplication(id, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      console.error(err);
      alert("Error al actualizar estado del postulante.");
    }
  };

  const handleOpenCv = async (cvPath: string) => {
    try {
      const url = await createCvSignedUrl(cvPath);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      alert("No se pudo generar el enlace del CV.");
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchSearch =
      app.full_name.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.city.toLowerCase().includes(appSearch.toLowerCase());
    const matchStatus = appStatusFilter === "all" || app.status === appStatusFilter;
    const matchOffer = offerFilter === "all" || app.job_offer_id === offerFilter;
    return matchSearch && matchStatus && matchOffer;
  });

  return (
    <div className="space-y-6">
      {/* Header con Sub-pestañas */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#d4a373]/20">
        <div className="flex items-center gap-2 bg-[#f7f5ef] p-1 rounded-2xl border border-[#d4a373]/25 shadow-inner">
          <button
            onClick={() => setSubTab("offers")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              subTab === "offers"
                ? "bg-[#2e5339] text-white shadow-xs"
                : "text-[#3b1f10]/60 hover:text-[#3b1f10]"
            }`}
          >
            Convocatorias ({offers.length})
          </button>
          <button
            onClick={() => setSubTab("applications")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              subTab === "applications"
                ? "bg-[#2e5339] text-white shadow-xs"
                : "text-[#3b1f10]/60 hover:text-[#3b1f10]"
            }`}
          >
            Postulantes ({applications.length})
          </button>
        </div>

        {subTab === "offers" && (
          <button
            onClick={handleOpenNewOffer}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2e5339] hover:bg-[#23412c] text-white font-sans font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer border border-[#2e5339]"
          >
            <Plus size={16} />
            <span>Nueva Convocatoria</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#3b1f10]/50 gap-3">
          <Loader2 size={36} className="animate-spin text-[#2e5339]" />
          <p className="text-sm font-bold text-[#3b1f10]">Cargando información laboral…</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-[#8C1D40] rounded-3xl border border-red-200 text-center">
          <AlertCircle size={32} className="mx-auto mb-2 text-[#8C1D40]" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : subTab === "offers" ? (
        /* ── SECCIÓN 1: CONVOCATORIAS ── */
        <div className="bg-white rounded-3xl border border-[#d4a373]/25 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#3b1f10]">
              <thead className="bg-[#f7f5ef] border-b border-[#d4a373]/20 text-xs font-serif font-bold uppercase tracking-wider text-[#3b1f10]/60">
                <tr>
                  <th className="px-6 py-4">Convocatoria</th>
                  <th className="px-6 py-4">Área / Ubicación</th>
                  <th className="px-6 py-4">Modalidad</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Cierre</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4a373]/15">
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#3b1f10]/40 text-sm">
                      No hay convocatorias creadas aún. Haz clic en "Nueva Convocatoria" para publicar una vacante.
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-[#fdf8f0]/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#3b1f10] text-sm">{offer.title}</div>
                        <div className="text-xs text-[#3b1f10]/60 line-clamp-1 max-w-xs">{offer.summary}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#2e5339]">
                        {offer.department} • {offer.location}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="px-3 py-1 rounded-full bg-[#f7f5ef] font-semibold text-[#3b1f10] border border-[#d4a373]/25">
                          {offer.work_mode === "onsite"
                            ? "Presencial"
                            : offer.work_mode === "hybrid"
                            ? "Híbrido"
                            : "Remoto"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-xs border ${
                            offer.status === "published"
                              ? "bg-emerald-50 text-[#2e5339] border-emerald-200"
                              : offer.status === "paused"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : offer.status === "closed"
                              ? "bg-red-50 text-[#8C1D40] border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {JOB_OFFER_STATUS_LABELS[offer.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#3b1f10]/70 font-mono">
                        {offer.application_deadline || "Sin fecha límite"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditOffer(offer)}
                          className="p-2 rounded-xl text-[#3b1f10]/70 hover:text-[#2e5339] hover:bg-[#2e5339]/10 border border-transparent hover:border-[#2e5339]/20 transition-all cursor-pointer"
                          title="Editar Convocatoria"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── SECCIÓN 2: POSTULANTES Y CVS ── */
        <div className="space-y-4">
          {/* Filtros */}
          <div className="p-4 rounded-3xl bg-white border border-[#d4a373]/25 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2e5339]" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o ciudad…"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f7f5ef] border border-[#d4a373]/25 text-xs text-[#3b1f10] outline-none focus:ring-2 focus:ring-[#2e5339]/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-2xl bg-[#f7f5ef] border border-[#d4a373]/25 text-xs font-bold text-[#3b1f10] outline-none cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                {Object.entries(JOB_APPLICATION_STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={offerFilter}
                onChange={(e) => setOfferFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-cream border border-black/10 text-xs font-semibold text-ink outline-none cursor-pointer"
              >
                <option value="all">Todas las convocatorias</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Postulantes */}
          <div className="bg-white rounded-2xl border border-black/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead className="bg-[#fcfaf5] border-b border-black/5 text-xs font-bold uppercase tracking-wider text-ink/60">
                  <tr>
                    <th className="px-6 py-4">Postulante</th>
                    <th className="px-6 py-4">Puesto</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Disponibilidad</th>
                    <th className="px-6 py-4">CV</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-ink/50 text-sm">
                        No se encontraron postulaciones recibidas.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-cream/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-ink">{app.full_name}</div>
                          <div className="text-xs text-ink/60">{app.city}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-eucalipto">
                          {app.job_offers?.title || "Convocatoria"}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div>{app.phone}</div>
                          <div className="text-ink/60">{app.email}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-ink/70">
                          {app.availability}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <button
                            onClick={() => handleOpenCv(app.cv_path)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-eucalipto/10 text-eucalipto hover:bg-eucalipto/20 font-bold rounded-lg transition-colors"
                          >
                            <FileText size={14} />
                            <span>Ver PDF</span>
                            <ExternalLink size={12} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleStatusChange(app.id, e.target.value as JobApplicationStatus)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer ${
                              app.status === "new"
                                ? "bg-blue-100 text-blue-800"
                                : app.status === "reviewing"
                                ? "bg-amber-100 text-amber-800"
                                : app.status === "shortlisted"
                                ? "bg-purple-100 text-purple-800"
                                : app.status === "hired"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {Object.entries(JOB_APPLICATION_STATUS_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CONVOCATORIA */}
      {showOfferModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <h3 className="font-serif font-bold text-2xl text-ink">
                {editingOffer ? "Editar Convocatoria" : "Nueva Convocatoria"}
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-ink/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                  Título del puesto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="Ej. Anfitrión / Anfitriona de Salón"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm text-ink outline-none focus:border-eucalipto"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">Área</label>
                  <input
                    type="text"
                    required
                    value={offerForm.department}
                    onChange={(e) => setOfferForm({ ...offerForm, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">Ubicación</label>
                  <input
                    type="text"
                    required
                    value={offerForm.location}
                    onChange={(e) => setOfferForm({ ...offerForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">Modalidad</label>
                  <select
                    value={offerForm.work_mode}
                    onChange={(e) => setOfferForm({ ...offerForm, work_mode: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none cursor-pointer focus:border-eucalipto"
                  >
                    <option value="onsite">Presencial</option>
                    <option value="hybrid">Híbrido</option>
                    <option value="remote">Remoto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">Estado</label>
                  <select
                    value={offerForm.status}
                    onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value as JobOfferStatus })}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none cursor-pointer focus:border-eucalipto"
                  >
                    <option value="published">Publicada</option>
                    <option value="draft">Borrador</option>
                    <option value="paused">Pausada</option>
                    <option value="closed">Cerrada</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">Fecha Límite (opcional)</label>
                  <input
                    type="date"
                    value={offerForm.application_deadline || ""}
                    onChange={(e) => setOfferForm({ ...offerForm, application_deadline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">Resumen corto</label>
                <input
                  type="text"
                  required
                  value={offerForm.summary}
                  onChange={(e) => setOfferForm({ ...offerForm, summary: e.target.value })}
                  placeholder="Resumen corto visible en la lista"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">Descripción completa</label>
                <textarea
                  rows={3}
                  required
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                  Responsabilidades (1 por línea)
                </label>
                <textarea
                  rows={3}
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  placeholder="Ej: Atender solicitudes de comensales&#10;Coordinar con cocina"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                  Requisitos (1 por línea)
                </label>
                <textarea
                  rows={3}
                  value={reqText}
                  onChange={(e) => setReqText(e.target.value)}
                  placeholder="Ej: Experiencia previa en restaurantes&#10;Actitud de servicio"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                  Beneficios (1 por línea)
                </label>
                <textarea
                  rows={3}
                  value={benText}
                  onChange={(e) => setBenText(e.target.value)}
                  placeholder="Ej: Ingreso a planilla&#10;Almuerzo cubierto"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-ink/70 hover:bg-black/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingOffer}
                  className="px-6 py-2.5 bg-eucalipto text-cream font-bold rounded-xl hover:bg-eucalipto/90 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingOffer ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Guardar Convocatoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
