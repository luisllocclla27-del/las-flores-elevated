import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  RefreshCw,
  X,
  MessageSquare,
  ShieldCheck,
  Send,
  User,
  MapPin,
  ExternalLink,
} from "lucide-react";

export type ComplaintStatus = "pending" | "in_review" | "resolved" | "closed";

export interface ComplaintItem {
  id: string;
  code: string;
  full_name: string;
  doc_type: string;
  doc_number: string;
  phone: string;
  email: string;
  address: string;
  is_minor: boolean;
  parent_name?: string | null;
  claimed_type: "producto" | "servicio";
  claimed_amount?: number | null;
  claimed_description: string;
  claim_type: "reclamo" | "queja";
  detail: string;
  consumer_request: string;
  status: ComplaintStatus;
  admin_response?: string | null;
  created_at: string;
  updated_at?: string;
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: {
    label: "Recibida (Pendiente)",
    color: "text-amber-800",
    bg: "bg-amber-100",
    border: "border-amber-300",
  },
  in_review: {
    label: "En Atención / Revisión",
    color: "text-blue-800",
    bg: "bg-blue-100",
    border: "border-blue-300",
  },
  resolved: {
    label: "Resuelta con Respuesta",
    color: "text-emerald-800",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
  },
  closed: {
    label: "Cerrada / Archivada",
    color: "text-gray-800",
    bg: "bg-gray-200",
    border: "border-gray-300",
  },
};

interface AdminComplaintsSectionProps {
  onPendingCountChange?: (count: number) => void;
}

