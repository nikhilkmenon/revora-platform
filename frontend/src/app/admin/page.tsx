"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Navbar, Footer } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { TableRowSkeleton } from "@/components/LoadingSkeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { kycService } from "@/services/kyc";
import { productsService } from "@/services/products";
import { ordersService } from "@/services/orders";
import { fabricsService } from "@/services/fabrics";
import type { KycVerification, Product, Order, Fabric } from "@/types";

type AdminTab = "kyc" | "products" | "orders" | "fabrics";

const TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: "kyc", label: "KYC Queue", icon: "verified_user" },
  { key: "products", label: "Product Approvals", icon: "inventory_2" },
  { key: "orders", label: "Escrows & Orders", icon: "payments" },
  { key: "fabrics", label: "Raw Materials", icon: "texture" },
];

const FABRIC_CATEGORIES = ["Silk", "Wool", "Cotton", "Linen", "Cashmere", "Recycled Polyester", "Tencel Lyocell", "Hemp Blend"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("kyc");
  const [kycQueue, setKycQueue] = useState<KycVerification[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [productMode, setProductMode] = useState<"pending" | "live">("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [liveFabrics, setLiveFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [kycPage, setKycPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  // Fabric upload form
  const [fabricForm, setFabricForm] = useState({ name: "", description: "", pricePerYard: "", moq: "1", category: "Silk", stock: "", image: "" });
  const [fabricLoading, setFabricLoading] = useState(false);
  const [fabricSuccess, setFabricSuccess] = useState(false);

  const PAGE_SIZE = 10;

  const fetchAdminData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [kRes, pRes, lRes, oRes, fRes] = await Promise.all([
        kycService.getQueue(),
        productsService.getAll({ status: "PENDING_APPROVAL", limit: 100 }),
        productsService.getAll({ status: "APPROVED", limit: 100 }),
        ordersService.getAll(),
        fabricsService.getAll()
      ]);
      setKycQueue(kRes);
      setPendingProducts(pRes.data);
      setLiveProducts(lRes.data);
      setOrders(oRes);
      setLiveFabrics(fRes);
    } catch (err: any) { setError(err.message || "Failed to load admin data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAdminData(); }, []);

  const act = async (key: string, fn: () => Promise<any>) => {
    setActionLoading(key);
    try { await fn(); fetchAdminData(); }
    catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleApproveKyc = (id: string) => act(`kyc-${id}`, () => kycService.approve(id));
  const handleRejectKyc = (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    act(`kyc-${id}`, () => kycService.reject(id, reason));
  };
  const handleApproveProduct = (id: string) => act(`prod-${id}`, () => productsService.approve(id));
  const handleRejectProduct = (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    act(`prod-${id}`, () => productsService.reject(id, reason));
  };
  const handleDeleteProduct = (id: string) => {
    if (!confirm("Are you sure you want to delete this live product listing?")) return;
    act(`del-${id}`, () => productsService.remove(id));
  };
  const handleDeleteFabric = (id: string) => {
    if (!confirm("Are you sure you want to delete this raw material?")) return;
    act(`delfab-${id}`, () => fabricsService.remove(id));
  };
  const handleRefund = (id: string) => {
    if (!confirm("Refund this order?")) return;
    act(`ref-${id}`, () => ordersService.refund(id));
  };

  const handleFabricUpload = async (e: React.FormEvent) => {
    e.preventDefault(); setFabricLoading(true); setFabricSuccess(false);
    try {
      const images = fabricForm.image ? [fabricForm.image] : [];
      await fabricsService.create({
        name: fabricForm.name,
        description: fabricForm.description,
        pricePerYard: Number(fabricForm.pricePerYard),
        moq: Number(fabricForm.moq) || 1,
        category: fabricForm.category,
        stock: Number(fabricForm.stock),
        images,
      });
      setFabricSuccess(true);
      setFabricForm({ name: "", description: "", pricePerYard: "", moq: "1", category: "Silk", stock: "", image: "" });
    } catch (err: any) { alert(err.message); }
    finally { setFabricLoading(false); }
  };

  const handleFabricImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFabricForm(f => ({ ...f, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  // Paginated slices
  const kycSlice = kycQueue.slice((kycPage - 1) * PAGE_SIZE, kycPage * PAGE_SIZE);
  const prodSlice = pendingProducts.slice((productPage - 1) * PAGE_SIZE, productPage * PAGE_SIZE);
  const orderSlice = orders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <Navbar />
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-5 md:px-16 pt-32 pb-20">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold text-[#5300b7] uppercase tracking-widest block mb-2">System Admin</span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-[#1d1a24]">Welcome, {user?.name?.split(' ')[0] ?? 'Admin'}</h1>
            <p className="text-sm text-[#4a4455] mt-1">Revora Admin Portal · {user?.email}</p>
          </div>
          <div className="flex items-center gap-2 bg-[#f3ebf9] rounded-full px-4 py-2 border border-[#ccc3d7]/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-[#1d1a24]">Live Monitoring Active</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-200 mb-8">{error}</div>}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "System Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: "payments", color: "text-[#5300b7]" },
            { label: "Total Orders", value: orders.length, icon: "shopping_bag", color: "text-[#1d1a24]" },
            { label: "Live Products", value: liveProducts.length, icon: "store", color: "text-green-600" },
            { label: "Awaiting Approval", value: pendingProducts.length, icon: "inventory_2", color: "text-[#0051d5]" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-5">
              <span className={`material-symbols-outlined text-2xl ${color} mb-2 block`}>{icon}</span>
              <p className="text-xs font-semibold text-[#4a4455] mb-1">{label}</p>
              <p className={`font-display text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-[#ccc3d7]/20 pb-0 overflow-x-auto">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === key ? "border-[#5300b7] text-[#5300b7]" : "border-transparent text-[#4a4455] hover:text-[#5300b7]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
              {key === "kyc" && kycQueue.length > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{kycQueue.length}</span>}
              {key === "products" && pendingProducts.length > 0 && <span className="bg-[#5300b7]/10 text-[#5300b7] text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingProducts.length}</span>}
            </button>
          ))}
        </div>

        {/* ── KYC Tab ── */}
        {tab === "kyc" && (
          <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ccc3d7]/10">
              <h3 className="font-display text-lg font-semibold text-[#1d1a24]">Designer KYC Verification Queue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f9f1ff] text-[#4a4455] text-[11px] uppercase font-semibold tracking-wider border-b border-[#ccc3d7]/20">
                  <tr>
                    <th className="py-3 px-6">Designer</th>
                    <th className="py-3 px-6">GST Certificate</th>
                    <th className="py-3 px-6">PAN Card</th>
                    <th className="py-3 px-6">Portfolio</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ccc3d7]/10 text-sm">
                  {loading ? [1, 2].map(i => <TableRowSkeleton key={i} />) :
                    kycSlice.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center"><EmptyState icon="verified_user" title="No pending KYCs" description="All designer verifications are up to date." /></td></tr>
                    ) : kycSlice.map(kyc => (
                      <tr key={kyc.id} className="hover:bg-[#f9f1ff]/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-[#1d1a24]">{kyc.designer?.user?.name ?? "—"}</p>
                          <p className="text-xs text-[#4a4455]">{kyc.designer?.user?.email ?? "—"}</p>
                        </td>
                        <td className="py-4 px-6">
                          {kyc.gstDoc ? <a href={kyc.gstDoc} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#5300b7] hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">open_in_new</span>GST.pdf</a> : "—"}
                        </td>
                        <td className="py-4 px-6">
                          {kyc.panDoc ? <a href={kyc.panDoc} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#5300b7] hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">open_in_new</span>PAN.jpg</a> : "—"}
                        </td>
                        <td className="py-4 px-6">
                          {kyc.portfolio ? <a href={kyc.portfolio} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0051d5] hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">open_in_new</span>Portfolio</a> : "—"}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button onClick={() => handleApproveKyc(kyc.designerId)} disabled={actionLoading === `kyc-${kyc.designerId}`} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold uppercase rounded-full hover:bg-green-700 disabled:opacity-50 transition-all">Approve</button>
                          <button onClick={() => handleRejectKyc(kyc.designerId)} disabled={actionLoading === `kyc-${kyc.designerId}`} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase rounded-full hover:bg-red-700 disabled:opacity-50 transition-all">Reject</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <Pagination currentPage={kycPage} totalPages={Math.ceil(kycQueue.length / PAGE_SIZE)} onPageChange={setKycPage} />
          </div>
        )}

        {tab === "products" && (
          <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ccc3d7]/10 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#1d1a24]">Product Management</h3>
              <div className="flex bg-[#f3ebf9] p-1 rounded-lg">
                <button onClick={() => setProductMode("pending")} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${productMode === "pending" ? "bg-white text-[#5300b7] shadow-sm" : "text-[#4a4455]"}`}>Pending</button>
                <button onClick={() => setProductMode("live")} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${productMode === "live" ? "bg-white text-[#5300b7] shadow-sm" : "text-[#4a4455]"}`}>Live Listings</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f9f1ff] text-[#4a4455] text-[11px] uppercase font-semibold tracking-wider border-b border-[#ccc3d7]/20">
                  <tr>
                    <th className="py-3 px-6">Product</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Price</th>
                    <th className="py-3 px-6">Stock</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ccc3d7]/10 text-sm">
                  {loading ? [1, 2].map(i => <TableRowSkeleton key={i} />) :
                    (productMode === "pending" ? prodSlice : liveProducts.slice((productPage - 1) * PAGE_SIZE, productPage * PAGE_SIZE)).length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center"><EmptyState icon="inventory_2" title={productMode === "pending" ? "No pending products" : "No live products"} description={productMode === "pending" ? "All product listings have been reviewed." : "No products are currently live."} /></td></tr>
                    ) : (productMode === "pending" ? prodSlice : liveProducts.slice((productPage - 1) * PAGE_SIZE, productPage * PAGE_SIZE)).map(p => (
                      <tr key={p.id} className="hover:bg-[#f9f1ff]/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 rounded-xl overflow-hidden bg-[#dfd7e5] flex-shrink-0">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#1d1a24] line-clamp-1">{p.name}</p>
                              <p className="text-[10px] text-[#4a4455] uppercase tracking-wider">{p.designer?.brandName ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[#4a4455]">{p.category}</td>
                        <td className="py-4 px-6 font-semibold text-[#5300b7]">₹{p.price.toLocaleString()}</td>
                        <td className="py-4 px-6 text-[#4a4455]">{p.stock}</td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {productMode === "pending" ? (
                            <>
                              <button onClick={() => handleApproveProduct(p.id)} disabled={actionLoading === `prod-${p.id}`} className="px-3 py-1.5 bg-[#5300b7] text-white text-xs font-bold uppercase rounded-full hover:bg-[#5300b7]/80 disabled:opacity-50 transition-all">Approve</button>
                              <button onClick={() => handleRejectProduct(p.id)} disabled={actionLoading === `prod-${p.id}`} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase rounded-full hover:bg-red-700 disabled:opacity-50 transition-all">Reject</button>
                            </>
                          ) : (
                            <button onClick={() => handleDeleteProduct(p.id)} disabled={actionLoading === `del-${p.id}`} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-full hover:bg-red-200 disabled:opacity-50 transition-all">Delete Listing</button>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <Pagination currentPage={productPage} totalPages={Math.ceil((productMode === "pending" ? pendingProducts : liveProducts).length / PAGE_SIZE)} onPageChange={setProductPage} />
          </div>
        )}

        {/* ── Orders / Escrow Tab ── */}
        {tab === "orders" && (
          <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ccc3d7]/10">
              <h3 className="font-display text-lg font-semibold text-[#1d1a24]">System Escrows & Payouts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f9f1ff] text-[#4a4455] text-[11px] uppercase font-semibold tracking-wider border-b border-[#ccc3d7]/20">
                  <tr>
                    <th className="py-3 px-6">Order ID</th>
                    <th className="py-3 px-6">Items</th>
                    <th className="py-3 px-6">Razorpay ID</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Payment</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ccc3d7]/10 text-sm">
                  {loading ? [1, 2].map(i => <TableRowSkeleton key={i} />) :
                    orderSlice.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center"><EmptyState icon="payments" title="No orders yet" description="Orders will appear here once buyers start purchasing." /></td></tr>
                    ) : orderSlice.map(order => (
                      <tr key={order.id} className="hover:bg-[#f9f1ff]/50 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs text-[#4a4455]">…{order.id.slice(-8)}</td>
                        <td className="py-4 px-6 text-xs text-[#1d1a24]">
                          {order.items?.length 
                            ? order.items.map(i => `${i.product?.name || 'Item'} (x${i.quantity})`).join(', ') 
                            : "—"}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-[#7b7486]">{order.razorpayOrderId?.slice(-12) ?? "—"}</td>
                        <td className="py-4 px-6 font-semibold text-[#5300b7]">₹{order.total.toLocaleString()}</td>
                        <td className="py-4 px-6">{order.payment ? <StatusBadge type="payment" status={order.payment.status} /> : "—"}</td>
                        <td className="py-4 px-6"><StatusBadge type="order" status={order.status} /></td>
                        <td className="py-4 px-6 text-right">
                          {order.payment?.status === "CAPTURED" && (
                            <button onClick={() => handleRefund(order.id)} disabled={actionLoading === `ref-${order.id}`} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase rounded-full hover:bg-red-700 disabled:opacity-50 transition-all">Refund</button>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <Pagination currentPage={orderPage} totalPages={Math.ceil(orders.length / PAGE_SIZE)} onPageChange={setOrderPage} />
          </div>
        )}

        {/* ── Fabrics / Raw Materials Tab ── */}
        {tab === "fabrics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-6">
                <h3 className="font-display text-xl font-semibold text-[#1d1a24] mb-6">Upload Raw Material</h3>
                {fabricSuccess && (
                  <div className="bg-green-50 text-green-700 text-sm font-semibold p-3 rounded-xl border border-green-200 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Raw material uploaded successfully!
                  </div>
                )}
                <form onSubmit={handleFabricUpload} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-semibold text-[#4a4455] block mb-1">Material Name *</label>
                      <input required value={fabricForm.name} onChange={e => setFabricForm(f => ({ ...f, name: e.target.value }))} placeholder="Organic Silk Charmeuse" className="w-full text-sm p-3 bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl focus:outline-none focus:border-[#5300b7] focus:bg-white transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-semibold text-[#4a4455] block mb-1">Description</label>
                      <textarea required value={fabricForm.description} onChange={e => setFabricForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Premium sustainable silk…" className="w-full text-sm p-3 bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl focus:outline-none focus:border-[#5300b7] focus:bg-white transition-all resize-none" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-[#4a4455] block mb-1">Category *</label>
                      <select required value={fabricForm.category} onChange={e => setFabricForm(f => ({ ...f, category: e.target.value }))} className="w-full text-sm p-3 bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl focus:outline-none focus:border-[#5300b7] focus:bg-white transition-all">
                        {FABRIC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-[#4a4455] block mb-1">Price (₹) *</label>
                      <input required type="number" min="0.01" step="0.01" value={fabricForm.pricePerYard} onChange={e => setFabricForm(f => ({ ...f, pricePerYard: e.target.value }))} placeholder="45.00" className="w-full text-sm p-3 bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl focus:outline-none focus:border-[#5300b7] focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-[#4a4455] block mb-1">MOQ</label>
                      <input type="number" min="1" value={fabricForm.moq} onChange={e => setFabricForm(f => ({ ...f, moq: e.target.value }))} placeholder="10" className="w-full text-sm p-3 bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl focus:outline-none focus:border-[#5300b7] focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-[#4a4455] block mb-1">Stock *</label>
                      <input required type="number" min="1" value={fabricForm.stock} onChange={e => setFabricForm(f => ({ ...f, stock: e.target.value }))} placeholder="500" className="w-full text-sm p-3 bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl focus:outline-none focus:border-[#5300b7] focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-[#4a4455] block mb-1">Material Image (Optional)</label>
                      <input type="file" accept="image/*" onChange={handleFabricImageUpload} className="w-full text-sm text-[#4a4455] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#5300b7]/10 file:text-[#5300b7] hover:file:bg-[#5300b7]/20 transition-all cursor-pointer bg-[#f9f1ff] border border-[#ccc3d7]/40 rounded-xl" />
                      {fabricForm.image && fabricForm.image.startsWith('data:image') && <span className="text-[10px] text-green-600 font-semibold mt-1 block">✓ Image attached</span>}
                    </div>
                  </div>
                  <button type="submit" disabled={fabricLoading} className="w-full py-3 bg-[#5300b7] text-white text-sm font-semibold rounded-full hover:scale-[1.02] transition-all shadow disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                    {fabricLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-sm">upload</span>Publish Material</>}
                  </button>
                </form>
              </div>

              <div className="bg-[#f9f1ff] rounded-2xl border border-[#ccc3d7]/20 p-6 flex flex-col">
                <h3 className="font-display text-xl font-semibold text-[#1d1a24] mb-4">Upload Guidelines</h3>
                <div className="space-y-4 flex-grow">
                  {[
                    { icon: "check_circle", title: "Accepted Formats", desc: "Use direct HTTPS image URLs (Unsplash, Cloudinary, etc.)" },
                    { icon: "inventory_2", title: "Stock Accuracy", desc: "Enter the actual unit count. Designers will see this in real-time." },
                    { icon: "payments", title: "Pricing", desc: "Price is per unit in ₹. Use decimal precision (e.g., 12.50)." },
                    { icon: "category", title: "Categories", desc: "Select the most specific material category for accurate filtering." },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#5300b7] text-xl mt-0.5">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#1d1a24]">{title}</p>
                        <p className="text-xs text-[#4a4455]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ccc3d7]/10">
                <h3 className="font-display text-lg font-semibold text-[#1d1a24]">Manage Live Raw Materials</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f9f1ff] text-[#4a4455] text-[11px] uppercase font-semibold tracking-wider border-b border-[#ccc3d7]/20">
                    <tr>
                      <th className="py-3 px-6">Material</th>
                      <th className="py-3 px-6">Category</th>
                      <th className="py-3 px-6">Price</th>
                      <th className="py-3 px-6">Stock</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ccc3d7]/10 text-sm">
                    {loading ? [1, 2].map(i => <TableRowSkeleton key={i} />) :
                      liveFabrics.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center"><EmptyState icon="texture" title="No live fabrics" description="Upload raw materials to start offering them to designers." /></td></tr>
                      ) : liveFabrics.map(f => (
                        <tr key={f.id} className="hover:bg-[#f9f1ff]/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 rounded-xl overflow-hidden bg-[#dfd7e5] flex-shrink-0">
                                <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-semibold text-[#1d1a24] line-clamp-1">{f.name}</p>
                                <p className="text-[10px] text-[#4a4455] uppercase tracking-wider">{f.id.slice(-8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[#4a4455]">{f.category}</td>
                          <td className="py-4 px-6 font-semibold text-[#5300b7]">₹{f.price.toLocaleString()}</td>
                          <td className="py-4 px-6 text-[#4a4455]">{f.stock}</td>
                          <td className="py-4 px-6 text-right">
                            <button onClick={() => handleDeleteFabric(f.id)} disabled={actionLoading === `delfab-${f.id}`} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-full hover:bg-red-200 disabled:opacity-50 transition-all">Delete</button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </ProtectedRoute>
  );
}
