"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/features/auth/AuthContext";
import { productsService, Product } from "@/services/products";
import { kycService, KycVerification } from "@/services/kyc";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { StatusBadge } from "@/components/StatusBadge";

const NAV_ITEMS = [
  { key: "overview", icon: "dashboard", label: "Overview" },
  { key: "collections", icon: "auto_awesome_motion", label: "Collections" },
  { key: "marketplace", icon: "storefront", label: "Marketplace" },
  { key: "analytics", icon: "insights", label: "Analytics" },
  { key: "customers", icon: "group", label: "Customers" },
];

export default function DesignerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [kycStatus, setKycStatus] = useState<string>("NOT_SUBMITTED");
  const [kycRecord, setKycRecord] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("overview");

  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pCategory, setPCategory] = useState("Dresses");
  const [pStock, setPStock] = useState("");
  const [pImage, setPImage] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [gstLink, setGstLink] = useState("");
  const [panLink, setPanLink] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => { fetchDesignerData(); }, []);

  const fetchDesignerData = async () => {
    setLoading(true); setError("");
    try {
      const pRes = await productsService.getAll();
      setProducts(pRes.data);
      const kRes = await kycService.getStatus();
      setKycStatus(kRes.kycStatus);
      setKycRecord(kRes.kyc);
    } catch (err: any) { setError(err.message || "Failed to load dashboard data."); }
    finally { setLoading(false); }
  };

  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setUploadLoading(true); setUploadSuccess(false);
    try {
      const priceNum = Number(pPrice); const stockNum = Number(pStock);
      if (isNaN(priceNum) || priceNum <= 0) throw new Error("Price must be a valid positive number.");
      if (isNaN(stockNum) || stockNum <= 0) throw new Error("Stock must be a valid positive number.");
      
      let finalImage = pImage;
      if (!finalImage) {
        finalImage = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80";
      }

      await productsService.create({ name: pName, description: pDesc, price: priceNum, category: pCategory, stock: stockNum, image: finalImage });
      setUploadSuccess(true); setPName(""); setPDesc(""); setPPrice(""); setPStock(""); setPImage("");
      fetchDesignerData();
    } catch (err: any) { setError(err.message || "Product upload failed."); }
    finally { setUploadLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setKycLoading(true);
    try {
      await kycService.submit({ gstDoc: gstLink || "https://revora.storage/mock/gst_doc.pdf", panDoc: panLink || "https://revora.storage/mock/pan_doc.pdf", portfolio: portfolioLink || "https://behance.net/mock_portfolio" });
      alert("KYC documents submitted successfully!"); fetchDesignerData();
    } catch (err: any) { setError(err.message || "KYC submission failed."); }
    finally { setKycLoading(false); }
  };

  const approved = products.filter(p => p.status === "APPROVED").length;
  const pending = products.filter(p => p.status === "PENDING_APPROVAL").length;
  const totalRevenue = products.filter(p => p.status === "APPROVED").reduce((s, p) => s + p.price, 0);

  return (
    <ProtectedRoute allowedRoles={["DESIGNER"]}>
      <div className="bg-[#dfd7e5] text-[#1d1a24] antialiased flex min-h-screen">

        {/* ── Side Navigation ── */}
        <aside className="bg-[#f9f1ff] text-[#5300b7] h-screen w-72 fixed left-0 top-0 border-r border-[#ccc3d7]/30 flex flex-col gap-2 p-6 z-50">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#e8e0ee] flex-shrink-0 flex items-center justify-center text-lg font-bold text-[#5300b7]">
              {user?.name?.charAt(0).toUpperCase() ?? "D"}
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#5300b7] tracking-tight">{user?.name ?? "Designer"}</h2>
              <p className="text-xs text-[#4a4455] mt-0.5">{user?.email}</p>
            </div>
          </div>

          <nav className="flex-grow flex flex-col gap-1">
            {NAV_ITEMS.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveNav(key)}
                className={`flex items-center gap-3 p-3 rounded-2xl text-sm font-medium transition-all hover:translate-x-1 ${
                  activeNav === key
                    ? "bg-[#5300b7]/15 text-[#5300b7] font-semibold"
                    : "text-[#4a4455] hover:bg-[#e8e0ee]/50"
                }`}
              >
                <span className="material-symbols-outlined" style={activeNav === key ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-3 p-3 rounded-2xl text-sm text-[#4a4455] hover:bg-[#e8e0ee]/50 transition-all hover:translate-x-1">
              <span className="material-symbols-outlined">manage_accounts</span>
              My Account
            </button>
            <button onClick={() => router.push('/orders')} className="flex items-center gap-3 p-3 rounded-2xl text-sm text-[#4a4455] hover:bg-[#e8e0ee]/50 transition-all hover:translate-x-1">
              <span className="material-symbols-outlined">shopping_bag</span>
              My Orders
            </button>
            <button onClick={logout} className="flex items-center gap-3 p-3 rounded-2xl text-sm text-red-500 hover:bg-red-50 transition-all hover:translate-x-1">
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
            <button
              onClick={() => setActiveNav("upload")}
              className="w-full bg-[#5300b7] text-white text-sm font-semibold py-3 px-6 rounded-full hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Collection
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="ml-72 flex-grow min-h-screen p-16 flex flex-col gap-20 w-full max-w-[1280px]">

          {/* Header */}
          <header className="flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold text-[#5300b7] uppercase tracking-widest mb-1">Designer Studio</p>
              <h1 className="font-display text-3xl font-medium text-[#1d1a24] mb-1">Welcome back, {user?.name?.split(' ')[0] ?? 'Designer'} ✦</h1>
              <p className="text-sm text-[#4a4455]">Manage your active sourcing, inventory, and recent collections.</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 bg-[#f3ebf9] rounded-full px-4 py-2 border border-[#ccc3d7]/20">
                <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span className="text-xs font-semibold text-[#1d1a24]">Store Active</span>
              </div>
              <button className="w-10 h-10 rounded-full border border-[#ccc3d7]/50 flex items-center justify-center text-[#4a4455] hover:bg-[#e8e0ee] transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </header>

          {/* Error Banner */}
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-200">{error}</div>}

          {loading ? <DashboardSkeleton /> : (
            <div className="grid grid-cols-12 gap-6">

              {/* ── Analytics Card (8 cols) ── */}
              <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-6 border border-[#ccc3d7]/20 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-2xl font-medium text-[#1d1a24]">Revenue & Performance</h3>
                  <select className="bg-[#dfd7e5] border-none rounded-2xl text-xs font-semibold text-[#4a4455] focus:ring-1 focus:ring-[#5300b7] py-2 px-3">
                    <option>Last 30 Days</option>
                    <option>This Quarter</option>
                    <option>Year to Date</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#4a4455] mb-1">Collection Revenue</p>
                    <p className="font-display text-2xl font-medium text-[#1d1a24]">₹{totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-[#10b981] flex items-center mt-1"><span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>+{approved} active</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#4a4455] mb-1">Total Products</p>
                    <p className="font-display text-2xl font-medium text-[#1d1a24]">{products.length}</p>
                    <p className="text-sm text-[#10b981] flex items-center mt-1"><span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>{approved} approved</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#4a4455] mb-1">Pending Review</p>
                    <p className="font-display text-2xl font-medium text-[#1d1a24]">{pending}</p>
                    <p className="text-sm text-[#4a4455] flex items-center mt-1"><span className="material-symbols-outlined text-[16px] mr-1">schedule</span>Awaiting</p>
                  </div>
                </div>
                {/* Chart Bar */}
                <div className="h-48 w-full bg-[#e8e0ee]/30 rounded-2xl relative overflow-hidden flex items-end">
                  <div className="w-full h-full flex items-end justify-between px-4 pb-0 gap-2 opacity-60">
                    {[30, 45, 35, 60, 50, 75, 90, 40, 80, 95].map((h, i) => (
                      <div key={i} className="w-full bg-[#5300b7] rounded-t-sm" style={{ height: `${h}%`, opacity: 0.2 + i * 0.08 }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Upload Portal Card (4 cols) ── */}
              <div className="col-span-12 lg:col-span-4 bg-[#5300b7] text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-6 backdrop-blur-md">
                    <span className="material-symbols-outlined text-white">upload</span>
                  </div>
                  <h3 className="font-display text-2xl font-medium mb-2">Upload New Collection</h3>
                  <p className="text-sm opacity-80 mb-6">Launch your next editorial series directly to the marketplace.</p>
                </div>
                <form onSubmit={handleProductUpload} className="relative z-10 flex flex-col gap-3">
                  {uploadSuccess && <div className="bg-white/20 text-white text-xs font-semibold p-3 rounded-xl">✓ Published! Pending admin review.</div>}
                  <input required value={pName} onChange={e => setPName(e.target.value)} placeholder="Collection Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20" />
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="Price ($)" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20" />
                    <input required type="number" value={pStock} onChange={e => setPStock(e.target.value)} placeholder="Stock" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20" />
                  </div>
                  <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Description…" rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 resize-none" />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-semibold text-white/80">Product Image (Optional)</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-white/80 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 transition-all cursor-pointer" />
                    {pImage && pImage.startsWith('data:image') && <span className="text-[10px] text-green-300">✓ Image attached</span>}
                  </div>
                  <button type="submit" disabled={uploadLoading} className="w-full py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {uploadLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-sm">cloud_upload</span> Publish</>}
                  </button>
                </form>
              </div>

              {/* ── Inventory (6 cols) ── */}
              <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-6 border border-[#ccc3d7]/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display text-2xl font-medium text-[#1d1a24]">Studio Collection</h3>
                  <span className="text-xs font-semibold text-[#5300b7] hover:underline cursor-pointer">View All</span>
                </div>
                <div className="flex flex-col gap-3">
                  {products.length === 0 ? (
                    <p className="text-sm text-center py-8 text-[#4a4455]">No products uploaded yet.</p>
                  ) : products.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#e8e0ee]/30 transition-colors">
                      <div className="w-14 h-16 rounded-xl overflow-hidden bg-[#e8e0ee] flex-shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-xs font-semibold text-[#1d1a24] line-clamp-1">{p.name}</h4>
                        <p className="text-xs text-[#4a4455]">{p.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#1d1a24]">${p.price}</p>
                        <div className="mt-1">
                          <StatusBadge type="product" status={p.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── KYC (6 cols) ── */}
              <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-6 border border-[#ccc3d7]/20">
                <h3 className="font-display text-2xl font-medium text-[#1d1a24] mb-6">Designer KYC Center</h3>
                {kycStatus === "APPROVED" ? (
                  <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] rounded-2xl p-5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                    <div><p className="font-semibold text-sm">Verified Premium Designer</p><p className="text-xs opacity-90 mt-0.5">KYC credentials have been reviewed & verified.</p></div>
                  </div>
                ) : kycStatus === "SUBMITTED" ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">pending</span>
                    <div><p className="font-semibold text-sm">KYC Under Review</p><p className="text-xs opacity-90 mt-0.5">Our team is validating your certificates.</p></div>
                  </div>
                ) : (
                  <form onSubmit={handleKycSubmit} className="flex flex-col gap-4">
                    <p className="text-xs text-[#4a4455] leading-relaxed">Submit your brand identity documents to unlock marketplace listings and payments.</p>
                    {[
                      { label: "GSTIN Certificate Link", value: gstLink, onChange: (e: any) => setGstLink(e.target.value), placeholder: "https://drive.google.com/gst.pdf" },
                      { label: "PAN Card Image Link", value: panLink, onChange: (e: any) => setPanLink(e.target.value), placeholder: "https://drive.google.com/pan.jpg" },
                      { label: "Portfolio / Website", value: portfolioLink, onChange: (e: any) => setPortfolioLink(e.target.value), placeholder: "https://behance.net/portfolio" },
                    ].map(({ label, value, onChange, placeholder }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-semibold text-[#4a4455]">{label}</label>
                        <input type="url" required value={value} onChange={onChange} placeholder={placeholder} className="w-full text-sm p-3 bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl focus:outline-none focus:border-[#5300b7] focus:bg-white transition-all" />
                      </div>
                    ))}
                    <button type="submit" disabled={kycLoading} className="w-full py-3 bg-[#5300b7] text-white text-sm font-semibold rounded-full hover:scale-[1.02] transition-all shadow disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
                      {kycLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Submit KYC Verification"}
                    </button>
                  </form>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
