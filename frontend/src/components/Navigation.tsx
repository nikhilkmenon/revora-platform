"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/hooks/useCart";
import { ordersService } from "@/services/orders";

export type { CartItem } from "@/types";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, total, count, updateQuantity, clear: clearCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment">("address");
  const [addressForm, setAddressForm] = useState({ country: "", state: "", district: "", area: "" });
  const [txnId, setTxnId] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const calculateDeliveryTime = () => {
    if (!addressForm.country) return "";
    if (addressForm.country.toLowerCase() !== "india") return "14-21 Business Days";
    if (["kerala", "karnataka", "tamil nadu"].includes(addressForm.state.toLowerCase())) return "2-4 Business Days";
    return "5-7 Business Days";
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert("Please login to proceed.");
    setCheckoutStep("payment");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);

    try {
      const orderRes = await ordersService.create({
        address: { ...addressForm, deliveryTime: calculateDeliveryTime() },
        txnId: "RAZORPAY_FLOW",
        items: cartItems.map(item => ({
          ...(item.type === 'fabric' ? { fabricId: item.id } : { productId: item.id }),
          quantity: item.quantity,
        }))
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "REVORA",
        description: "Luxury Sustainable Assets",
        order_id: orderRes.order_id,
        handler: async function (response: any) {
          try {
            await ordersService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalOrderId: orderRes.internalOrderId
            });

            alert("Order placed successfully!");
            clearCart();
            setOrderSuccess(true);
            setCartOpen(false);
            setAddressForm({ country: "", state: "", district: "", area: "" });
            setCheckoutStep("address");
          } catch (verifyErr: any) {
            alert(`Payment verification failed: ${verifyErr.message}`);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#5300b7"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>

      <nav className="bg-[#fef7ff]/80 backdrop-blur-xl fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1280px] rounded-full border border-white/20 shadow-lg shadow-[#5300b7]/5 flex items-center justify-between px-8 py-4 z-40">
        <Link href="/" className="font-display text-2xl font-bold tracking-tighter text-[#5300b7]">
          REVORA
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/shop" className="font-body text-xs uppercase tracking-widest text-[#4a4455] hover:text-[#5300b7] transition-all duration-300 hover:scale-105">
            Shop
          </Link>
          <Link href="/textiles" className="font-body text-xs uppercase tracking-widest text-[#4a4455] hover:text-[#5300b7] transition-all duration-300 hover:scale-105">
            Textiles
          </Link>
          {isAuthenticated && user?.role === "DESIGNER" && (
            <Link href="/designer" className="font-body text-xs uppercase tracking-widest text-[#5300b7] font-semibold border-b border-[#5300b7] pb-0.5">
              Designer Studio
            </Link>
          )}
          {isAuthenticated && user?.role === "ADMIN" && (
            <Link href="/admin" className="font-body text-xs uppercase tracking-widest text-[#0051d5] font-semibold hover:underline">
              Admin Portal
            </Link>
          )}
          {isAuthenticated && (
            <Link href="/orders" className="font-body text-xs uppercase tracking-widest text-[#4a4455] hover:text-[#5300b7] transition-all duration-300 hover:scale-105">
              Orders
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#5300b7]">
          <button
            onClick={() => setCartOpen(true)}
            aria-label="shopping_bag"
            className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors relative"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>
          
          {isAuthenticated ? (
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors text-error"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-primary text-white text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-transform"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl p-6 relative">
            <button
              onClick={() => setCartOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-display text-xl font-bold text-primary mb-6">Shopping Bag</h3>

            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 text-primary/30">shopping_bag</span>
                  <p>Your shopping bag is empty.</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex gap-4 p-3 bg-surface-container/30 rounded-lg border border-outline-variant/20">
                    <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded bg-surface-dim" />
                    <div className="flex-grow">
                      <p className="font-display font-medium text-sm line-clamp-1">{item.name}</p>
                      {item.designer && <p className="text-[11px] text-on-surface-variant uppercase">{item.designer}</p>}
                      <p className="text-primary font-bold mt-1">₹{item.price}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 border rounded-full hover:bg-surface-variant flex items-center justify-center text-sm">-</button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 border rounded-full hover:bg-surface-variant flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
                </div>

                {checkoutStep === "address" ? (
                  <form onSubmit={handleNextStep} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Country *</label>
                        <input required value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} placeholder="India" className="w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">State *</label>
                        <input required value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="Kerala" className="w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">District *</label>
                        <input required value={addressForm.district} onChange={e => setAddressForm({ ...addressForm, district: e.target.value })} placeholder="Ernakulam" className="w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Area *</label>
                        <input required value={addressForm.area} onChange={e => setAddressForm({ ...addressForm, area: e.target.value })} placeholder="Kochi" className="w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low" />
                      </div>
                    </div>
                    {calculateDeliveryTime() && (
                      <p className="text-xs text-primary font-semibold mt-2">
                        Estimated Delivery: {calculateDeliveryTime()}
                      </p>
                    )}
                    <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg mt-4">
                      Continue to Payment
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#f9f1ff] p-4 rounded-xl border border-primary/20 text-center">
                      <p className="text-sm font-semibold text-[#1d1a24] mb-2">Secure Payment via Razorpay</p>
                      <p className="text-xs text-[#4a4455]">You will be redirected to the secure checkout.</p>
                    </div>
                    <button type="button" onClick={handleCheckout} disabled={checkoutLoading} className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                      {checkoutLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">lock</span>
                          Pay Securely
                        </>
                      )}
                    </button>
                    <button type="button" onClick={() => setCheckoutStep("address")} className="w-full py-2 text-sm text-[#4a4455] hover:text-primary transition-colors">
                      Back to Address
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Success Alert */}
      {orderSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <span className="material-symbols-outlined">task_alt</span>
          <div>
            <p className="font-bold text-sm">Order Created Successfully!</p>
            <p className="text-xs opacity-90">Track payment capture & status under Order History.</p>
          </div>
          <button onClick={() => setOrderSuccess(false)} className="hover:opacity-80">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-dim w-full py-16 border-t border-outline-variant/20 mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto px-6">
        <div className="md:col-span-1 flex flex-col justify-between">
          <div className="font-display text-3xl text-primary mb-4 font-bold tracking-tighter">REVORA</div>
          <p className="font-body text-xs text-on-surface-variant uppercase tracking-wider">
            © {new Date().getFullYear()} REVORA. THE ART OF SUSTAINABLE LUXURY.
          </p>
        </div>
        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 pt-2">
          <div className="flex flex-col gap-3">
            <p className="font-display font-semibold text-sm">Ethics</p>
            <a className="font-body text-xs text-on-surface-variant hover:text-secondary transition-colors" href="#">Ethics Charter</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-secondary transition-colors" href="#">Transparency Audit</a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-display font-semibold text-sm">Logistics</p>
            <a className="font-body text-xs text-on-surface-variant hover:text-secondary transition-colors" href="#">Global Shipping</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-secondary transition-colors" href="#">Sustainability Report</a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-display font-semibold text-sm">Press & Editorial</p>
            <a className="font-body text-xs text-on-surface-variant hover:text-secondary transition-colors" href="#">Press Kit</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
