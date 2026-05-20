import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CouponCategory = "Restauracion" | "Moda" | "Tecnologia" | "Belleza" | "Hogar" | "Servicios" | "Ocio";

interface Coupon {
  id: string;
  merchantName: string;
  discountEuro: number;
  description: string;
  validUntil: string;
  category: CouponCategory;
  code: string;
  conditions: string;
  logoUrl?: string;
  updatedAt: string;
}

interface CouponFormState {
  merchantName: string;
  discountEuro: string;
  description: string;
  validUntil: string;
  category: CouponCategory;
  code: string;
  conditions: string;
  logoUrl: string;
}

const STORAGE_COUPONS_KEY = "cupozero_coupons_v1";
const STORAGE_ADMIN_KEY = "cupozero_admin_session_v1";
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || "CupoZero";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Zero1&Cupones2.";
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "34611473025";

const categories: CouponCategory[] = ["Restauracion", "Moda", "Tecnologia", "Belleza", "Hogar", "Servicios", "Ocio"];

const couponTemplate = {
  id: "",
  merchantName: "",
  discountEuro: "",
  description: "",
  validUntil: "",
  category: "Restauracion" as CouponCategory,
  code: "",
  conditions: "",
  logoUrl: "",
};

const defaultCoupons: Coupon[] = [
  {
    id: crypto.randomUUID(),
    merchantName: "TechNova Store",
    discountEuro: 20,
    description: "Descuento directo para accesorios y gadgets en pedidos online.",
    validUntil: "2026-12-31",
    category: "Tecnologia",
    code: "TNOVA20",
    conditions: "Valido para compras superiores a 60 EUR",
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    merchantName: "Urban Moda",
    discountEuro: 15,
    description: "Ahorra en coleccion nueva de temporada para mujer y hombre.",
    validUntil: "2026-10-15",
    category: "Moda",
    code: "URBAN15",
    conditions: "Valido hasta agotar stock",
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    merchantName: "Casa Plus",
    discountEuro: 30,
    description: "Oferta especial para articulos de cocina y organizacion del hogar.",
    validUntil: "2026-11-20",
    category: "Hogar",
    code: "HOGAR30",
    conditions: "Valido para compras superiores a 120 EUR",
    updatedAt: new Date().toISOString(),
  },
];

