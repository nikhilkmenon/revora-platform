"use client";

import React from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/Navigation";
import { useApi } from "@/hooks/useApi";
import { productsService } from "@/services/products";
import type { Product } from "@/types";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { data: response, loading, execute } = useApi(productsService.getAll);
  const [topProducts, setTopProducts] = useState<Product[]>([]);

  useEffect(() => {
    execute();
  }, [execute]);

  useEffect(() => {
    if (response?.data) {
      const approved = response.data.filter(p => p.status === "APPROVED");
      const sorted = approved.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTopProducts(sorted.slice(0, 3));
    }
  }, [response]);

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white selection:bg-[#5300b7] selection:text-white overflow-hidden">
      <Navbar />
      
      {/* Immersive Hero Section */}
      <main className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2940&auto=format&fit=crop"
            alt="Immersive cinematic fashion"
            className="w-full h-full object-cover opacity-40 scale-105 animate-[pulse_10s_ease-in-out_infinite_alternate]"
          />
          {/* Deep Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/40 to-[#0a0a0a]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1400px] px-6 md:px-16 pt-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-[#5300b7] animate-pulse"></span>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-white/80">Revora OS</span>
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl lg:text-[120px] font-bold tracking-tighter leading-none mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30">
            FASHION <br className="hidden md:block" /> UNBOUND
          </h1>
          
          <p className="font-body text-lg md:text-xl text-white/60 max-w-2xl mb-16 leading-relaxed font-light">
            The decentralized luxury ecosystem. Discover bespoke collections, source structural textiles, and launch your studio with zero friction.
          </p>

          {/* Glassmorphic Portal Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            {[
              { title: "Marketplace", desc: "Curated collections", icon: "shopping_bag", href: "/shop" },
              { title: "Studio", desc: "Designer workspace", icon: "palette", href: "/designer" },
              { title: "Textiles", desc: "Raw material sourcing", icon: "texture", href: "/textiles" }
            ].map((portal, idx) => (
              <Link
                key={idx}
                href={portal.href}
                className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl hover:bg-white/10 hover:border-[#5300b7]/50 transition-all duration-500 text-left flex flex-col gap-4"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-[#5300b7]/0 via-[#5300b7]/10 to-[#5300b7]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>
                <span className="material-symbols-outlined text-4xl text-white/40 group-hover:text-white transition-colors duration-300 relative z-10">
                  {portal.icon}
                </span>
                <div className="relative z-10 mt-auto">
                  <h3 className="font-display text-2xl font-medium text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">{portal.title}</h3>
                  <p className="text-sm text-white/50 uppercase tracking-widest">{portal.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </main>

      {/* Dynamic Trending Products Section */}
      <section className="relative w-full py-32 px-6 md:px-16 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <span className="text-xs font-semibold text-[#5300b7] uppercase tracking-[0.2em] block mb-3">Live Inventory</span>
              <h2 className="font-display text-5xl md:text-6xl font-semibold tracking-tighter text-white">Trending Now</h2>
            </div>
            <Link href="/shop" className="group flex items-center gap-2 text-sm uppercase tracking-widest font-semibold text-white/70 hover:text-white transition-colors pb-2 border-b border-white/10 hover:border-[#5300b7]">
              Explore Collection 
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 rounded-3xl aspect-[3/4] animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/5">
               <span className="material-symbols-outlined text-4xl text-white/20 mb-4">inventory_2</span>
               <p className="text-white/50 uppercase tracking-widest text-sm">No arrivals yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topProducts.map((product, idx) => (
                <div 
                  key={product.id} 
                  className="group relative bg-[#111] rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-700 hover:-translate-y-2 flex flex-col"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-black/50 p-6">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-80"></div>
                    
                    {/* Badge */}
                    <div className="absolute top-6 left-6 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white">{product.category}</span>
                    </div>
                  </div>

                  <div className="relative p-8 flex flex-col flex-grow bg-[#111] -mt-4 z-10 rounded-t-3xl border-t border-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-[0.2em] mb-2">{product.designer?.brandName || "Atelier Maison"}</p>
                    <Link href={`/products/${product.id}`} className="font-display text-2xl font-medium text-white group-hover:text-[#5300b7] transition-colors line-clamp-1 mb-4">
                      {product.name}
                    </Link>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/10">
                      <span className="font-display text-2xl font-medium text-white">${product.price.toLocaleString()}</span>
                      <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#5300b7] transition-colors">
                        <span className="material-symbols-outlined text-sm text-white">north_east</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
