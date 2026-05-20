"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/Navigation";
import { productsService } from "@/services/products";
import { ProductSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useApi } from "@/hooks/useApi";
import { useCart } from "@/hooks/useCart";
import type { Product, ProductsResponse } from "@/types";

const CATEGORIES = ["Outerwear", "Dresses", "Knitwear", "Accessories", "Footwear"];

export default function ShopPage() {
  const { data: response, loading, error, execute } = useApi<ProductsResponse>(productsService.getAll);
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sort, setSort] = useState("newest");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => { 
    execute({ category: category || undefined, search: search || undefined });
  }, [category, search, sort, execute]);

  // Apply client-side filters (Price, Status, Sort) on the fetched data
  useEffect(() => {
    if (!response) return;
    
    let filtered = response.data.filter((p) => p.status === "APPROVED");
    if (minPrice !== "") filtered = filtered.filter((p) => p.price >= Number(minPrice));
    if (maxPrice !== "") filtered = filtered.filter((p) => p.price <= Number(maxPrice));
    
    if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
    else filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setProducts(filtered);
  }, [response, minPrice, maxPrice, sort]);

  const toggleWishlist = (id: string) => setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      designer: product.designer?.brandName || "Atelier Maison"
    });
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-5 md:px-16 pt-32 pb-20 flex gap-6">

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-36 bg-white rounded-2xl border border-[#ccc3d7]/30 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-medium text-[#1d1a24]">Filters</h2>
              <button onClick={() => { setCategory(""); setSearch(""); setMinPrice(""); setMaxPrice(""); }} className="text-sm font-semibold text-[#5300b7] hover:underline">Clear All</button>
            </div>
            <div className="mb-8 border-b border-[#ccc3d7]/20 pb-6">
              <h3 className="font-body text-sm font-semibold text-[#1d1a24] mb-3">Category</h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={category === cat} onChange={() => setCategory(category === cat ? "" : cat)} className="rounded border-[#ccc3d7] text-[#5300b7] focus:ring-[#5300b7] w-4 h-4" />
                    <span className="text-sm text-[#4a4455] group-hover:text-[#5300b7] transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold text-[#1d1a24] mb-3">Price Range</h3>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="$Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-[#dfd7e5] border-none rounded-xl text-sm focus:ring-1 focus:ring-[#0051d5] focus:bg-white transition-all p-2" />
                <span className="text-[#ccc3d7]">—</span>
                <input type="number" placeholder="$Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full bg-[#dfd7e5] border-none rounded-xl text-sm focus:ring-1 focus:ring-[#0051d5] focus:bg-white transition-all p-2" />
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-grow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-[#1d1a24]">Curated Collection</h1>
            <div className="flex items-center gap-4">
              <form onSubmit={(e) => { e.preventDefault(); execute({ search }); }} className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7b7486] text-sm">search</span>
                <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-[#ccc3d7]/40 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#5300b7] w-44" />
              </form>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-[#5300b7] cursor-pointer focus:ring-0">
                <option value="newest">Newest Arrivals</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
              </select>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-200 mb-8">{error}</div>}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon="dry_cleaning" title="No matching items found" description="Try modifying your filters." action={{ label: "Clear Filters", onClick: () => { setCategory(""); setSearch(""); setMinPrice(""); setMaxPrice(""); } }} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(83,0,183,0.12)] transition-all duration-300 border border-[#ccc3d7]/20 flex flex-col">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#dfd7e5] p-4">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700" />
                    <button onClick={() => toggleWishlist(product.id)} className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-md rounded-full text-[#1d1a24] hover:text-[#ba1a1a] transition-all">
                      <span className="material-symbols-outlined text-lg">{wishlist.has(product.id) ? "favorite" : "favorite_border"}</span>
                    </button>
                    {product.stock < 5 && (
                      <div className="absolute bottom-6 left-6">
                        <span className="px-3 py-1 bg-white/80 text-[#1d1a24] backdrop-blur-md rounded-full text-[10px] uppercase tracking-wider font-semibold">Low Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-[#4a4455] uppercase tracking-widest mb-1">{product.designer?.brandName || "Atelier Maison"}</p>
                        <Link href={`/products/${product.id}`} className="font-display text-xl font-medium text-[#1d1a24] hover:text-[#5300b7] transition-colors line-clamp-1 block">{product.name}</Link>
                      </div>
                      <span className="font-display text-xl font-medium text-[#5300b7]">₹{product.price.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-[#4a4455] line-clamp-2 mb-4 leading-relaxed">{product.description}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#ccc3d7]/10">
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />In Stock ({product.stock})
                      </span>
                      <button onClick={() => addToCart(product)} className="text-sm font-semibold text-[#5300b7] opacity-0 group-hover:opacity-100 transition-opacity">Quick Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="mt-20 flex justify-center">
              <button className="px-8 py-4 bg-[#5300b7] text-white rounded-full text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_8px_16px_-4px_rgba(83,0,183,0.3)]">
                Load More Selections
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