function sanitizeText(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function loadCoupons() {
  const stored = localStorage.getItem(STORAGE_COUPONS_KEY);
  if (!stored) return defaultCoupons;
  try {
    const parsed = JSON.parse(stored) as Coupon[];
    if (!Array.isArray(parsed)) return defaultCoupons;
    return parsed;
  } catch {
    return defaultCoupons;
  }
}

function App() {
  const [coupons, setCoupons] = useState<Coupon[]>(() => loadCoupons());
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMerchant, setFilterMerchant] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(localStorage.getItem(STORAGE_ADMIN_KEY) === "ok");
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [formState, setFormState] = useState<CouponFormState>(couponTemplate);

  useEffect(() => {
    document.title = "CupoZero | Cupones de Descuento";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Marketplace de cupones de descuento con QR automatico, filtros y panel privado de administracion."
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_COUPONS_KEY, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_COUPONS_KEY) {
        setCoupons(loadCoupons());
      }
      if (event.key === STORAGE_ADMIN_KEY) {
        setIsAdminAuth(localStorage.getItem(STORAGE_ADMIN_KEY) === "ok");
      }
    };
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const merchants = useMemo(
    () => Array.from(new Set(coupons.map((coupon) => coupon.merchantName))).sort((a, b) => a.localeCompare(b)),
    [coupons]
  );

  const filteredCoupons = useMemo(() => {
    return coupons
      .filter((coupon) => {
        const matchesQuery =
          coupon.merchantName.toLowerCase().includes(search.toLowerCase()) ||
          coupon.description.toLowerCase().includes(search.toLowerCase()) ||
          coupon.code.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === "all" || coupon.category === filterCategory;
        const matchesMerchant = filterMerchant === "all" || coupon.merchantName === filterMerchant;
        const matchesDate = !filterDate || coupon.validUntil >= filterDate;
        return matchesQuery && matchesCategory && matchesMerchant && matchesDate;
      })
      .sort((a, b) => a.validUntil.localeCompare(b.validUntil));
  }, [coupons, search, filterCategory, filterMerchant, filterDate]);

  const previewCoupon: Coupon = {
    id: "preview",
    merchantName: sanitizeText(formState.merchantName) || "Nombre del comercio",
    discountEuro: Number(formState.discountEuro) || 0,
    description: sanitizeText(formState.description) || "Descripcion del cupon",
    validUntil: formState.validUntil || new Date().toISOString().slice(0, 10),
    category: formState.category,
    code: sanitizeText(formState.code) || "CODIGO10",
    conditions: sanitizeText(formState.conditions) || "Valido para compras superiores a X EUR",
    logoUrl: formState.logoUrl,
    updatedAt: new Date().toISOString(),
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 1200);
  };

  const handleAdminLogin = (event: FormEvent) => {
    event.preventDefault();
    if (adminUser === ADMIN_USER && adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_ADMIN_KEY, "ok");
      setIsAdminAuth(true);
      setLoginError("");
      setAdminPassword("");
      return;
    }
    setLoginError("Credenciales invalidas.");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(STORAGE_ADMIN_KEY);
    setIsAdminAuth(false);
    setEditingId(null);
    setFormState(couponTemplate);
  };

  const readLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setFormState((current) => ({ ...current, logoUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormState(couponTemplate);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmitCoupon = (event: FormEvent) => {
    event.preventDefault();
    const merchantName = sanitizeText(formState.merchantName);
    const description = sanitizeText(formState.description);
    const code = sanitizeText(formState.code).toUpperCase();
    const conditions = sanitizeText(formState.conditions);
    const discountEuro = Number(formState.discountEuro);

    if (!merchantName || !description || !code || !formState.validUntil || !conditions) {
      setFormError("Todos los campos obligatorios deben completarse.");
      return;
    }
    if (!Number.isFinite(discountEuro) || discountEuro <= 0) {
      setFormError("El descuento en EUR debe ser mayor que 0.");
      return;
    }

    const nextCoupon: Coupon = {
      id: editingId || crypto.randomUUID(),
      merchantName,
      discountEuro,
      description,
      validUntil: formState.validUntil,
      category: formState.category,
      code,
      conditions,
      logoUrl: formState.logoUrl,
      updatedAt: new Date().toISOString(),
    };

    setCoupons((current) => {
      if (editingId) {
        return current.map((coupon) => (coupon.id === editingId ? nextCoupon : coupon));
      }
      return [nextCoupon, ...current];
    });

    resetForm();
  };

  const startEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormError("");
    setFormState({
      merchantName: coupon.merchantName,
      discountEuro: String(coupon.discountEuro),
      description: coupon.description,
      validUntil: coupon.validUntil,
      category: coupon.category,
      code: coupon.code,
      conditions: coupon.conditions,
      logoUrl: coupon.logoUrl || "",
    });
  };

  const handleDelete = (id: string) => {
    setCoupons((current) => current.filter((coupon) => coupon.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.25),transparent_45%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl font-semibold tracking-tight">CupoZero</p>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/10"
            >
              Panel administrador
            </button>
          </div>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Cupones listos para usar en tu marketplace.</h1>
            <p className="text-base text-slate-200 sm:text-lg">
              Busca, filtra y copia codigos de descuento con QR automatico para usar cuando quieras.
            </p>
          </div>
        </motion.div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section aria-label="Filtros" className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cupon, codigo o comercio"
            className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring"
          />
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring"
          >
            <option value="all">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filterMerchant}
            onChange={(event) => setFilterMerchant(event.target.value)}
            className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring"
          >
            <option value="all">Todos los comercios</option>
            {merchants.map((merchant) => (
              <option key={merchant} value={merchant}>
                {merchant}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(event) => setFilterDate(event.target.value)}
            className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring"
          />
        </section>

        <section aria-label="Listado de cupones">
          {filteredCoupons.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 px-4 py-8 text-center text-slate-300">
              No hay cupones para esta busqueda.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredCoupons.map((coupon) => (
                  <motion.article
                    layout
                    key={coupon.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ y: -4 }}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-indigo-300">{coupon.category}</p>
                          <h2 className="text-xl font-semibold">{coupon.merchantName}</h2>
                        </div>
                        {coupon.logoUrl ? (
                          <img src={coupon.logoUrl} alt={`Logo ${coupon.merchantName}`} className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/20 text-lg font-semibold">
                            {coupon.merchantName.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <p className="text-3xl font-semibold text-emerald-300">-{coupon.discountEuro} EUR</p>
                      <p className="text-sm text-slate-300">{coupon.description}</p>
                      <p className="text-xs text-slate-400">Valido hasta {formatDate(coupon.validUntil)}</p>
                      <p className="text-xs text-slate-400">{coupon.conditions}</p>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                        <span className="text-sm font-semibold tracking-widest text-indigo-200">{coupon.code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(coupon.code)}
                          className="rounded-md bg-indigo-500 px-3 py-1 text-xs font-semibold hover:bg-indigo-400"
                        >
                          {copiedCode === coupon.code ? "Copiado" : "Copiar codigo"}
                        </button>
                      </div>
                      <div className="flex justify-center rounded-lg bg-white p-2">
                        <QRCodeSVG value={coupon.code} size={104} includeMargin />
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {isAdminOpen && (
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 p-3 sm:p-6"
            onClick={() => setIsAdminOpen(false)}
          >
            <motion.div
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="ml-auto h-full w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/20 bg-slate-950 p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Panel de administracion</h2>
                <button type="button" onClick={() => setIsAdminOpen(false)} className="rounded-lg border border-white/20 px-3 py-1">
                  Cerrar
                </button>
              </div>

              {!isAdminAuth ? (
                <form onSubmit={handleAdminLogin} className="space-y-3 rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-slate-300">Acceso privado para administrador autorizado.</p>
                  <input
                    value={adminUser}
                    onChange={(event) => setAdminUser(event.target.value)}
                    placeholder="Usuario"
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                  />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    placeholder="Password"
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                  />
                  {loginError && <p className="text-sm text-rose-300">{loginError}</p>}
                  <button type="submit" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400">
                    Entrar
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAdminLogout}
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
                    >
                      Cerrar sesion
                    </button>
                  </div>

                  <form onSubmit={handleSubmitCoupon} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
                    <input
                      value={formState.merchantName}
                      onChange={(event) => setFormState((curr) => ({ ...curr, merchantName: event.target.value }))}
                      placeholder="Nombre del comercio"
                      className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                    />
                    <select
                      value={formState.category}
                      onChange={(event) => setFormState((curr) => ({ ...curr, category: event.target.value as CouponCategory }))}
                      className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      value={formState.discountEuro}
                      onChange={(event) => setFormState((curr) => ({ ...curr, discountEuro: event.target.value }))}
                      placeholder="Descuento EUR"
                      inputMode="decimal"
                      className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={formState.validUntil}
                      onChange={(event) => setFormState((curr) => ({ ...curr, validUntil: event.target.value }))}
                      className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                    />
                    <input
                      value={formState.code}
                      onChange={(event) => setFormState((curr) => ({ ...curr, code: event.target.value }))}
                      placeholder="Codigo del cupon"
                      className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                    />
                    <input
                      value={formState.conditions}
                      onChange={(event) => setFormState((curr) => ({ ...curr, conditions: event.target.value }))}
                      placeholder="Condiciones"
                      className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={formState.description}
                      onChange={(event) => setFormState((curr) => ({ ...curr, description: event.target.value }))}
                      placeholder="Descripcion"
                      className="sm:col-span-2 min-h-20 rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm"
                    />
                    <label className="sm:col-span-2 rounded-xl border border-dashed border-white/20 p-3 text-sm text-slate-300">
                      Logo del comercio
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-2 block w-full text-sm"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) readLogo(file);
                        }}
                      />
                    </label>
                    {formError && <p className="sm:col-span-2 text-sm text-rose-300">{formError}</p>}
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold hover:bg-emerald-400">
                        {editingId ? "Guardar cambios" : "Publicar cupon"}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                      >
                        Limpiar
                      </button>
                    </div>
                  </form>

                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold">Vista previa</h3>
                    <div className="max-w-sm">
                      <article className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                        <p className="text-sm text-indigo-300">{previewCoupon.category}</p>
                        <h4 className="text-xl font-semibold">{previewCoupon.merchantName}</h4>
                        <p className="text-3xl font-semibold text-emerald-300">-{previewCoupon.discountEuro} EUR</p>
                        <p className="text-sm text-slate-300">{previewCoupon.description}</p>
                        <p className="text-xs text-slate-400">Valido hasta {formatDate(previewCoupon.validUntil)}</p>
                        <p className="rounded-md bg-black/30 px-3 py-2 text-sm font-semibold tracking-widest text-indigo-200">{previewCoupon.code}</p>
                        <div className="flex justify-center rounded-lg bg-white p-2">
                          <QRCodeSVG value={previewCoupon.code} size={104} includeMargin />
                        </div>
                      </article>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold">Gestion de cupones</h3>
                    <div className="space-y-2">
                      {coupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
                        >
                          <p className="text-sm">
                            {coupon.merchantName} - <span className="text-indigo-300">{coupon.code}</span>
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(coupon)}
                              className="rounded-md bg-indigo-500 px-3 py-1 text-xs font-semibold hover:bg-indigo-400"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(coupon.id)}
                              className="rounded-md bg-rose-500 px-3 py-1 text-xs font-semibold hover:bg-rose-400"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-600/30 hover:bg-emerald-400"
      >
        WhatsApp
      </a>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-20 right-5 z-40 rounded-full border border-white/20 bg-slate-900 px-3 py-2 text-sm"
          >
            Volver arriba
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
