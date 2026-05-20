"use client";
import React, { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/Navigation";
import { productsService, Product } from "@/services/products";
import { useParams, useRouter } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { useApi } from "@/hooks/useApi";
import { useCart } from "@/hooks/useCart";

const SIZES = ["36", "38", "40", "42", "44"];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: product, loading, error, execute } = useApi<Product>(productsService.getOne);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("40");
  const [activeAccordion, setActiveAccordion] = useState("description");
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => { if (id) execute(id); }, [id, execute]);

  const addToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      designer: product.designer?.brandName || "Atelier Maison"
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fef7ff] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#5300b7] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-display text-sm tracking-widest text-[#5300b7] animate-pulse uppercase">Loading…</p>
    </div>
  );

  if (error || !product) return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
        <h2 className="font-display font-semibold text-xl mb-2">Product Not Found</h2>
        <p className="text-sm text-[#4a4455] max-w-sm mb-6">{error || "This listing does not exist."}</p>
        <button onClick={() => router.push("/shop")} className="px-6 py-3 bg-[#5300b7] text-white rounded-full text-sm font-bold hover:scale-105 transition-all">Return to Shop</button>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <main className="pt-[140px] pb-20 max-w-[1280px] mx-auto px-5 md:px-16">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-[#4a4455]">
          <button onClick={() => router.push("/shop")} className="hover:text-[#5300b7] transition-colors">Shop</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-sm">{product.category}</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#5300b7]">{product.name}</span>
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
          {/* Gallery */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-2 h-[700px]">
            <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden bg-[#f9f1ff] group cursor-zoom-in">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-[#f9f1ff] cursor-pointer">
              <img src={product.image} alt="Detail view 1" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-[#dfd7e5] cursor-pointer">
              <img src={product.image} alt="Detail view 2" className="w-full h-full object-cover hover:opacity-90 transition-opacity opacity-80" />
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-5 flex flex-col pt-4 lg:pl-8">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 mb-4 rounded-full bg-[#5300b7]/5 text-[#5300b7] text-xs uppercase tracking-wider font-semibold">{product.category}</span>
              <p className="text-xs text-[#4a4455] uppercase tracking-widest font-semibold">{product.designer?.brandName || "Atelier Maison"}</p>
              <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-[#1d1a24] mt-1 mb-2">{product.name}</h1>
            </div>

            <div className="mb-8">
              <span className="font-display text-2xl font-medium text-[#1d1a24] block mb-1">₹{product.price.toLocaleString()}</span>
              <span className="text-sm text-[#7b7486]">Taxes and duties included.</span>
            </div>

            {/* Size */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-[#1d1a24] uppercase tracking-widest">Select Size</span>
                <button className="text-xs font-semibold text-[#5300b7] hover:underline">Size Guide</button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-2xl border text-sm font-semibold transition-all ${selectedSize === size ? "border-2 border-[#5300b7] bg-[#5300b7]/5 text-[#5300b7]" : "border-[#ccc3d7] hover:border-[#5300b7] text-[#1d1a24] bg-white"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <span className="text-xs font-semibold text-[#1d1a24] uppercase tracking-widest block mb-3">Quantity</span>
              <div className="flex items-center border border-[#ccc3d7] rounded-2xl overflow-hidden bg-[#f9f1ff] w-fit">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-12 h-12 hover:bg-[#e8e0ee] flex items-center justify-center font-bold text-[#5300b7] transition-colors">−</button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="w-12 h-12 hover:bg-[#e8e0ee] flex items-center justify-center font-bold text-[#5300b7] transition-colors">+</button>
              </div>
              <p className="mt-2 text-xs text-[#4a4455]">{product.stock} units available · SKU: {product.sku}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={addToCart}
                className={`w-full py-4 rounded-full font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${addedToCart ? "bg-green-500 text-white" : "bg-[#5300b7] text-white hover:scale-[1.02] shadow-[#5300b7]/20"}`}
              >
                <span className="material-symbols-outlined text-sm">{addedToCart ? "check_circle" : "shopping_bag"}</span>
                {addedToCart ? "Added to Bag!" : "Add to Cart"}
              </button>
              <button className="w-full py-4 rounded-full bg-white text-[#5300b7] border border-[#5300b7] font-semibold text-sm uppercase tracking-wider hover:bg-[#5300b7]/5 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">favorite</span>
                Wishlist
              </button>
            </div>

            {/* Accordions */}
            <div className="border-t border-[#ccc3d7]/30">
              {[
                { key: "description", label: "Description", content: product.description },
                { key: "details", label: "Details & Care", content: "100% premium fabric · Professional dry clean only · Made with sustainable materials · See label for full care instructions." },
                { key: "shipping", label: "Shipping & Returns", content: "Complimentary global shipping on all orders. Returns accepted within 14 days of delivery. Custom and bespoke items are final sale." },
              ].map(({ key, label, content }) => (
                <div key={key} className="border-b border-[#ccc3d7]/30">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === key ? "" : key)}
                    className="w-full flex justify-between items-center py-4 text-left text-xs font-semibold text-[#1d1a24] uppercase tracking-widest"
                  >
                    {label}
                    <span className={`material-symbols-outlined text-[#7b7486] transition-transform ${activeAccordion === key ? "rotate-180" : ""}`}>expand_more</span>
                  </button>
                  {activeAccordion === key && (
                    <div className="pb-4 text-sm text-[#4a4455] leading-relaxed">{content}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
