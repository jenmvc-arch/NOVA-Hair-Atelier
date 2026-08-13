import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Check, 
  Sparkles, 
  ShoppingBag, 
  ClipboardList, 
  DollarSign, 
  Scissors, 
  User, 
  QrCode,
  Send,
  Smartphone,
  Download,
  Printer,
  Filter,
  Plus
} from 'lucide-react';
import { CartItem, CatalogItem, Transaction, PaymentConfig, CompanyInfo, ClientRecord } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  clientName: string;
  clientPhone: string;
  paymentConfig: PaymentConfig;
  companyInfo?: CompanyInfo;
  existingClients: ClientRecord[];
  onPaymentComplete: (tx: {
    clientName: string;
    clientPhone: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    pointsRedeemed?: number;
    pointsDiscount?: number;
    pointsEarned?: number;
  }) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  clientName,
  clientPhone,
  paymentConfig,
  companyInfo,
  existingClients,
  onPaymentComplete,
}: CheckoutModalProps) {
  const enabledMethods = useMemo(() => {
    return paymentConfig?.customMethods?.filter(m => m.isEnabled) || [];
  }, [paymentConfig]);

  const defaultMethod = useMemo(() => {
    if (enabledMethods.length > 0) return enabledMethods[0].name;
    return 'DuitNow QR';
  }, [enabledMethods]);

  const [paymentMethod, setPaymentMethod] = useState<string>('DuitNow QR');

  useEffect(() => {
    if (isOpen && defaultMethod) {
      setPaymentMethod(defaultMethod);
    }
  }, [isOpen, defaultMethod]);

  const selectedMethodObj = useMemo(() => {
    return enabledMethods.find(m => m.name === paymentMethod);
  }, [enabledMethods, paymentMethod]);

  const showQR = useMemo(() => {
    const nameLower = paymentMethod.toLowerCase();
    if (nameLower.includes('duitnow') || nameLower.includes('tng') || nameLower.includes('touch')) return true;
    if (selectedMethodObj && (selectedMethodObj.type === 'QR' || selectedMethodObj.type === 'Digital Wallet')) return true;
    return false;
  }, [paymentMethod, selectedMethodObj]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappNum, setWhatsappNum] = useState('');
  
  // Loyalty states
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Auto pre-fill WhatsApp number with client phone on open & reset points to redeem
  useEffect(() => {
    if (isOpen) {
      setWhatsappNum(clientPhone);
      setPointsToRedeem(0);
    }
  }, [isOpen, clientPhone]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  }, [cart]);

  const tax = 0;
  const tipAmount = 0;

  // Look up current client's loyalty details
  const matchedClient = useMemo(() => {
    if (!clientName && !clientPhone) return null;
    return existingClients.find(
      (c) =>
        (clientPhone && c.phone === clientPhone) ||
        (clientName && c.name.toLowerCase() === clientName.toLowerCase())
    );
  }, [existingClients, clientName, clientPhone]);

  // Max points they can redeem is either their total points or what covers the subtotal
  const maxRedeemablePoints = useMemo(() => {
    if (!matchedClient) return 0;
    // 10 points = RM 1, so max needed points is subtotal * 10
    return Math.min(matchedClient.points || 0, Math.ceil(subtotal * 10));
  }, [matchedClient, subtotal]);

  const pointsDiscount = useMemo(() => {
    return pointsToRedeem / 10;
  }, [pointsToRedeem]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - pointsDiscount);
  }, [subtotal, pointsDiscount]);

  const pointsEarned = useMemo(() => {
    // Earn 1 point for every RM 1 of actual spend (after points discount)
    return Math.max(0, Math.floor(finalTotal));
  }, [finalTotal]);

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate premium boutique station ST-1 dynamic authorization ledger link
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleDone = () => {
    onPaymentComplete({
      clientName: clientName.trim() || 'Walk-In Customer',
      clientPhone: clientPhone.trim() || '012-0000000',
      items: [...cart],
      subtotal,
      tax,
      total: finalTotal,
      pointsRedeemed: pointsToRedeem,
      pointsDiscount: pointsDiscount,
      pointsEarned: pointsEarned,
    });
    setIsSuccess(false);
    onClose();
  };

  const formatWhatsAppNumber = (num: string): string => {
    // Keep digits only
    const clean = num.replace(/\D/g, '');
    if (!clean) return '';
    // Malaysian formatting rules
    if (clean.startsWith('0')) {
      return '60' + clean.slice(1);
    }
    if (clean.length === 9 || clean.length === 10) {
      if (clean.startsWith('1')) {
         return '60' + clean;
      }
    }
    return clean;
  };

  const generateWhatsAppMessage = () => {
    const itemsText = cart.map(item => `• *${item.name}* (${item.category}): RM ${item.price.toFixed(2)}`).join('\n');
    const discountText = pointsDiscount > 0
      ? `\n*Points Discount (${pointsToRedeem} pts):* -RM ${pointsDiscount.toFixed(2)}`
      : '';
    const earnedText = `\n*Loyalty Points Earned:* +${pointsEarned} pts` +
                       (matchedClient ? `\n*New Points Balance:* ${(matchedClient.points || 0) - pointsToRedeem + pointsEarned} pts` : '');
    
    const msg = `🌟 *NOVA HAIR ATELIER E-RECEIPT* 🌟\n` +
                `----------------------------------------\n` +
                `*Client Name:* ${clientName || 'Walk-In Customer'}\n` +
                `*Date:* ${new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })}\n` +
                `*Payment Method:* ${paymentMethod}\n` +
                `----------------------------------------\n` +
                `*ITEMS:* \n${itemsText}\n` +
                `----------------------------------------\n` +
                `*Subtotal:* RM ${subtotal.toFixed(2)}${discountText}${earnedText}\n` +
                `*TOTAL CHARGED:* RM ${finalTotal.toFixed(2)}\n\n` +
                `Thank you for visiting *NOVA Hair Atelier*! We appreciate your support and look forward to styling you again soon. ✨💇‍♀️`;
    return encodeURIComponent(msg);
  };

  const handleSendWhatsApp = () => {
    const formattedNum = formatWhatsAppNumber(whatsappNum);
    if (!formattedNum) {
      alert('Please enter a valid WhatsApp phone number.');
      return;
    }
    const message = generateWhatsAppMessage();
    const url = `https://wa.me/${formattedNum}?text=${message}`;
    window.open(url, '_blank');
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked. Please allow popups to print the receipt.");
      return;
    }

    const txId = `TX-${Date.now().toString().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
    });
    const timeStr = new Date().toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kuala_Lumpur',
    });

    const itemsHTML = cart.map(item => `
      <div class="line-item" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div class="item-info" style="display: flex; flex-direction: column; max-width: 70%; text-align: left;">
          <span class="item-name" style="font-family: 'Playfair Display', 'Libre Baskerville', serif; font-weight: 700; font-size: 15px; color: #432c1a;">${item.name}</span>
          <span class="item-desc" style="font-family: 'Nunito Sans', sans-serif; font-size: 12px; color: rgba(67, 44, 26, 0.7); margin-top: 2px;">${item.stylist ? `Service by ${item.stylist}` : item.category}</span>
        </div>
        <span class="item-price" style="font-family: 'Playfair Display', 'Libre Baskerville', serif; font-weight: 700; font-size: 15px; color: #432c1a; white-space: nowrap;">RM ${item.price.toFixed(2)}</span>
      </div>
    `).join("");

    let totalsHTML = `
      <div class="total-row" style="display: flex; justify-content: space-between; align-items: center; font-family: 'Nunito Sans', sans-serif; font-size: 14px; color: rgba(67, 44, 26, 0.8); margin-bottom: 8px;">
        <span>Subtotal</span>
        <span>RM ${subtotal.toFixed(2)}</span>
      </div>
    `;

    if (pointsDiscount > 0) {
      totalsHTML += `
        <div class="total-row" style="display: flex; justify-content: space-between; align-items: center; font-family: 'Nunito Sans', sans-serif; font-size: 14px; color: #b45309; font-weight: 600; margin-bottom: 8px;">
          <span>Points Discount (${pointsToRedeem} pts)</span>
          <span>-RM ${pointsDiscount.toFixed(2)}</span>
        </div>
      `;
    }

    if (pointsEarned > 0) {
      totalsHTML += `
        <div class="total-row" style="display: flex; justify-content: space-between; align-items: center; font-family: 'Nunito Sans', sans-serif; font-size: 14px; color: #15803d; font-weight: 600; margin-bottom: 8px;">
          <span>Loyalty Points Earned</span>
          <span>+${pointsEarned} pts</span>
        </div>
      `;
    }

    if (matchedClient) {
      const newBalance = (matchedClient.points || 0) - pointsToRedeem + pointsEarned;
      totalsHTML += `
        <div class="total-row" style="display: flex; justify-content: space-between; align-items: center; font-family: 'Nunito Sans', sans-serif; font-size: 11px; font-style: italic; color: rgba(67, 44, 26, 0.6); margin-bottom: 8px;">
          <span>New Points Balance</span>
          <span>${newBalance} pts</span>
        </div>
      `;
    }

    totalsHTML += `
      <div class="total-row-final" style="display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid rgba(67, 44, 26, 0.3); padding-top: 16px; margin-top: 16px; color: #432c1a;">
        <span class="total-label-final" style="font-family: 'Playfair Display', 'Libre Baskerville', serif; font-size: 24px; font-weight: 700;">Total</span>
        <span class="total-value-final" style="font-family: 'Playfair Display', 'Libre Baskerville', serif; font-size: 24px; font-weight: 700;">RM ${finalTotal.toFixed(2)}</span>
      </div>
    `;

    let paymentIconSVG = `
      <svg class="payment-icon-svg" style="width: 20px; height: 20px; fill: #432c1a;" viewBox="0 0 24 24">
        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
      </svg>
    `;
    let paymentDetailText = paymentMethod;

    if (paymentMethod.toLowerCase().includes('cash')) {
      paymentIconSVG = `
        <svg class="payment-icon-svg" style="width: 20px; height: 20px; fill: #432c1a;" viewBox="0 0 24 24">
          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      `;
      paymentDetailText = 'Cash Register';
    } else if (paymentMethod.toLowerCase().includes('card') || paymentMethod.toLowerCase().includes('visa') || paymentMethod.toLowerCase().includes('master')) {
      paymentIconSVG = `
        <svg class="payment-icon-svg" style="width: 20px; height: 20px; fill: #432c1a;" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
      `;
      paymentDetailText = 'Visa ending in 4242';
    } else if (paymentMethod.toLowerCase().includes('tng') || paymentMethod.toLowerCase().includes('wallet') || paymentMethod.toLowerCase().includes('touch')) {
      paymentIconSVG = `
        <svg class="payment-icon-svg" style="width: 20px; height: 20px; fill: #432c1a;" viewBox="0 0 24 24">
          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      `;
      paymentDetailText = 'Touch & GO QR';
    } else if (paymentMethod.toLowerCase().includes('duitnow') || paymentMethod.toLowerCase().includes('qr')) {
      paymentIconSVG = `
        <svg class="payment-icon-svg" style="width: 20px; height: 20px; fill: #432c1a;" viewBox="0 0 24 24">
          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm-3 2h-2v2h2v-2zm3 2h-2v2h2v-2zm-3 2h-2v2h2v-2zm6-6h-2v2h2v-2zm-3 2h-2v2h2v-2zm3 2h-2v2h2v-2z"/>
        </svg>
      `;
      paymentDetailText = 'DuitNow QR';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${companyInfo?.name || 'NOVA Hair Atelier'} - Receipt ${txId}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=Caveat:wght@400..700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
          <style>
            body {
              background-color: #f4f1ea;
              color: #432c1a;
              font-family: 'Nunito Sans', sans-serif;
              margin: 0;
              padding: 40px 20px;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .receipt-card {
              background-color: #f4f1ea;
              width: 100%;
              max-width: 320px;
              padding: 32px;
              box-sizing: border-box;
              border-radius: 24px;
              box-shadow: 0px 4px 20px rgba(67, 44, 26, 0.05);
              border: 1px solid rgba(67, 44, 26, 0.1);
            }
            @media print {
              body {
                background-color: #f4f1ea;
                padding: 0;
                display: block;
              }
              .receipt-card {
                border: none;
                box-shadow: none;
                max-width: 100%;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 24px; padding-top: 8px;">
              <h2 style="font-family: 'Playfair Display', 'Libre Baskerville', serif; font-size: 32px; font-weight: 700; color: #432c1a; margin: 0 0 8px 0; line-height: 1.2;">
                ${companyInfo?.name || 'NOVA Hair Atelier'}
              </h2>
              <p style="font-family: 'Nunito Sans', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(67, 44, 26, 0.6); margin: 0;">
                Transaction Receipt
              </p>
            </div>

            <!-- Meta Details -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1.5px solid rgba(67, 44, 26, 0.3); margin-bottom: 24px; font-size: 13px;">
              <div style="display: flex; flex-direction: column;">
                <span style="font-family: 'Nunito Sans', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(67, 44, 26, 0.6); margin-bottom: 2px;">Receipt #</span>
                <span style="font-weight: 600; color: #432c1a;">${txId}</span>
              </div>
              <div style="display: flex; flex-direction: column; text-align: right;">
                <span style="font-family: 'Nunito Sans', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(67, 44, 26, 0.6); margin-bottom: 2px;">Date</span>
                <span style="font-weight: 600; color: #432c1a;">${dateStr}</span>
              </div>
            </div>

            <!-- Line Items -->
            <div style="display: flex; flex-direction: column; margin-bottom: 32px;">
              ${itemsHTML}
            </div>

            <!-- Totals Breakdown -->
            <div style="border-top: 1.5px solid rgba(67, 44, 26, 0.3); padding-top: 16px; margin-bottom: 32px;">
              ${totalsHTML}
            </div>

            <!-- Payment Info -->
            <div style="border: 1px solid rgba(67, 44, 26, 0.2); border-radius: 16px; padding: 12px 16px; margin-bottom: 32px; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
              <div style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(67, 44, 26, 0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${paymentIconSVG}
              </div>
              <div style="display: flex; flex-direction: column; text-align: left;">
                <span style="font-family: 'Nunito Sans', sans-serif; font-size: 12px; font-weight: 700; color: #432c1a;">Payment Method</span>
                <span style="font-family: 'Nunito Sans', sans-serif; font-size: 12px; color: rgba(67, 44, 26, 0.7); margin-top: 1px;">${paymentDetailText}</span>
              </div>
              <div style="margin-left: auto; display: flex; align-items: center; justify-content: center; color: #432c1a;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>

            <!-- Stylist Note -->
            <div style="text-align: center; border-top: 1px dashed rgba(67, 44, 26, 0.2); padding-top: 32px; padding-bottom: 8px;">
              <p style="font-family: 'Caveat', cursive; font-size: 24px; color: #432c1a; margin: 0; line-height: 1.2;">
                "Thank you for visiting Nova. We look forward to seeing you again soon."
              </p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-nova-choco/40 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-nova-sand/20 relative overflow-hidden animate-scale-up">
        {/* Close Button */}
        {!isProcessing && !isSuccess && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-nova-choco/60 hover:text-nova-choco hover:bg-nova-beige/30 p-1.5 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSuccess ? (
          /* Payment success screen with beautifully integrated e-receipt & WhatsApp share options */
          <div className="animate-fade-in flex flex-col">
            <div className="text-center flex flex-col items-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center justify-center mb-3 animate-bounce">
                <Check className="w-8 h-8 stroke-[3.5px]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-nova-choco">Payment Settle Success!</h3>
              <p className="text-xs text-nova-choco/50 mt-0.5">Atelier Station ST-1 Ledger Updated.</p>
            </div>

            {/* Simulated Paper E-Receipt Card */}
            <div className="bg-nova-light/75 border border-dashed border-nova-sand/40 rounded-2xl p-5 mb-5 text-left text-xs text-nova-choco/80 font-mono relative">
              {/* decorative side cutouts */}
              <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-r border-nova-sand/15"></div>
              <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-l border-nova-sand/15"></div>

              <div className="text-center mb-4 border-b border-dashed border-nova-sand/20 pb-3">
                <h4 className="font-serif font-black text-sm tracking-wider text-nova-choco">NOVA HAIR ATELIER</h4>
                <p className="text-[9px] text-nova-choco/50 font-sans mt-0.5">Kuala Lumpur, MYR</p>
              </div>

              <div className="space-y-1 text-[11px] mb-3 font-sans font-medium text-nova-choco/70">
                <div className="flex justify-between">
                  <span>Client Name:</span>
                  <span className="font-bold text-nova-choco">{clientName || 'Walk-In Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Channel:</span>
                  <span className="font-bold text-nova-choco">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{new Date().toLocaleString('en-MY', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur' })}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-nova-sand/20 pt-3 space-y-1.5 max-h-32 overflow-y-auto">
                <span className="text-[9px] font-bold text-nova-choco/40 uppercase tracking-widest block mb-1">Itemized Summary</span>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-[11px] font-bold">
                    <span className="truncate pr-4">{item.name}</span>
                    <span>RM {item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-nova-sand/20 pt-3 mt-3 space-y-1 text-right text-[11px] font-sans font-semibold text-nova-choco/70">
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-850 font-bold">
                    <span>Points Redeemed:</span>
                    <span>-{pointsToRedeem} pts (-RM {pointsDiscount.toFixed(2)})</span>
                  </div>
                )}
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Loyalty Points Earned:</span>
                  <span>+{pointsEarned} pts</span>
                </div>
                {matchedClient && (
                  <div className="flex justify-between text-nova-choco/50 text-[10px] italic">
                    <span>New Balance:</span>
                    <span>{(matchedClient.points || 0) - pointsToRedeem + pointsEarned} pts</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-nova-sand/35 pt-2 text-xs font-serif font-black text-nova-choco">
                  <span>Total Settled:</span>
                  <span className="font-mono text-sm">RM {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp E-Receipt Delivery Panel */}
            <div className="bg-green-50/40 border border-green-200/50 p-4 rounded-2xl mb-5">
              <label className="block text-[10px] font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-green-600 stroke-[2.5px]" />
                <span>Send E-Receipt via WhatsApp</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={whatsappNum}
                  onChange={(e) => setWhatsappNum(e.target.value)}
                  placeholder="e.g. 0123456789"
                  className="flex-grow px-3.5 py-2.5 rounded-xl border border-green-200 text-xs font-sans text-nova-choco focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
              <p className="text-[10px] text-green-800/60 mt-1.5 italic font-medium">
                Saves trees! Pre-fills receipt summary details on click.
              </p>
            </div>

            {/* Action Buttons Panel */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="bg-nova-light hover:bg-nova-sand/20 border border-nova-sand/30 text-nova-choco py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 flex justify-center items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-nova-sand stroke-[2.2px]" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="bg-nova-choco hover:bg-nova-choco/95 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all duration-150 flex justify-center items-center gap-2"
              >
                <span>Done & Close</span>
              </button>
            </div>
          </div>
        ) : isProcessing ? (
          /* Processing ledger lock */
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-nova-sand border-t-nova-choco animate-spin mb-4"></div>
            <h3 className="font-serif text-lg font-bold text-nova-choco">Syncing Atelier Ledger...</h3>
            <p className="text-xs text-nova-choco/50 mt-1">Settlement clearance on Station (ST-1).</p>
          </div>
        ) : (
          /* Main checkout receipt interface */
          <div>
            <h3 className="font-serif text-xl font-bold mb-5 text-nova-choco flex items-center gap-2">
              <CreditCard className="w-5.5 h-5.5 text-nova-sand stroke-[2.2px]" />
              <span>Checkout Register</span>
            </h3>

            {/* Quick Summary list of products being checked out */}
            <div className="bg-nova-light/50 border border-nova-sand/15 rounded-2xl p-4 mb-5 max-h-32 overflow-y-auto space-y-2 font-sans text-xs">
              <p className="text-[10px] font-extrabold text-nova-choco/40 uppercase tracking-wider mb-2">Itemized Receipt</p>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-nova-choco/80 font-semibold">
                  <span className="truncate pr-3">{item.name}</span>
                  <span className="font-mono font-bold">RM {item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Client Note */}
            <div className="mb-5 text-xs text-nova-choco/70 font-semibold">
              <span className="text-nova-choco/50">Client Name: </span>
              <span className="text-nova-choco font-bold">{clientName || 'Walk-In Customer'}</span>
              {clientPhone && <span className="text-nova-choco/60 font-mono ml-2">({clientPhone})</span>}
            </div>

            {/* Payment Method Channels Selector */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold mb-2.5 text-nova-choco/70 uppercase tracking-wide">
                Select Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2 font-sans text-xs font-bold">
                {(enabledMethods.length > 0 ? enabledMethods : [
                  { id: 'pay_duitnow', name: 'DuitNow QR', isEnabled: true },
                  { id: 'pay_tng', name: 'Touch & GO QR', isEnabled: true },
                  { id: 'pay_cash', name: 'Cash', isEnabled: true }
                ]).map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.name)}
                    className={`py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border ${
                      paymentMethod === method.name
                        ? 'bg-nova-choco border-nova-choco text-white shadow-md font-extrabold'
                        : 'border-nova-sand/20 hover:bg-nova-beige/10 text-nova-choco'
                    }`}
                  >
                    <span>{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Details Notice */}
            {selectedMethodObj && selectedMethodObj.details && (
              <div className="mb-6 bg-nova-light/40 border border-nova-sand/15 p-3 rounded-2xl text-center text-xs text-nova-choco/80 italic font-medium animate-fade-in">
                💡 {selectedMethodObj.details}
              </div>
            )}

            {/* QR Code Container if selected */}
            {showQR && (
              <div className="mb-6 bg-nova-light/40 border border-nova-sand/15 p-4 rounded-3xl text-center flex flex-col items-center animate-fade-in">
                <span className={`text-[9px] font-extrabold uppercase px-3 py-1 rounded-full mb-3 text-white tracking-widest ${
                  paymentMethod.toLowerCase().includes('duitnow') ? 'bg-[#E11383]' : 'bg-[#005CA9]'
                }`}>
                  Scan {paymentMethod} to Pay
                </span>
                
                {/* Custom Uploaded QR vs default SVG */}
                {paymentMethod.toLowerCase().includes('duitnow') && paymentConfig.duitNowQR ? (
                  <div className="p-3 rounded-2xl bg-white border-2 border-[#E11383] shadow-sm max-w-[150px]">
                    <img src={paymentConfig.duitNowQR} alt="DuitNow QR Code" className="w-32 h-32 object-contain rounded-lg" referrerPolicy="no-referrer" />
                  </div>
                ) : (paymentMethod.toLowerCase().includes('tng') || paymentMethod.toLowerCase().includes('touch')) && paymentConfig.tngQR ? (
                  <div className="p-3 rounded-2xl bg-white border-2 border-[#005CA9] shadow-sm max-w-[150px]">
                    <img src={paymentConfig.tngQR} alt="Touch & GO QR Code" className="w-32 h-32 object-contain rounded-lg" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  /* Simulated Custom Premium Branded QR Code */
                  <div className={`p-3 rounded-2xl bg-white border-2 shadow-sm ${
                    paymentMethod.toLowerCase().includes('duitnow') ? 'border-[#E11383]' : 'border-[#005CA9]'
                  }`}>
                    <svg
                      width="130"
                      height="130"
                      viewBox="0 0 100 100"
                      className={paymentMethod.toLowerCase().includes('duitnow') ? 'text-[#E11383]' : 'text-[#005CA9]'}
                    >
                      {/* QR Code border corners */}
                      <rect x="5" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="9" y="9" width="12" height="12" fill="currentColor" />
                      
                      <rect x="75" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="79" y="9" width="12" height="12" fill="currentColor" />
                      
                      <rect x="5" y="75" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="9" y="79" width="12" height="12" fill="currentColor" />

                      {/* Dots & patterns simulating QR code data */}
                      <path d="M35,5 h5 v5 h-5 Z M45,5 h10 v5 h-10 Z M60,5 h10 v5 h-10 Z M35,15 h10 v5 h-10 Z M50,15 h5 v5 h-5 Z M60,15 h5 v5 h-5 Z M35,25 h5 v5 h-5 Z M45,25 h5 v5 h-5 Z M55,25 h15 v5 h-15 Z" fill="currentColor" />
                      <path d="M5,35 h10 v5 h-10 Z M20,35 h5 v5 h-5 Z M30,35 h15 v5 h-15 Z M50,35 h10 v5 h-10 Z M65,35 h15 v10 h-15 Z M5,45 h5 v5 h-5 Z M15,45 h15 v5 h-15 Z M35,45 h10 v5 h-10 Z M50,45 h5 v5 h-5 Z  M60,45 h5 v5 h-5 Z" fill="currentColor" />
                      <path d="M5,55 h15 v5 h-15 Z M25,55 h5 v5 h-5 Z M35,55 h10 v5 h-10 Z M50,55 h15 v5 h-15 Z M70,55 h10 v5 h-10 Z M5,65 h5 v5 h-5 Z M15,65 h10 v5 h-10 Z M30,65 h5 v5 h-5 Z  M40,65 h15 v5 h-15 Z M60,65 h10 v5 h-10 Z" fill="currentColor" />
                      <path d="M35,75 h5 v5 h-5 Z M45,75 h15 v5 h-15 Z M65,75 h5 v5 h-5 Z M35,85 h10 v5 h-10 Z M50,85 h5 v5 h-5 Z M60,85 h15 v5 h-15 Z M35,95 h5 v5 h-5 Z M45,95 h10 v5 h-10 Z M60,95 h5 v5 h-5 Z" fill="currentColor" />
                      
                      {/* Stylized logo center cutout */}
                      <rect x="38" y="38" width="24" height="24" fill="white" rx="3" />
                      <circle cx="50" cy="50" r="8" fill="currentColor" />
                    </svg>
                  </div>
                )}
                
                <p className="text-[11px] font-bold text-nova-choco mt-2.5">
                  Station ST-1 Dynamic QR Code Generated
                </p>

                {/* Direct Bank transfer details shown for convenience */}
                {(paymentConfig.bankName || paymentConfig.accountNo) && (
                  <div className="w-full mt-3 bg-white p-3.5 rounded-2xl text-left border border-dashed border-nova-sand/35 shadow-inner">
                    <p className="text-[10px] font-extrabold text-nova-choco/40 uppercase tracking-wider mb-1.5">Direct Bank Transfer Details</p>
                    <div className="text-[11px] space-y-1 text-nova-choco font-semibold">
                      {paymentConfig.bankName && <div>Bank: <span className="font-extrabold">{paymentConfig.bankName}</span></div>}
                      {paymentConfig.accountName && <div>Acc Name: <span className="font-extrabold">{paymentConfig.accountName}</span></div>}
                      {paymentConfig.accountNo && <div>Acc Number: <span className="font-extrabold select-all font-mono tracking-wide">{paymentConfig.accountNo}</span></div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loyalty Points Redemption Panel */}
            {matchedClient && matchedClient.points > 0 && (
              <div className="mb-5 bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl font-sans text-xs">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Redeem Client Loyalty Points</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                    Available: {matchedClient.points || 0} pts
                  </span>
                </div>
                
                <p className="text-[11px] text-amber-800/80 mb-3.5 leading-relaxed font-medium">
                  Each 10 points can be redeemed for RM 1.00 discount. (Max redeemable: <span className="font-extrabold">{maxRedeemablePoints} pts</span> for RM {(maxRedeemablePoints / 10).toFixed(2)} off).
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex-grow">
                    <input
                      type="range"
                      min="0"
                      max={maxRedeemablePoints}
                      step="10"
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                      className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-amber-800/60 mt-1 font-bold">
                      <span>0 pts</span>
                      <span>{maxRedeemablePoints} pts</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max={maxRedeemablePoints}
                      value={pointsToRedeem}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(maxRedeemablePoints, Number(e.target.value)));
                        setPointsToRedeem(val);
                      }}
                      className="w-16 px-2 py-1.5 text-center font-mono font-bold border border-amber-300 rounded-xl bg-white text-amber-900 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="font-bold text-amber-800 text-[10px]">pts</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setPointsToRedeem(0)}
                    className="bg-white hover:bg-amber-100/50 border border-amber-200 px-3 py-1.5 rounded-xl font-bold text-[10px] text-amber-800 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // round to nearest 10
                      const roundedMax = Math.floor(maxRedeemablePoints / 10) * 10;
                      setPointsToRedeem(roundedMax);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] transition-colors"
                  >
                    Use Max (RM {(maxRedeemablePoints / 10).toFixed(2)})
                  </button>
                </div>
              </div>
            )}

            {!matchedClient && clientName.trim() && (
              <div className="mb-5 bg-emerald-50/50 border border-emerald-200/60 p-4 rounded-2xl font-sans text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Welcome to the Loyalty Club!</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed font-medium">
                  {clientName} is not registered yet. Completing this order will automatically register them and earn them <span className="font-bold text-emerald-950">{Math.floor(subtotal)} pts</span>!
                </p>
              </div>
            )}

            {/* Final Totals list before processing */}
            <div className="bg-nova-light border border-nova-sand/15 rounded-2xl p-4 mb-6 text-xs font-semibold text-nova-choco space-y-2.5 font-sans">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">RM {subtotal.toFixed(2)}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-50/60 p-2 rounded-xl border border-amber-200/40">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Points Redeemed ({pointsToRedeem} pts):
                  </span>
                  <span className="font-mono">- RM {pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              {clientName.trim() && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Loyalty Points to Earn:</span>
                  <span className="font-mono">+{pointsEarned} pts</span>
                </div>
              )}
              <div className="flex justify-between font-serif text-base font-bold border-t border-nova-sand/15 pt-2.5">
                <span>Final Payable:</span>
                <span className="font-mono text-lg text-nova-choco">RM {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Final Action Button */}
            <button
              onClick={handlePay}
              className="w-full bg-nova-choco hover:bg-nova-choco/95 text-white py-4 rounded-full font-bold text-sm tracking-wide shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2"
            >
              <span>Process {paymentMethod} Payment</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
}

export function InventoryModal({ isOpen, onClose, catalog }: InventoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-nova-choco/40 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-nova-sand/20 relative flex flex-col max-h-[500px]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-nova-choco/60 hover:text-nova-choco hover:bg-nova-beige/30 p-1.5 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-serif text-lg font-bold mb-5 text-nova-choco flex items-center gap-2">
          <ShoppingBag className="w-5.5 h-5.5 text-nova-sand stroke-[2.2px]" />
          <span>Atelier Stock & Services Catalog</span>
        </h3>

        <div className="overflow-y-auto pr-1 flex-grow">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-nova-sand/15 text-nova-choco/50 uppercase tracking-wider font-extrabold">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Standard Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nova-sand/10 font-medium">
              {catalog.map((item, idx) => (
                <tr key={idx} className="hover:bg-nova-beige/10 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-nova-choco flex items-center gap-2">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-7 h-7 rounded-lg object-cover border border-nova-sand/15 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-nova-sand/15 text-nova-choco/50 text-[9px] font-bold rounded-lg flex items-center justify-center shrink-0">
                        {item.category === 'Services' ? 'Srv' : 'Rtl'}
                      </div>
                    )}
                    <span>{item.name}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-nova-sand/20 text-nova-choco/75 uppercase tracking-wide">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">RM {item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export function ReportsModal({ isOpen, onClose, transactions }: ReportsModalProps) {
  const [timeFilter, setTimeFilter] = useState<'All' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom'>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Services' | 'Retail'>('All');
  const [selectedStylist, setSelectedStylist] = useState<string>('All');

  const stylistsList = useMemo(() => {
    const set = new Set<string>();
    set.add('Elara V.');
    set.add('Julian M.');
    set.add('Sarah K.');
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        if (item.stylist) set.add(item.stylist);
      });
    });
    return Array.from(set).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const today = new Date('2026-07-01');
    return transactions.filter((tx) => {
      // Time Filter Presets
      if (timeFilter === 'Daily') {
        if (tx.date !== '2026-07-01') return false;
      } else if (timeFilter === 'Weekly') {
        const txD = new Date(tx.date);
        const diffTime = today.getTime() - txD.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays >= 7) return false;
      } else if (timeFilter === 'Monthly') {
        const txD = new Date(tx.date);
        // July 2026 (month is 6 since index starts at 0)
        if (txD.getFullYear() !== 2026 || txD.getMonth() !== 6) return false;
      } else if (timeFilter === 'Custom') {
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
      }

      if (selectedCategory !== 'All') {
        const hasMatchingCategory = tx.items.some(item => item.category === selectedCategory);
        if (!hasMatchingCategory) return false;
      }

      if (selectedStylist !== 'All') {
        const hasMatchingStylist = tx.items.some(item => item.stylist === selectedStylist);
        if (!hasMatchingStylist) return false;
      }

      return true;
    });
  }, [transactions, timeFilter, startDate, endDate, selectedCategory, selectedStylist]);

  const reportsData = useMemo(() => {
    let grossRevenue = 0;
    let netRevenue = 0;
    let servicesTotal = 0;
    let retailTotal = 0;

    filteredTransactions.forEach((tx) => {
      let txMatchingTotal = 0;

      tx.items.forEach((item) => {
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return;
        if (selectedStylist !== 'All' && item.stylist !== selectedStylist) return;

        txMatchingTotal += item.price;

        if (item.category === 'Services') {
          servicesTotal += item.price;
        } else {
          retailTotal += item.price;
        }
      });

      grossRevenue += txMatchingTotal;
      netRevenue += txMatchingTotal;
    });

    return {
      gross: grossRevenue,
      net: netRevenue,
      services: servicesTotal,
      retail: retailTotal,
    };
  }, [filteredTransactions, selectedCategory, selectedStylist]);

  const getFilteredItemsAndTotal = (tx: Transaction) => {
    const matchingItems = tx.items.filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedStylist !== 'All' && item.stylist !== selectedStylist) return false;
      return true;
    });
    const totalMatchingPrice = matchingItems.reduce((sum, item) => sum + item.price, 0);
    return {
      items: matchingItems,
      total: totalMatchingPrice
    };
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No filtered transactions available to export.");
      return;
    }
    const headers = ["Transaction ID", "Date", "Client Name", "Client Phone", "Items Checked Out", "Total (RM)"];
    const rows = filteredTransactions.map(tx => {
      const { items: matchingItems, total: matchingTotal } = getFilteredItemsAndTotal(tx);
      return [
        tx.id,
        tx.date,
        tx.clientName,
        tx.clientPhone,
        matchingItems.map(item => `${item.name} (${item.category} - ${item.stylist})`).join("; "),
        matchingTotal.toFixed(2)
      ];
    });
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NOVA_Hair_Atelier_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      alert("No filtered transactions available to export.");
      return;
    }
    const headers = ["Transaction ID", "Date", "Client Name", "Client Phone", "Items Checked Out", "Total Price (RM)"];
    const rows = filteredTransactions.map(tx => {
      const { items: matchingItems, total: matchingTotal } = getFilteredItemsAndTotal(tx);
      return [
        tx.id,
        tx.date,
        tx.clientName,
        tx.clientPhone,
        matchingItems.map(item => `${item.name} (${item.category} - ${item.stylist})`).join(", "),
        matchingTotal.toFixed(2)
      ];
    });
    
    const content = [headers, ...rows].map(row => row.join("\t")).join("\n");
    const blob = new Blob(["\ufeff" + content], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NOVA_Hair_Atelier_Sales_Report_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      alert("No filtered transactions available to export.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked. Please allow popups to export PDF.");
      return;
    }
    
    const itemsHTML = filteredTransactions.map(tx => {
      const { items: matchingItems, total: matchingTotal } = getFilteredItemsAndTotal(tx);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: bold;">${tx.id}</td>
          <td style="padding: 10px;">${tx.date}</td>
          <td style="padding: 10px; font-weight: 500;">${tx.clientName}</td>
          <td style="padding: 10px; font-family: monospace;">${tx.clientPhone}</td>
          <td style="padding: 10px; max-width: 300px;">${matchingItems.map(i => `${i.name} (${i.category} - ${i.stylist})`).join("<br/>")}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; font-family: monospace;">RM ${matchingTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    const totalSum = reportsData.gross;

    printWindow.document.write(`
      <html>
        <head>
          <title>NOVA Hair Atelier - Sales Report Ledger</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e1b18; margin: 40px; padding: 0; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #8e7355; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0; font-family: Georgia, serif; color: #3d2f23; }
            .meta { text-align: right; font-size: 12px; color: #6b5a4b; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background-color: #f7f5f2; color: #3d2f23; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 10px; text-align: left; font-size: 11px; border-bottom: 2px solid #e2e8f0; }
            .totals-card { margin-top: 30px; border-top: 2px solid #8e7355; padding-top: 15px; display: flex; justify-content: flex-end; }
            .total-box { background-color: #f7f5f2; padding: 15px 25px; border-radius: 8px; text-align: right; }
            .total-label { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #6b5a4b; }
            .total-val { font-size: 20px; font-weight: 900; color: #3d2f23; margin-top: 5px; font-family: monospace; }
            @media print {
              body { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
           <div class="header">
             <div>
               <h1>NOVA HAIR ATELIER</h1>
               <p style="margin: 5px 0 0 0; font-size: 13px; color: #8e7355; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Official Sales Ledger Report</p>
             </div>
             <div class="meta">
               <strong>Generated:</strong> ${new Date().toLocaleDateString('en-MY', { dateStyle: 'long', timeZone: 'Asia/Kuala_Lumpur' })}<br/>
               <strong>Total Tickets:</strong> ${filteredTransactions.length}<br/>
               <strong>Date Period:</strong> ${
                 timeFilter === 'All' ? 'All Ledger Records' :
                 timeFilter === 'Daily' ? 'Today (2026-07-01)' :
                 timeFilter === 'Weekly' ? 'Past 7 Days (2026-06-25 to 2026-07-01)' :
                 timeFilter === 'Monthly' ? 'July 2026' :
                 `${startDate || 'Anytime'} to ${endDate || 'Anytime'}`
               }<br/>
               ${selectedCategory !== 'All' ? `<strong>Category Filter:</strong> ${selectedCategory}<br/>` : ''}
               ${selectedStylist !== 'All' ? `<strong>Stylist Filter:</strong> ${selectedStylist}<br/>` : ''}
             </div>
           </div>
           <table>
             <thead>
               <tr>
                 <th>Tx ID</th>
                 <th>Date</th>
                 <th>Client Name</th>
                 <th>Phone</th>
                 <th>Services & Retail Items (Filtered)</th>
                 <th style="text-align: right;">Total Paid</th>
               </tr>
             </thead>
             <tbody>
               ${itemsHTML}
             </tbody>
           </table>
           <div class="totals-card">
             <div class="total-box">
               <div class="total-label">Gross Operational Sales</div>
               <div class="total-val">RM ${totalSum.toFixed(2)}</div>
             </div>
           </div>
           <script>
             window.onload = function() {
               window.print();
             };
           </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-nova-choco/40 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-nova-sand/20 relative flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-nova-choco/60 hover:text-nova-choco hover:bg-nova-beige/30 p-1.5 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-serif text-lg font-bold mb-4 text-nova-choco flex items-center gap-2">
          <ClipboardList className="w-5.5 h-5.5 text-nova-sand stroke-[2.2px]" />
          <span>Atelier Operational Report</span>
        </h3>

        {/* Filters Panel */}
        <div className="bg-nova-light/50 border border-nova-sand/15 rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between border-b border-nova-sand/10 pb-1.5 mb-1">
            <span className="text-[10px] font-bold text-nova-choco/50 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-nova-sand stroke-[2.2px]" />
              <span>Operational Report Filters</span>
            </span>
            {(timeFilter !== 'All' || startDate || endDate || selectedCategory !== 'All' || selectedStylist !== 'All') && (
              <button
                onClick={() => {
                  setTimeFilter('All');
                  setStartDate('');
                  setEndDate('');
                  setSelectedCategory('All');
                  setSelectedStylist('All');
                }}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Time Filter Presets Selector */}
          <div>
            <label className="block text-[9px] font-extrabold mb-1.5 text-nova-choco/60 uppercase tracking-wider">
              Date Filter Period
            </label>
            <div className="grid grid-cols-5 gap-1 p-1 bg-white/80 rounded-xl border border-nova-sand/15">
              {(['All', 'Daily', 'Weekly', 'Monthly', 'Custom'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTimeFilter(preset);
                    if (preset !== 'Custom') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                    timeFilter === preset
                      ? 'bg-nova-sand text-nova-choco shadow-sm'
                      : 'text-nova-choco/60 hover:bg-nova-sand/10 hover:text-nova-choco'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Date indicator or custom range inputs */}
          {timeFilter !== 'All' && timeFilter !== 'Custom' && (
            <div className="bg-white/60 rounded-xl px-3 py-2 text-[10px] font-semibold text-nova-choco/75 border border-nova-sand/15 flex justify-between items-center">
              <span className="uppercase tracking-wider text-[8px] font-bold text-nova-choco/50">Active Range</span>
              <span className="font-bold text-nova-choco font-mono text-xs">
                {timeFilter === 'Daily' && 'Today (2026-07-01)'}
                {timeFilter === 'Weekly' && 'Past 7 Days (2026-06-25 ~ 2026-07-01)'}
                {timeFilter === 'Monthly' && 'July 2026'}
              </span>
            </div>
          )}

          {timeFilter === 'Custom' && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-[9px] font-extrabold mb-1 text-nova-choco/60 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco"
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold mb-1 text-nova-choco/60 uppercase tracking-wider">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco"
                />
              </div>
            </div>
          )}

          {/* Service Category & Stylist selects */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-extrabold mb-1 text-nova-choco/60 uppercase tracking-wider">
                Service/Product Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'All' | 'Services' | 'Retail')}
                className="w-full px-2.5 py-1.5 rounded-lg border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco cursor-pointer"
              >
                <option value="All">All Items (Services & Retail)</option>
                <option value="Services">Services Only</option>
                <option value="Retail">Retail Products Only</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-extrabold mb-1 text-nova-choco/60 uppercase tracking-wider">
                Stylist Name
              </label>
              <select
                value={selectedStylist}
                onChange={(e) => setSelectedStylist(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-nova-sand/30 text-xs font-sans text-nova-choco bg-white focus:outline-none focus:border-nova-choco cursor-pointer"
              >
                <option value="All">All Stylists</option>
                {stylistsList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 font-sans text-xs">
          <p className="text-nova-choco/50 font-bold uppercase tracking-wider border-b border-nova-sand/10 pb-1">
            Summary Accounting Ledger ({filteredTransactions.length} Match{filteredTransactions.length === 1 ? '' : 'es'})
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-nova-light rounded-2xl p-4 border border-nova-sand/15">
              <span className="text-[10px] font-bold text-nova-choco/40 uppercase block tracking-wider">Gross Salon Revenue</span>
              <span className="font-serif text-lg font-black text-nova-choco block font-mono mt-1">
                RM {reportsData.gross.toFixed(2)}
              </span>
            </div>
            <div className="bg-nova-light rounded-2xl p-4 border border-nova-sand/15">
              <span className="text-[10px] font-bold text-nova-choco/40 uppercase block tracking-wider">Net Volume</span>
              <span className="font-serif text-lg font-black text-nova-choco block font-mono mt-1">
                RM {reportsData.net.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-nova-choco/50 font-bold uppercase tracking-wider border-b border-nova-sand/10 pb-1 pt-1">
            Breakdown Categories
          </p>

          <div className="space-y-3 font-semibold text-nova-choco/80 bg-nova-light/40 border border-nova-sand/10 p-4 rounded-2xl">
            <div className="flex justify-between">
              <span>Treatment & Services Sales:</span>
              <span className="font-mono font-bold">RM {reportsData.services.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Boutique Product Retail Sales:</span>
              <span className="font-mono font-bold">RM {reportsData.retail.toFixed(2)}</span>
            </div>
          </div>

          {/* Export Actions Panel */}
          <div className="mt-4 pt-3 border-t border-nova-sand/15">
            <p className="text-[10px] font-extrabold text-nova-choco/40 uppercase block tracking-wider mb-2 text-center">Export Ledger Data</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleExportCSV}
                className="bg-nova-light hover:bg-nova-sand/20 border border-nova-sand/30 text-nova-choco py-2 px-3 rounded-xl font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer animate-pulse-subtle"
              >
                <Download className="w-3.5 h-3.5 text-nova-sand" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-nova-light hover:bg-nova-sand/20 border border-nova-sand/30 text-nova-choco py-2 px-3 rounded-xl font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer animate-pulse-subtle"
              >
                <Download className="w-3.5 h-3.5 text-nova-sand" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-nova-choco hover:bg-nova-choco/95 text-white py-2 px-3 rounded-xl font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF (Print)</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-nova-choco/40 text-center italic mt-2 font-sans leading-relaxed">
            Report covers operational transactions and live ledger items initialized inside client states.
          </div>
        </div>
      </div>
    </div>
  );
}
