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
} from "lucide-react";
import { YapeConfig, DEFAULT_YAPE_CONFIG } from "../lib/yapeService";
import { compressImageToWebP } from "../lib/webp-compressor";
import { supabase } from "../lib/supabase";

interface YapeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: YapeConfig;
  onSave: (updated: YapeConfig) => void;
}

export function YapeConfigModal({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}: YapeConfigModalProps) {
  const [config, setConfig] = useState<YapeConfig>(currentConfig);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
      setUploadSuccessMsg("");
      setErrorMsg("");
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const currentMode = config.mode;
  const isPersonal = currentMode === "personal";
  const activeQrUrl = isPersonal ? config.personalQrUrl : config.businessQrUrl;
  const defaultQrUrl = isPersonal ? DEFAULT_YAPE_CONFIG.personalQrUrl : DEFAULT_YAPE_CONFIG.businessQrUrl;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");
    setUploadSuccessMsg("");

    try {
      // 1. Optimización en navegador a formato WebP (800x800px max, 90% calidad para escaneo nítido)
      const compressed = await compressImageToWebP(file, 800, 800, 0.90);

      let finalUrl = compressed.dataUrl;

      // 2. Intento de subida al bucket de Supabase Storage
      try {
        const cleanFileName = `qr_yape_${currentMode}_${Date.now()}.webp`;
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
        console.warn("Storage upload fallback to optimized data URL:", storageErr);
      }

      // 3. Actualizar la URL del QR correspondiente al modo activo
      if (isPersonal) {
        setConfig((prev) => ({ ...prev, personalQrUrl: finalUrl }));
      } else {
        setConfig((prev) => ({ ...prev, businessQrUrl: finalUrl }));
      }

      setUploadSuccessMsg(
        `¡QR optimizado (${compressed.originalSizeKb} KB ➔ ${compressed.compressedSizeKb} KB WebP) y listo!`
      );
    } catch (err: any) {
      console.error("Error al procesar QR:", err);
      setErrorMsg("No se pudo procesar la imagen del QR. Intente con otro archivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRestoreDefaultQr = () => {
    if (isPersonal) {
      setConfig((prev) => ({ ...prev, personalQrUrl: DEFAULT_YAPE_CONFIG.personalQrUrl }));
    } else {
      setConfig((prev) => ({ ...prev, businessQrUrl: DEFAULT_YAPE_CONFIG.businessQrUrl }));
    }
    setUploadSuccessMsg("Se restauró el QR original predeterminado.");
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-200 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2D473C]">Configurar QR de Yape</h3>
              <p className="text-xs text-gray-500">Alternar modo, datos y cargar imagen de QR optimizada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selector de Modo */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, mode: "business" }))}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-2 ${
              !isPersonal
                ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <Building2 className={!isPersonal ? "text-emerald-700" : "text-gray-400"} size={20} />
              {!isPersonal && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </div>
            <div>
              <span className="font-bold text-xs uppercase block text-gray-900">Yape Empresa</span>
              <span className="text-xs text-gray-500 line-clamp-1">{config.businessName}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, mode: "personal" }))}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-2 ${
              isPersonal
                ? "border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-600"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <UserCheck className={isPersonal ? "text-purple-700" : "text-gray-400"} size={20} />
              {isPersonal && (
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </div>
            <div>
              <span className="font-bold text-xs uppercase block text-gray-900">Yape Personal</span>
              <span className="text-xs text-gray-500 line-clamp-1">{config.personalName}</span>
            </div>
          </button>
        </div>

        {/* Sección de Imagen del QR y Optimización */}
        <div className="p-4 rounded-2xl bg-[#F9F8F3] border border-[#EBE7D8] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className={isPersonal ? "text-purple-600" : "text-emerald-600"} />
              Imagen del Código QR ({isPersonal ? "Personal" : "Empresa"})
            </span>
            {activeQrUrl !== defaultQrUrl && (
              <button
                type="button"
                onClick={handleRestoreDefaultQr}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 hover:underline cursor-pointer"
                title="Restaurar QR predeterminado"
              >
                <RotateCcw size={12} />
                Restaurar original
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Miniatura del QR */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-gray-200 p-1.5 shadow-sm shrink-0 flex items-center justify-center overflow-hidden relative group">
              {activeQrUrl ? (
                <img
                  src={activeQrUrl}
                  alt={`QR Yape ${isPersonal ? "Personal" : "Empresa"}`}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <QrCode size={36} className="text-gray-300" />
              )}
            </div>

            {/* Acciones de Carga */}
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="yape-qr-file-input"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border ${
                  isPersonal
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                    : "bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700"
                } disabled:opacity-50`}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Optimizando a WebP...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Cargar / Actualizar QR</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-gray-500 leading-tight">
                Se optimiza y comprime automáticamente a formato WebP ultraligero para escaneo instantáneo.
              </p>
            </div>
          </div>

          {/* Feedback de Optimización */}
          {uploadSuccessMsg && (
            <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <Check size={14} className="text-emerald-700 shrink-0" strokeWidth={3} />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-red-100/80 border border-red-300 rounded-xl text-red-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="text-red-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Datos Editables del Modo Activo */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4 text-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
            Datos del Titular ({isPersonal ? "Personal" : "Empresarial"})
          </span>

          {isPersonal ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Titular Personal *
                </label>
                <input
                  type="text"
                  value={config.personalName}
                  onChange={(e) => setConfig((prev) => ({ ...prev, personalName: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Número Celular Personal (Opcional)
                </label>
                <input
                  type="text"
                  value={config.personalPhone || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, personalPhone: e.target.value }))}
                  placeholder="980 723 422"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-600"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Razón Social de la Empresa *
                </label>
                <input
                  type="text"
                  value={config.businessName}
                  onChange={(e) => setConfig((prev) => ({ ...prev, businessName: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Teléfono Empresa (Opcional)
                </label>
                <input
                  type="text"
                  value={config.businessPhone || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, businessPhone: e.target.value }))}
                  placeholder="967 456 230"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
            ℹ️ Al guardar, el carrito de compras de todos los clientes mostrará de forma inmediata el nuevo QR e información al pagar por Yape.
          </div>
        </div>

        {/* Botón de Guardado */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} strokeWidth={2.5} />
            <span>Aplicar y Guardar Configuración</span>
          </button>
        </div>

      </div>
    </div>
  );
}
