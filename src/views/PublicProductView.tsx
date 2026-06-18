import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ShoppingBag, MessageCircle, AlertTriangle, Box, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export function PublicProductView() {
  const [product, setProduct] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pathParts = window.location.pathname.split("/");
  const productId = pathParts[pathParts.length - 1]; // e.g., /product/123 -> 123
  const searchParams = new URLSearchParams(window.location.search);
  const ownerId = searchParams.get("owner");

  useEffect(() => {
    async function fetchProduct() {
      if (!productId || !ownerId) {
        setError("Invalid product link.");
        setLoading(false);
        return;
      }
      try {
        const reqHost = window.location.host;
        const protocol = window.location.protocol;
        const res = await fetch(`${protocol}//${reqHost}/api/public/product/${ownerId}/${productId}`);
        
        if (!res.ok) {
           setError("Product not found or has been removed.");
           setLoading(false);
           return;
        }

        const data = await res.json();
        setProduct(data.product);
        if (data.waNumber) {
           setSettings({ whatsappPhoneNumber: data.waNumber });
        }
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError("Failed to load product page.");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId, ownerId]);

  const handleOrder = async () => {
    if (!product || !ownerId) return;

    try {
      // Show loading
      toast.loading("Preparing your order...", { id: "order" });
      
      // Record the interest in via API to notify the admin
      await fetch('/api/product-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            ownerId: ownerId,
          })
      });
      
      // WhatsApp redirect
      const text = encodeURIComponent(`Hi, I want to order ${product.name} (Item ID: ${product.id}). Is it available?`);
      
      let waNumber = "";
      if (settings) {
         waNumber = settings.whatsappPhoneNumber || settings.metaWhatsAppPhoneNumber || "";
         waNumber = waNumber.replace(/[^0-9]/g, '');
      }

      toast.success("Redirecting to WhatsApp...", { id: "order" });
      
      setTimeout(() => {
        const redirectUrl = waNumber 
            ? `https://wa.me/${waNumber}?text=${text}`
            : `https://wa.me/?text=${text}`;
        
        window.location.href = redirectUrl;
      }, 1000);

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", { id: "order" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs text-white/50">Loading Product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500 mb-6">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Unavailable</h1>
        <p className="text-white/50">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans flex items-center justify-center">
      <Toaster position="top-center" />
      <div className="max-w-xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6 md:p-10 rounded-[2rem] shadow-2xl space-y-8"
        >
          {product.imageUrl ? (
             <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center mb-6">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
             </div>
          ) : (
             <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex flex-col items-center justify-center mb-6 text-white/20">
                <Box className="w-20 h-20 mb-4" strokeWidth={1} />
                <span className="text-sm font-bold tracking-widest uppercase">No Image</span>
             </div>
          )}

          <div>
             <div className="inline-block px-3 py-1 bg-emerald-400/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg mb-4">
                Available
             </div>
             <h1 className="text-3xl font-bold tracking-tight mb-2 text-white/90">{product.name}</h1>
             <p className="text-2xl font-light text-white/60 mb-6">
                {product.price ? `₹${product.price.toLocaleString()}` : "Price on Request"}
             </p>
             
             {product.description && (
                <div className="mb-6">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Description</h3>
                   <p className="text-sm text-white/70 leading-relaxed">{product.description}</p>
                </div>
             )}

             {product.specifications && (
                <div className="mb-8">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Specifications</h3>
                   <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{product.specifications}</p>
                </div>
             )}
          </div>

          <div className="pt-6 border-t border-white/10">
             <button 
                onClick={handleOrder}
                className="w-full relative group overflow-hidden bg-emerald-500 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
             >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <MessageCircle className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Order via WhatsApp</span>
             </button>
             
             <p className="text-center text-xs text-white/40 mt-4 tracking-wide">
                Securely handled by standard WhatsApp integration
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
