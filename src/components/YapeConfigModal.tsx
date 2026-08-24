import { useState, useEffect, useRef } from "react";
import {
  X,
  QrCode,
  Building2,
  UserCheck,
  Upload,
  RefreshCw,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import {
  YapeConfig,
  YapeAccount,
  DEFAULT_YAPE_CONFIG,
  DEFAULT_YAPE_ACCOUNTS,
  normalizeYapeConfig,
  getActiveYapeAccount,
} from "../lib/yapeService";
import { compressImageToWebP } from "../lib/webp-compressor";
import { supabase } from "../lib/supabase";

interface YapeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: YapeConfig;
  onSave: (updated: YapeConfig) => void;
  role?: "admin" | "cashier";
}

export function YapeConfigModal({
  isOpen,
  onClose,
  currentConfig,
  onSave,
  role = "admin",
}: YapeConfigModalProps) {
  const [config, setConfig] = useState<YapeConfig>(() => normalizeYapeConfig(currentConfig));
  
  // Estados para Administrador (Formulario de creación / edición)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Formulario temporal
  const [formLabel, setFormLabel] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formType, setFormType] = useState<"business" | "personal" | "custom">("business");
  const [formQrUrl, setFormQrUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const normalized = normalizeYapeConfig(currentConfig);
      setConfig(normalized);
      setEditingAccountId(null);
      setIsAddingNew(false);
      setUploadSuccessMsg("");
      setErrorMsg("");
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const isCashier = role === "cashier";
  const accounts = config.accounts || DEFAULT_YAPE_ACCOUNTS;
  const enabledAccounts = accounts.filter((a) => a.enabled !== false);
  const activeAccount = getActiveYapeAccount(config);

  // Subida y Optimización WebP para el formulario activo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");
    setUploadSuccessMsg("");

    try {
      // Optimización a 800x800px WebP con calidad 0.90
      const compressed = await compressImageToWebP(file, 800, 800, 0.90);
      let finalUrl = compressed.dataUrl;

      try {
        const cleanFileName = `qr_yape_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("products")
          .upload(cleanFileName, compressed.blob, {
            contentType: "image/webp",
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("products")
            .getPublicUrl(cleanFileName);
          if (publicUrlData?.publicUrl) {
            finalUrl = publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn("Storage upload fallback to Data URL:", storageErr);
      }

      setFormQrUrl(finalUrl);
      setUploadSuccessMsg(
        `¡QR optimizado (${compressed.originalSizeKb} KB ➔ ${compressed.compressedSizeKb} KB WebP) y listo!`
      );
    } catch (err: any) {
      console.error("Error al procesar QR:", err);
      setErrorMsg("No se pudo procesar la imagen. Intenta con otro archivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Guardar creación de nueva cuenta
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("El nombre del titular es obligatorio.");
      return;
    }
    if (!formQrUrl) {
      setErrorMsg("Debes cargar una imagen de código QR.");
      return;
    }

    const newAccount: YapeAccount = {
      id: `yape_${Date.now()}`,
      type: formType,
      label: formLabel.trim() || (formType === "personal" ? "Yape Personal" : "Yape Empresa"),
      name: formName.trim(),
      phone: formPhone.trim() || undefined,
      qrUrl: formQrUrl,
      enabled: true,
    };

    const updatedAccounts = [...accounts, newAccount];
    const updatedConfig = normalizeYapeConfig({
      ...config,
      accounts: updatedAccounts,
    });

    setConfig(updatedConfig);
    setIsAddingNew(false);
    setUploadSuccessMsg(`¡Cuenta "${newAccount.label}" agregada exitosamente!`);
    setErrorMsg("");
  };

  // Guardar edición de cuenta existente
  const handleSaveEditedAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccountId) return;
    if (!formName.trim()) {
      setErrorMsg("El nombre del titular es obligatorio.");
      return;
    }

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === editingAccountId) {
        return {
          ...acc,
          type: formType,
          label: formLabel.trim() || acc.label,
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
          qrUrl: formQrUrl || acc.qrUrl,
        };
      }
      return acc;
    });

    const updatedConfig = normalizeYapeConfig({
      ...config,
      accounts: updatedAccounts,
    });

    setConfig(updatedConfig);
    setEditingAccountId(null);
    setUploadSuccessMsg("¡Cuenta actualizada exitosamente!");
    setErrorMsg("");
  };

  // Abrir modal de edición para una cuenta
  const startEditing = (acc: YapeAccount) => {
    setEditingAccountId(acc.id);
    setIsAddingNew(false);
    setFormLabel(acc.label);
    setFormName(acc.name);
    setFormPhone(acc.phone || "");
    setFormType(acc.type);
    setFormQrUrl(acc.qrUrl);
    setUploadSuccessMsg("");
    setErrorMsg("");
  };

  // Abrir modal de creación
  const startAdding = () => {
    setIsAddingNew(true);
    setEditingAccountId(null);
    setFormLabel("Nuevo Yape");
    setFormName("");
    setFormPhone("");
    setFormType("business");
    setFormQrUrl(DEFAULT_YAPE_CONFIG.businessQrUrl);
    setUploadSuccessMsg("");
    setErrorMsg("");
  };

  // Alternar habilitado / deshabilitado
  const toggleAccountEnabled = (accId: string) => {
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === accId) {
        return { ...acc, enabled: !acc.enabled };
      }
      return acc;
    });

    const updatedConfig = normalizeYapeConfig({
      ...config,
      accounts: updatedAccounts,
    });
    setConfig(updatedConfig);
  };

  // Eliminar cuenta
  const handleDeleteAccount = (acc: YapeAccount) => {
    if (accounts.length <= 1) {
      alert("Debe existir al menos una cuenta de Yape registrada.");
      return;
    }
    const confirmed = window.confirm(`¿Estás seguro de eliminar la cuenta "${acc.label}" (${acc.name})?`);
    if (!confirmed) return;

    const updatedAccounts = accounts.filter((a) => a.id !== acc.id);
    const updatedConfig = normalizeYapeConfig({
      ...config,
      accounts: updatedAccounts,
    });
    setConfig(updatedConfig);
    setUploadSuccessMsg(`Cuenta "${acc.label}" eliminada.`);
  };

  // Restaurar todo a valores de fábrica
  const handleRestoreFullDefaults = () => {
    const confirmed = window.confirm(
      "¿Restaurar todos los valores de fábrica? Esto restablecerá los nombres, números y códigos QR oficiales por defecto de la empresa y personales."
    );
    if (!confirmed) return;

    setConfig(DEFAULT_YAPE_CONFIG);
    setEditingAccountId(null);
    setIsAddingNew(false);
    setUploadSuccessMsg("Se restauraron todos los datos originales de fábrica.");
    setErrorMsg("");
  };

  // Aplicar y guardar
  const handleApply = () => {
    const normalized = normalizeYapeConfig(config);
    onSave(normalized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-200 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2D473C]">
                {isCashier ? "Alternar QR de Yape (Caja)" : "Gestión de Códigos QR de Yape"}
              </h3>
              <p className="text-xs text-gray-500">
                {isCashier
                  ? "Selecciona el QR activo disponible para los pagos de clientes"
                  : "Administración: agregar, editar, deshabilitar y subir imágenes de QR"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensajes de feedback */}
        {uploadSuccessMsg && (
          <div className="p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <Check size={16} className="text-emerald-700 shrink-0" strokeWidth={3} />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-100/90 border border-red-300 rounded-xl text-red-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA EN MODO CAJA: SELECTOR RÁPIDO DE CUENTAS HABILITADAS                */}
        {/* ========================================================================= */}
        {isCashier ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Cuentas Habilitadas en Caja ({enabledAccounts.length})
              </span>
            </div>

            {enabledAccounts.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <AlertCircle size={32} className="text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-gray-700">No hay cuentas de Yape habilitadas</p>
                <p className="text-[11px] text-gray-500">
                  Comunícate con Administración para habilitar un código QR de cobro.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enabledAccounts.map((acc) => {
                  const isSelected = config.activeAccountId === acc.id;
                  const isPersonalType = acc.type === "personal";

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, activeAccountId: acc.id }))}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                        isSelected
                          ? isPersonalType
                            ? "border-purple-600 bg-purple-50/80 shadow-md ring-1 ring-purple-600"
                            : "border-emerald-600 bg-emerald-50/80 shadow-md ring-1 ring-emerald-600"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isPersonalType ? (
                            <UserCheck className={isSelected ? "text-purple-700" : "text-gray-400"} size={18} />
                          ) : (
                            <Building2 className={isSelected ? "text-emerald-700" : "text-gray-400"} size={18} />
                          )}
                          <span className="font-extrabold text-xs uppercase text-gray-900 line-clamp-1">
                            {acc.label}
                          </span>
                        </div>
                        {isSelected ? (
                          <span
                            className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-xs shadow-xs ${
                              isPersonalType ? "bg-purple-600" : "bg-emerald-600"
                            }`}
                          >
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800 line-clamp-1">{acc.name}</span>
                        {acc.phone && (
                          <span className="text-[11px] text-gray-600 font-mono block">
                            Tel: {acc.phone}
                          </span>
                        )}
                      </div>

                      {/* Miniatura visual */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Miniatura QR</span>
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 p-0.5 shadow-2xs overflow-hidden">
                          <img src={acc.qrUrl} alt="QR" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Verificación visual activa */}
            {activeAccount && (
              <div className="p-4 rounded-2xl bg-[#F9F8F3] border border-[#EBE7D8] flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl bg-white border border-gray-200 p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={activeAccount.qrUrl}
                    alt="QR Activo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#2D473C] uppercase text-xs">{activeAccount.label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Seleccionado
                    </span>
                  </div>
                  <p className="text-gray-500">Titular:</p>
                  <p className="font-bold text-sm text-gray-900">{activeAccount.name}</p>
                  {activeAccount.phone && (
                    <p className="text-gray-600 font-medium">
                      Número: <strong className="text-gray-900">{activeAccount.phone}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2">
              <span className="text-base leading-none">ℹ️</span>
              <p>
                Al confirmar, el carrito de compras de todos los clientes mostrará en vivo este QR para pagar por Yape.
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VISTA EN MODO ADMINISTRADOR: GESTIÓN DINÁMICA DE CUENTAS                  */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* Si está en modo Formulario (Crear o Editar) */}
            {isAddingNew || editingAccountId ? (
              <form
                onSubmit={isAddingNew ? handleCreateAccount : handleSaveEditedAccount}
                className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#D4AF37]" />
                    {isAddingNew ? "Agregar Nueva Cuenta de Yape" : `Editar Cuenta: ${formLabel}`}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingAccountId(null);
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Etiqueta de la cuenta *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Yape Empresa, Yape Caja 2..."
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2D473C]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tipo de Cuenta *</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2D473C]"
                    >
                      <option value="business">Empresarial (Yape Empresa / Razón Social)</option>
                      <option value="personal">Personal (Titular Natural)</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Titular / Razón Social *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Corporación Las Flores SAC"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2D473C]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Número Celular (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: 967 456 230"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#2D473C]"
                    />
                  </div>
                </div>

                {/* Zona de Carga de Imagen QR */}
                <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-3">
                  <span className="text-xs font-bold text-gray-700 block">Imagen del Código QR *</span>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-300 p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                      {formQrUrl ? (
                        <img src={formQrUrl} alt="QR Form" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <QrCode size={30} className="text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="form-qr-file-input"
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-[#2D473C] hover:bg-[#243B31] text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Optimizando a WebP...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={15} />
                            <span>Subir / Cambiar Imagen QR</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        Conversión y compresión automática a WebP (800x800 px) para escaneo ultra-rápido.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingAccountId(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>{isAddingNew ? "Guardar Nueva Cuenta" : "Actualizar Cuenta"}</span>
                  </button>
                </div>
              </form>
            ) : null}

            {/* Lista de Cuentas QR Registradas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Cuentas Registradas ({accounts.length})
                </span>
                <button
                  type="button"
                  onClick={startAdding}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Agregar Nuevo QR</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {accounts.map((acc) => {
                  const isActive = config.activeAccountId === acc.id;
                  const isEnabled = acc.enabled !== false;
                  const isPersonalType = acc.type === "personal";

                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600"
                          : isEnabled
                          ? "border-gray-200 bg-white"
                          : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Miniatura QR */}
                        <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={acc.qrUrl} alt={acc.label} className="w-full h-full object-contain" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-gray-900">{acc.label}</span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 size={10} /> ACTIVO EN TIENDA
                              </span>
                            )}
                            {!isEnabled && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                                DESHABILITADO EN CAJA
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 font-semibold truncate">{acc.name}</p>
                          {acc.phone && (
                            <p className="text-gray-500 font-mono text-[11px]">Tel: {acc.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {/* Hacer Activo */}
                        {!isActive && isEnabled && (
                          <button
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, activeAccountId: acc.id }))}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2D473C] hover:bg-[#243B31] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Establecer como cuenta activa para cobros"
                          >
                            <Check size={13} /> Activar
                          </button>
                        )}

                        {/* Switch Habilitar / Deshabilitar */}
                        <button
                          type="button"
                          onClick={() => toggleAccountEnabled(acc.id)}
                          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            isEnabled
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                          title={isEnabled ? "Deshabilitar en Caja" : "Habilitar en Caja"}
                        >
                          {isEnabled ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => startEditing(acc)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer transition-colors"
                          title="Editar cuenta y cambiar imagen QR"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer transition-colors"
                          title="Eliminar cuenta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Restaurar valores de fábrica */}
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRestoreFullDefaults}
                className="text-xs font-bold text-gray-500 hover:text-red-700 flex items-center gap-1.5 cursor-pointer hover:underline transition-colors"
                title="Restablecer titulares, teléfonos y fotos originales completas"
              >
                <RotateCcw size={14} />
                <span>Restaurar Valores de Fábrica Completos</span>
              </button>
            </div>

          </div>
        )}

        {/* Botón de Guardar y Aplicar Cambios */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Check size={16} strokeWidth={2.5} />
            <span>{isCashier ? "Confirmar y Activar QR" : "Aplicar y Guardar Cambios"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