export function AdminComplaintsSection({ onPendingCountChange }: AdminComplaintsSectionProps = {}) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados del modal de respuesta
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("in_review");
  const [adminResponse, setAdminResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchComplaints = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching complaints table:", error.message);
      } else if (data) {
        const list = data as ComplaintItem[];
        setComplaints(list);
        const pendingCount = list.filter((c) => c.status === "pending").length;
        onPendingCountChange?.(pendingCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    const channel = supabase
      .channel("admin-complaints-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenDetail = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAdminResponse(complaint.admin_response || "");
    setIsModalOpen(true);
  };

  const handleSaveResponse = async () => {
    if (!selectedComplaint) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          status: newStatus,
          admin_response: adminResponse.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      const updatedList = complaints.map((c) =>
        c.id === selectedComplaint.id
          ? { ...c, status: newStatus, admin_response: adminResponse.trim() || null }
          : c
      );
      setComplaints(updatedList);
      const pendingCount = updatedList.filter((c) => c.status === "pending").length;
      onPendingCountChange?.(pendingCount);

      setSelectedComplaint((prev) =>
        prev ? { ...prev, status: newStatus, admin_response: adminResponse.trim() || null } : null
      );

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Error al actualizar la hoja de reclamación: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrado
  const filteredComplaints = complaints.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.code.toLowerCase().includes(term) ||
      c.full_name.toLowerCase().includes(term) ||
      c.doc_number.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesType = typeFilter === "all" || c.claim_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Métricas rápidas
  const totalPending = complaints.filter((c) => c.status === "pending").length;
  const totalInReview = complaints.filter((c) => c.status === "in_review").length;
  const totalResolved = complaints.filter((c) => c.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* ── HEADER CON MÉTRICAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Total Reclamaciones
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif font-black text-2xl text-[#2D473C]">{complaints.length}</span>
            <BookOpen className="text-gray-400" size={24} />
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Recibidas (Pendientes)
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif font-black text-2xl text-amber-900">{totalPending}</span>
            <Clock className="text-amber-500" size={24} />
          </div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
            En Atención / Proceso
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif font-black text-2xl text-blue-900">{totalInReview}</span>
            <RefreshCw className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Resueltas con Respuesta
          </span>
          <div className="flex items-center justify-between">
            <span className="font-serif font-black text-2xl text-emerald-900">{totalResolved}</span>
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código (LR-FLORES...), nombre, DNI, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D473C]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#2D473C]"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">Recibidas (Pendientes)</option>
              <option value="in_review">En Atención</option>
              <option value="resolved">Resueltas</option>
              <option value="closed">Cerradas</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#2D473C]"
            >
              <option value="all">Reclamos y Quejas</option>
              <option value="reclamo">Solo Reclamos</option>
              <option value="queja">Solo Quejas</option>
            </select>

            <button
              onClick={fetchComplaints}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              title="Recargar datos"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin text-[#2D473C]" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLA PRINCIPAL DE HOJAS DE RECLAMACIÓN ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Código / Fecha</th>
                <th className="py-3.5 px-4">Consumidor</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Bien Contratado</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-[#2D473C]" size={24} />
                    Cargando hojas de reclamación...
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <BookOpen size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-gray-700">No se encontraron registros</p>
                    <p className="text-[11px] text-gray-400">Las incidencias enviadas aparecerán aquí en tiempo real.</p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item) => {
                  const statusConf = COMPLAINT_STATUS_LABELS[item.status] || COMPLAINT_STATUS_LABELS.pending;
                  const dateStr = new Date(item.created_at).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = new Date(item.created_at).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenDetail(item)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-[#2D473C] block">{item.code}</span>
                        <span className="text-[10px] text-gray-400 block">{dateStr} • {timeStr}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{item.full_name}</span>
                        <span className="text-[11px] text-gray-500 block">{item.doc_type}: {item.doc_number}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            item.claim_type === "reclamo"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-orange-100 text-orange-800 border border-orange-200"
                          }`}
                        >
                          {item.claim_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px] truncate text-gray-700">
                        <span className="capitalize font-semibold text-gray-800 block text-[11px]">{item.claimed_type}</span>
                        <span className="text-gray-500 truncate block text-[11px]">{item.claimed_description}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusConf.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-[#2D473C] hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <span>Atender</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL DETALLE & GESTIÓN DE ESTADO (INDECOPI) ── */}
      {isModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-gray-200 space-y-6 my-8">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-black text-[#2D473C]">{selectedComplaint.code}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedComplaint.claim_type === "reclamo"
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {selectedComplaint.claim_type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Registrado el {new Date(selectedComplaint.created_at).toLocaleString("es-PE")}
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Datos del Consumidor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Consumidor Reclamante</span>
                <p className="font-bold text-gray-900 text-sm">{selectedComplaint.full_name}</p>
                <p className="text-gray-600 mt-1">{selectedComplaint.doc_type}: {selectedComplaint.doc_number}</p>
                <p className="text-gray-600">{selectedComplaint.address}</p>
                {selectedComplaint.is_minor && (
                  <p className="text-amber-800 font-semibold mt-1">
                    * Menor de edad. Apoderado: {selectedComplaint.parent_name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Canales de Contacto</span>
                <p className="flex items-center gap-2 text-gray-700">
                  <Phone size={13} className="text-[#2D473C]" />
                  <a href={`tel:${selectedComplaint.phone}`} className="font-bold hover:underline">
                    {selectedComplaint.phone}
                  </a>
                  <a
                    href={`https://wa.me/51${selectedComplaint.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold hover:bg-emerald-200"
                  >
                    WhatsApp
                  </a>
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <Mail size={13} className="text-[#2D473C]" />
                  <a href={`mailto:${selectedComplaint.email}`} className="font-bold hover:underline truncate">
                    {selectedComplaint.email}
                  </a>
                </p>
                <p className="text-gray-500 pt-1 text-[11px]">
                  Bien: <strong className="text-gray-800 capitalize">{selectedComplaint.claimed_type}</strong> — {selectedComplaint.claimed_description}
                  {selectedComplaint.claimed_amount && ` (Monto: S/ ${selectedComplaint.claimed_amount})`}
                </p>
              </div>
            </div>

            {/* Hechos y Solicitud */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#fdf8f0] p-4 rounded-2xl border border-[#d4a373]/30 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-[#d4a373] block tracking-wider">
                  Detalle de los Hechos (Explicación del Cliente)
                </span>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedComplaint.detail}</p>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-emerald-800 block tracking-wider">
                  Pedido Concreto del Consumidor (Solución solicitada)
                </span>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedComplaint.consumer_request || (selectedComplaint as any).consumerRequest}
                </p>
              </div>
            </div>

            {/* Gestión del Estado y Respuesta Formal */}
            <div className="pt-2 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Estado de Atención Indecopi *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2D473C]"
                  >
                    <option value="pending">🟡 Recibida (Pendiente de revisión)</option>
                    <option value="in_review">🔵 En Atención / Contacto con cliente</option>
                    <option value="resolved">🟢 Resuelta con Respuesta enviada</option>
                    <option value="closed">⚪ Cerrada / Archivada</option>
                  </select>
                </div>

                <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  ⏳ <strong>Plazo Legal Indecopi:</strong> 15 días hábiles a partir de la fecha de registro para brindar descargo o solución motivada.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Respuesta Formal de la Administración / Conclusiones Internas
                </label>
                <textarea
                  rows={3}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Detalle la respuesta brindada al cliente, acuerdos o medidas correctivas adoptadas..."
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-[#2D473C]"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveResponse}
                className="px-6 py-2.5 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>{isSaving ? "Guardando..." : "Guardar y Actualizar Estado"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
