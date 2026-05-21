"use client";
import React, { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/Navigation";
import { fabricsService, Fabric } from "@/services/fabrics";

import { EmptyState } from "@/components/EmptyState";
import { FabricSkeleton } from "@/components/LoadingSkeleton";
import { useApi } from "@/hooks/useApi";
import { useCart } from "@/hooks/useCart";

const MATERIALS = ["Organic Cotton", "Recycled Polyester", "Tencel Lyocell", "Hemp Blend", "Silk", "Wool", "Cashmere", "Linen"];
const CERTS = ["GOTS", "OEKO-TEX", "Bluesign", "GRS"];

export default function TextilesPage() {
  const { data: fabrics, loading, error, execute } = useApi<Fabric[]>(fabricsService.getAll);
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());

  useEffect(() => { execute({ category: selectedCategory || undefined }); }, [selectedCategory, execute]);

  const toggleCert = (c: string) => setSelectedCerts(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-[1280px] mx-auto w-full px-5 md:px-16 grid grid-cols-1 lg:grid-cols-4 gap-6 pt-32 pb-20">

        {/* Sidebar Filters */}
        <aside className="hidden lg:flex flex-col gap-8 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-medium text-[#1d1a24]">Filters</h2>
            <button onClick={() => { setSelectedCategory(""); setSelectedCerts(new Set()); }} className="text-sm font-semibold text-[#4a4455] hover:text-[#5300b7] transition-colors">Reset</button>
          </div>

          {/* Material Type */}
          <div className="border-b border-[#ccc3d7]/30 pb-6">
            <h3 className="text-xs font-semibold text-[#1d1a24] mb-4 uppercase tracking-widest">Material</h3>
            <div className="flex flex-col gap-3">
              {MATERIALS.map((mat) => (
                <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategory === mat}
                    onChange={() => setSelectedCategory(selectedCategory === mat ? "" : mat)}
                    className="h-5 w-5 text-[#5300b7] border-[#ccc3d7] rounded focus:ring-[#5300b7] transition-all"
                  />
                  <span className="text-sm text-[#4a4455] group-hover:text-[#5300b7] transition-colors">{mat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="text-xs font-semibold text-[#1d1a24] mb-4 uppercase tracking-widest">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {CERTS.map((cert) => (
                <button
                  key={cert}
                  onClick={() => toggleCert(cert)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedCerts.has(cert) ? "bg-[#5300b7]/10 text-[#5300b7] border-[#5300b7]/20" : "bg-[#f3ebf9] text-[#4a4455] border-[#ccc3d7]/50 hover:bg-[#ccc3d7]/20"}`}
                >
                  {cert}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="lg:col-span-3 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-[#1d1a24] mb-2">Technical Textiles</h1>
              <p className="text-sm text-[#4a4455]">Direct-to-mill sustainable textile sourcing. Premium structural fibers, silk draping materials, high-performance yarns.</p>
            </div>
            <div className="flex items-center gap-4 bg-white rounded-full px-4 py-2 border border-[#ccc3d7]/20">
              <span className="text-xs font-semibold text-[#4a4455]">Sort by:</span>
              <select className="bg-transparent border-none text-sm text-[#1d1a24] focus:ring-0 cursor-pointer">
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-200 mb-8 max-w-xl">{error}</div>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => <FabricSkeleton key={i} />)}
            </div>
          ) : !fabrics || fabrics.length === 0 ? (
            <EmptyState icon="texture" title="No Raw Fabrics Registered" description="Suppliers haven't uploaded fabrics for this category yet." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {fabrics.map((fabric, idx) => (
                <article
                  key={fabric.id}
                  className={`bg-white rounded-2xl overflow-hidden group cursor-pointer border border-[#ccc3d7]/10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1 duration-300 flex flex-col ${idx === 0 ? "md:col-span-2 xl:col-span-2" : ""}`}
                >
                  <div className={`relative ${idx === 0 ? "h-[300px]" : "h-[220px]"} w-full bg-[#ede5f3] overflow-hidden p-4 flex flex-col justify-between`}>
                    <img src={fabric.image} alt={fabric.name} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700" />
                    <div className="relative z-10 flex justify-between items-start w-full">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] uppercase font-semibold text-[#1d1a24] tracking-wider">{fabric.category}</span>
                      </div>
                      <button className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#4a4455] hover:text-[#ba1a1a] transition-colors">
                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display text-lg font-medium text-[#1d1a24]">{fabric.name}</h3>
                      <span className="font-display text-lg text-[#5300b7]">₹{fabric.price}</span>
                    </div>
                    <p className="text-sm text-[#4a4455] mb-4 leading-relaxed line-clamp-2">{fabric.description}</p>
                    <div className="flex justify-end py-4 border-t border-[#ccc3d7]/20 mt-auto">
                      <div>
                        <p className="text-[10px] font-semibold text-[#4a4455] uppercase tracking-wider mb-1">Stock</p>
                        <p className="text-sm text-[#1d1a24]">{fabric.stock}</p>
                      </div>
                    </div>
                    <button 
                      disabled={fabric.stock <= 0}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addItem({
                          id: fabric.id,
                          name: fabric.name,
                          price: fabric.price,
                          image: fabric.image,
                          quantity: 1,
                          designer: fabric.supplier?.companyName || "Revora Sourcing"
                        });
                        alert("Added to cart!");
                      }} 
                      className={`mt-2 w-full py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${fabric.stock > 0 ? 'bg-[#332f39] text-white hover:bg-[#5300b7]' : 'bg-[#e8e0ee] text-[#7b7486] cursor-not-allowed'}`}
                    >
                      {fabric.stock > 0 ? 'Buy' : 'Out of Stock'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
