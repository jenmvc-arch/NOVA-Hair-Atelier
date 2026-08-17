import React, { useState, useMemo } from 'react';
import { Trash2, Plus, CreditCard, Search, Tag, Sparkles } from 'lucide-react';
import { CatalogItem, CartItem, Stylist, ClientRecord } from '../types';

interface POSViewProps {
  cart: CartItem[];
  onAddToCart: (name: string, price: number, category: 'Services' | 'Retail', sku?: string) => void;
  onRemoveFromCart: (id: string) => void;
  selectedStylist: string;
  setSelectedStylist: (stylist: string) => void;
  stylists: Stylist[];
  clientName: string;
  setClientName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  catalog: CatalogItem[];
  onCheckout: () => void;
  ticketNumber: string;
  existingClients: ClientRecord[];
}

export default function POSView({
  cart,
  onAddToCart,
  onRemoveFromCart,
  selectedStylist,
  setSelectedStylist,
  stylists,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  catalog,
  onCheckout,
  ticketNumber,
  existingClients,
}: POSViewProps) {
  const [catalogTab, setCatalogTab] = useState<'Services' | 'Retail'>('Services');
  const [skuSearch, setSkuSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Find currently matched client for loyalty information
  const activeMatchedClient = useMemo(() => {
    if (!clientName.trim()) return null;
    return existingClients.find(
      (c) =>
        (clientPhone.trim() && c.phone === clientPhone.trim()) ||
        c.name.toLowerCase() === clientName.toLowerCase().trim()
    );
  }, [clientName, clientPhone, existingClients]);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  }, [cart]);

  const total = useMemo(() => {
    return subtotal;
  }, [subtotal]);

  // Clients autocomplete suggestions
  const clientSuggestions = useMemo(() => {
    if (!clientName.trim()) return [];
    return existingClients.filter((c) =>
      c.name.toLowerCase().includes(clientName.toLowerCase())
    );
  }, [clientName, existingClients]);

  // Filter catalog items depending on SKU input and active category tab
  const filteredCatalogItems = useMemo(() => {
    const term = skuSearch.toLowerCase().trim();
    return catalog.filter((item) => {
      const matchCategory = item.category === catalogTab;
      if (!term) return matchCategory;
      return matchCategory && (
        item.name.toLowerCase().includes(term) ||
        (item.sku && item.sku.toLowerCase().includes(term))
      );
    });
  }, [catalog, catalogTab, skuSearch]);

  const handleSelectClientSuggestion = (client: { name: string; phone: string }) => {
    setClientName(client.name);
    setClientPhone(client.phone);
    setShowClientSuggestions(false);
  };

  const handleAddCustomSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuSearch.trim()) return;

    // Check if the item matches an existing item in our catalog
    const exactMatch = catalog.find(
      (item) => 
        item.name.toLowerCase() === skuSearch.toLowerCase().trim() ||
        (item.sku && item.sku.toLowerCase() === skuSearch.toLowerCase().trim())
    );

    if (exactMatch) {
      onAddToCart(exactMatch.name, exactMatch.price, exactMatch.category, exactMatch.sku);
    } else {
      // Default price for newly entered custom SKU/service is 50.00
      onAddToCart(skuSearch.trim(), 50, catalogTab);
    }
    setSkuSearch('');
  };

  const frequentServices = [
    { name: "Women's Cut", price: 120 },
    { name: "Men's Cut", price: 65 },
    { name: "Partial Highlight", price: 185 },
    { name: "Balayage", price: 280 },
    { name: "Blowout", price: 55 },
    { name: "Deep Cond. Add-on", price: 45 },
  ];

  return (
    <section className="flex h-full flex-col gap-5 font-sans animate-fade-in md:gap-8 xl:flex-row">
      {/* Left: Ticket/Cart */}
      <div className="flex min-h-0 w-full flex-col xl:min-h-[500px] xl:w-1/3">
        <div className="relative flex flex-grow flex-col overflow-hidden rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
          {/* Decorative absolute blur */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-nova-sand rounded-full blur-3xl opacity-20 pointer-events-none"></div>

          <div className="mb-6 flex justify-between items-end border-b border-nova-sand/15 pb-4">
            <h2 className="font-serif text-xl font-semibold tracking-wide text-nova-choco">Current Ticket</h2>
            <span className="text-xs font-semibold font-mono text-nova-choco/50 tracking-wider bg-nova-beige/40 px-2.5 py-1 rounded-full">
              {ticketNumber}
            </span>
          </div>

          {/* Cart Items Container */}
          <div className="max-h-72 flex-grow space-y-4 overflow-y-auto pr-1 md:max-h-[400px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-nova-choco/40 py-16">
                <Tag className="w-8 h-8 text-nova-sand/50 stroke-[1.5px] mb-2" />
                <p className="text-sm font-medium italic">Ticket is empty</p>
                <p className="text-[11px] mt-1 text-nova-choco/30">Click frequent services or search to add items</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start group py-3 px-3.5 hover:bg-nova-beige/15 rounded-xl border-b border-nova-sand/10 last:border-0 transition-all duration-200"
                >
                  <div className="flex-grow pr-3">
                    <h4 className="text-sm font-bold text-nova-choco tracking-wide">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-nova-choco/60 font-sans">
                        Stylist: {item.stylist}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-nova-sand/20 text-nova-choco/70 uppercase tracking-widest">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <p className="text-sm font-bold text-nova-choco font-mono">RM {item.price.toFixed(2)}</p>
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="mt-1 min-h-10 min-w-10 p-2 text-red-500 opacity-100 transition-colors hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals Section */}
          <div className="mt-6 pt-5 border-t border-nova-sand/20 bg-white">
            <div className="flex justify-between items-end mb-6">
              <span className="font-serif text-lg font-bold text-nova-choco">Total</span>
              <span className="font-serif text-2xl font-black text-nova-choco font-mono tracking-tight">
                RM {total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-nova-choco py-4 text-sm font-bold tracking-wide text-white shadow-md transition-all duration-200 hover:scale-[1.01] hover:bg-nova-choco/95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <CreditCard className="w-4.5 h-4.5 stroke-[2.2px]" />
              <span>Complete Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Inputs & Catalog */}
      <div className="flex w-full flex-col gap-5 xl:w-2/3 md:gap-6">
        {/* Client Details Card */}
        <div className="relative rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:p-6">
          <h3 className="font-serif text-lg font-semibold mb-4 text-nova-choco flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-nova-sand" />
            <span>Client Details</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
            <div className="relative">
              <label className="block text-xs font-bold mb-2 text-nova-choco/80 tracking-wide uppercase">Name</label>
              <input
                type="text"
                value={clientName}
                onFocus={() => setShowClientSuggestions(true)}
                onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                onChange={(e) => {
                  setClientName(e.target.value);
                  setShowClientSuggestions(true);
                }}
                className="min-h-12 w-full rounded-full border border-nova-sand/30 bg-nova-light/45 px-4 py-3 font-sans text-base text-nova-choco transition-all duration-200 focus:border-nova-choco focus:bg-white focus:outline-none focus:ring-2 focus:ring-nova-sand/20 sm:text-sm"
                placeholder="Walk-in or Search..."
              />
              {showClientSuggestions && clientSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-18 bg-white border border-nova-sand/20 rounded-2xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto space-y-1">
                  <p className="text-[10px] font-bold text-nova-choco/40 px-3 py-1 uppercase tracking-wider">
                    Matching Clients
                  </p>
                  {clientSuggestions.map((client, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectClientSuggestion(client)}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl text-nova-choco hover:bg-nova-beige/40 flex justify-between items-center transition-all duration-150"
                    >
                      <span className="font-bold">{client.name}</span>
                      <span className="font-mono text-nova-choco/60">{client.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-nova-choco/80 tracking-wide uppercase">Phone</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="min-h-12 w-full rounded-full border border-nova-sand/30 bg-nova-light/45 px-4 py-3 font-sans text-base text-nova-choco transition-all duration-200 focus:border-nova-choco focus:bg-white focus:outline-none focus:ring-2 focus:ring-nova-sand/20 sm:text-sm"
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          {/* Member Loyalty Status Card */}
          {clientName.trim() && (
            <div className="mt-4 pt-4 border-t border-nova-sand/15 flex items-center justify-between text-xs font-semibold animate-fade-in">
              {activeMatchedClient ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-2xl w-full">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-900">Loyalty Member Detected:</span>{' '}
                    <span>{activeMatchedClient.points || 0} pts available</span>
                    <span className="text-amber-700/80 block text-[10px] mt-0.5">
                      Equivalent to RM {((activeMatchedClient.points || 0) / 10).toFixed(2)} discount. Apply at payment checkout!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl w-full">
                  <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-emerald-900">New Client Invitation:</span>{' '}
                    <span>Will earn {Math.floor(subtotal)} pts upon checkout</span>
                    <span className="text-emerald-700/80 block text-[10px] mt-0.5">
                      A member profile will be created automatically in the loyalty registry.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Catalog Selection and Add Item Area */}
        <div className="flex min-h-[360px] flex-grow flex-col rounded-3xl border border-nova-sand/15 bg-white p-4 shadow-sm md:min-h-[400px] md:p-6">
          <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center md:mb-6">
            <h3 className="font-serif text-lg font-semibold text-nova-choco">Add Service or Retail</h3>
            {/* Tab switchers */}
            <div className="flex w-full rounded-full border border-nova-sand/20 bg-nova-light p-1 shadow-inner sm:w-auto">
              <button
                onClick={() => setCatalogTab('Services')}
                className={`min-h-10 flex-1 rounded-full px-5 py-1.5 text-xs font-bold transition-all duration-300 sm:flex-none ${
                  catalogTab === 'Services'
                    ? 'bg-nova-sand text-nova-choco shadow-sm'
                    : 'text-nova-choco/60 hover:text-nova-choco'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setCatalogTab('Retail')}
                className={`min-h-10 flex-1 rounded-full px-5 py-1.5 text-xs font-bold transition-all duration-300 sm:flex-none ${
                  catalogTab === 'Retail'
                    ? 'bg-nova-sand text-nova-choco shadow-sm'
                    : 'text-nova-choco/60 hover:text-nova-choco'
                }`}
              >
                Retail
              </button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mb-6 md:gap-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-nova-choco/80 tracking-wide uppercase">Stylist</label>
              <select
                value={selectedStylist}
                onChange={(e) => setSelectedStylist(e.target.value)}
                className="min-h-12 w-full rounded-full border border-nova-sand/30 bg-white px-4 py-3 font-sans text-base text-nova-choco transition-all duration-200 focus:border-nova-choco focus:outline-none focus:ring-2 focus:ring-nova-sand/20 sm:text-sm"
              >
                {stylists.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name} ({st.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-nova-choco/80 tracking-wide uppercase">
                Search SKU / Service
              </label>
              <form onSubmit={handleAddCustomSku} className="relative">
                <input
                  type="text"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="min-h-12 w-full rounded-full border border-nova-sand/30 bg-nova-light/45 py-3 pl-4 pr-11 font-sans text-base text-nova-choco transition-all duration-200 focus:border-nova-choco focus:bg-white focus:outline-none focus:ring-2 focus:ring-nova-sand/20 sm:text-sm"
                  placeholder="e.g. 'Haircut', 'Olaplex'"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-nova-sand text-nova-choco shadow-sm transition-all duration-200 hover:scale-105 hover:bg-nova-sand/90 active:scale-95"
                  title="Add item"
                >
                  <Plus className="w-4 h-4 stroke-[2.5px]" />
                </button>
              </form>
            </div>
          </div>

          {/* Scrollable Quick-add lists depending on tab selection or sku search */}
          <div className="flex-grow flex flex-col min-h-0">
            {skuSearch ? (
              <div className="flex-grow flex flex-col min-h-0">
                <h4 className="text-[11px] font-bold mb-3 text-nova-choco/40 uppercase tracking-wider shrink-0">
                  Catalog Matches ({filteredCatalogItems.length})
                </h4>
                <div className="flex-grow overflow-y-auto pr-1 max-h-[280px]">
                  {filteredCatalogItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-nova-choco/40 italic">
                      No catalog items match. Press '+' to add as custom item for RM 50.00.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
                      {filteredCatalogItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onAddToCart(item.name, item.price, item.category, item.sku)}
                          className="flex justify-between items-center px-4 py-3 bg-nova-beige/15 hover:bg-nova-beige/35 border border-nova-sand/20 hover:border-nova-sand rounded-xl text-left transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-nova-choco line-clamp-1">{item.name}</span>
                            {item.sku && (
                              <span className="text-[9px] font-mono text-nova-choco/40 mt-0.5 tracking-wider uppercase font-bold">
                                {item.sku}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-nova-choco font-mono shrink-0">RM {item.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col min-h-0">
                <h4 className="text-[11px] font-bold mb-3 text-nova-choco/40 uppercase tracking-wider shrink-0">
                  {catalogTab === 'Services' ? 'Available Services Catalog' : 'Available Retail Catalog'}
                </h4>
                
                <div className="flex-grow overflow-y-auto pr-1 max-h-[280px]">
                    <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 lg:grid-cols-3">
                    {catalog
                      .filter((i) => i.category === catalogTab)
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onAddToCart(item.name, item.price, item.category, item.sku)}
                          className="bg-nova-beige/15 hover:bg-white rounded-2xl p-4 flex flex-col justify-between items-center text-center hover:scale-[1.02] hover:shadow-md border border-nova-sand/15 hover:border-nova-sand h-28 transition-all duration-300 group cursor-pointer"
                        >
                          <span className="text-xs font-bold text-nova-choco group-hover:text-nova-sand transition-colors line-clamp-2 w-full">
                            {item.name}
                          </span>
                          <div className="mt-auto pt-2 w-full flex flex-col items-center">
                            {item.sku && (
                              <span className="text-[8px] font-mono font-bold text-nova-sand uppercase tracking-widest line-clamp-1">
                                {item.sku}
                              </span>
                            )}
                            <span className="text-xs font-bold font-mono text-nova-choco/60 mt-0.5">
                              RM {item.price.toFixed(2)}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
