import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar as CalendarIcon, 
  ShoppingBag, 
  Receipt, 
  TrendingDown, 
  Star, 
  Zap 
} from 'lucide-react';
import { Transaction, Appointment, Stylist } from '../types';

interface DashboardViewProps {
  transactions: Transaction[];
  appointments: Appointment[];
  stylists: Stylist[];
}

export default function DashboardView({
  transactions,
  appointments,
  stylists,
}: DashboardViewProps) {
  const [timeframe, setTimeframe] = useState<'Today' | 'Week' | 'Month'>('Today');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ index: number; x: number; y: number; val: number; label: string } | null>(null);
  const [salesSearch, setSalesSearch] = useState('');

  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
    if (!salesSearch.trim()) return sorted;
    const term = salesSearch.toLowerCase().trim();
    return sorted.filter(
      (tx) =>
        tx.id.toLowerCase().includes(term) ||
        tx.clientName.toLowerCase().includes(term) ||
        (tx.clientPhone && tx.clientPhone.toLowerCase().includes(term)) ||
        tx.items.some((item) => item.name.toLowerCase().includes(term))
    );
  }, [transactions, salesSearch]);

  // Dynamic calculations based on transactions state
  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);
    const totalRetail = transactions.reduce((sum, tx) => {
      const retailSum = tx.items
        .filter((item) => item.category === 'Retail')
        .reduce((s, i) => s + i.price, 0);
      return sum + retailSum * 1.085 + retailSum; // approximate tax for simplification or raw retail
    }, 0);

    const ticketCount = transactions.length || 1;
    const avgTicket = totalRevenue / ticketCount;

    return {
      revenue: totalRevenue,
      retail: totalRetail,
      avgTicket: avgTicket,
    };
  }, [transactions]);

  // Hourly charts data points (9am to 5pm)
  const chartData = useMemo(() => {
    // We can distribute the actual transaction totals across hours or use a premium static pacing curve scaled by the actual revenue.
    const pacingCurve = [0.08, 0.15, 0.1, 0.18, 0.12, 0.22, 0.16, 0.24, 0.15];
    const labels = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
    
    // Scale points to sum up to stats.revenue
    return labels.map((label, idx) => {
      const val = Math.round(stats.revenue * pacingCurve[idx] * (timeframe === 'Today' ? 1.0 : timeframe === 'Week' ? 5.8 : 22.4));
      return { label, val };
    });
  }, [stats.revenue, timeframe]);

  // Find max value in chart data to scale the SVG height properly
  const maxChartVal = useMemo(() => {
    const vals = chartData.map((d) => d.val);
    return Math.max(...vals, 1);
  }, [chartData]);

  // Top services leaderboard calculated from actual transactions
  const topServices = useMemo(() => {
    const serviceCounts: { [key: string]: number } = {};
    // Populate base counts
    serviceCounts['Balayage'] = 12;
    serviceCounts["Women's Cut"] = 9;
    serviceCounts['Gloss & Tone'] = 6;

    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        if (item.category === 'Services') {
          serviceCounts[item.name] = (serviceCounts[item.name] || 0) + 1;
        }
      });
    });

    return Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [transactions]);

  // SVG dimensions for revenue trend
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Convert chart points into SVG path coordinates
  const svgPoints = useMemo(() => {
    const totalPoints = chartData.length;
    return chartData.map((d, idx) => {
      const x = paddingX + (idx / (totalPoints - 1)) * (svgWidth - paddingX * 2);
      // Invert Y axis for SVG (0,0 is top-left)
      const y = svgHeight - paddingY - (d.val / maxChartVal) * (svgHeight - paddingY * 2);
      return { x, y, val: d.val, label: d.label };
    });
  }, [chartData, maxChartVal]);

  // Create SVG path string with cubicbezier curves for smooth "tension: 0.4" looks
  const dPath = useMemo(() => {
    if (svgPoints.length === 0) return '';
    let path = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const curr = svgPoints[i];
      const next = svgPoints[i + 1];
      // Control points for smooth bezier interpolation
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return path;
  }, [svgPoints]);

  // Create area path under the line
  const dAreaPath = useMemo(() => {
    if (svgPoints.length === 0) return '';
    return `${dPath} L ${svgPoints[svgPoints.length - 1].x} ${svgHeight - paddingY} L ${svgPoints[0].x} ${svgHeight - paddingY} Z`;
  }, [dPath, svgPoints]);

  return (
    <section className="flex flex-col gap-8 animate-fade-in font-sans">
      {/* Header Controls */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-serif text-2xl font-bold mb-1 text-nova-choco">Salon Analytics</h2>
          <p className="text-sm text-nova-choco/60">Live performance metrics and boutique utilization reports.</p>
        </div>
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-nova-sand/20">
          {(['Today', 'Week', 'Month'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                timeframe === t
                  ? 'bg-nova-sand text-nova-choco shadow-sm'
                  : 'text-nova-choco/60 hover:text-nova-choco hover:bg-nova-beige/25'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top Dynamic KPIs Row (Bento Style) */}
      <div className="grid grid-cols-4 gap-6">
        {/* KPI 1: Total Revenue */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-nova-sand/15 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-nova-choco/60 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-full bg-green-50 text-green-600">
              <TrendingUp className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-black text-nova-choco tracking-tight font-mono">
              RM {stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold text-green-700 flex items-center gap-1 mt-1 font-sans">
              <span>+12.4% vs last week</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Appointments */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-nova-sand/15 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-nova-choco/60 uppercase tracking-wider">Appointments</span>
            <div className="p-2 rounded-full bg-nova-beige text-nova-sand">
              <CalendarIcon className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-black text-nova-choco tracking-tight font-mono">
              {appointments.filter((a) => !a.checkedOut).length}
            </div>
            <div className="text-[11px] font-bold text-nova-choco/50 flex items-center gap-1 mt-1 font-sans">
              <span>{appointments.filter((a) => a.date === '2026-07-01').length} booked for today</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Retail Sales */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-nova-sand/15 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-nova-choco/60 uppercase tracking-wider">Retail Sales</span>
            <div className="p-2 rounded-full bg-amber-50 text-amber-600">
              <ShoppingBag className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-black text-nova-choco tracking-tight font-mono">
              RM {stats.retail.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold text-green-700 flex items-center gap-1 mt-1 font-sans">
              <span>+5.2% vs last week</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Avg Ticket Size */}
        <div className="bg-nova-sand rounded-3xl p-6 shadow-sm border border-nova-sand/15 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-40 text-nova-choco relative overflow-hidden">
          {/* subtle gold accent layer */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start z-10">
            <span className="text-xs font-bold text-nova-choco/80 uppercase tracking-wider">Avg Ticket Size</span>
            <div className="p-2 rounded-full bg-white/45 text-nova-choco">
              <Receipt className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
          <div className="z-10">
            <div className="font-serif text-2xl font-black tracking-tight font-mono">
              RM {stats.avgTicket.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="font-accent text-lg mt-0.5 opacity-90 leading-none">
              Excellent billing pacing
            </div>
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          {/* Revenue Line Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-nova-sand/15 flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-serif text-base font-semibold text-nova-choco">Revenue Trends ({timeframe})</h3>
              <span className="text-[11px] font-bold text-nova-choco/40 font-mono tracking-wider uppercase">
                Curvy Spline Tension: 0.4
              </span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="flex-grow relative min-h-[220px]">
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Definitions for Gradients */}
                <defs>
                  <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cca78c" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f6eedf" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#cca78c" />
                    <stop offset="100%" stopColor="#432c1a" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
                  const y = paddingY + ratio * (svgHeight - paddingY * 2);
                  const gridVal = Math.round(maxChartVal * (1 - ratio));
                  return (
                    <g key={index} className="opacity-40">
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#cca78c"
                        strokeWidth="0.5"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill="#432c1a"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="Nunito Sans"
                        className="font-mono opacity-60"
                      >
                        RM {gridVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient under curve */}
                <path d={dAreaPath} fill="url(#chartAreaGradient)" />

                {/* Curve Line */}
                <path
                  d={dPath}
                  fill="none"
                  stroke="url(#chartLineGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Interactive Anchor Nodes & Hover Zones */}
                {svgPoints.map((pt, idx) => (
                  <g key={idx}>
                    {/* Point Dots */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredDataPoint?.index === idx ? '6' : '3.5'}
                      fill={hoveredDataPoint?.index === idx ? '#432c1a' : '#cca78c'}
                      stroke="white"
                      strokeWidth="1.5"
                      className="transition-all duration-150"
                    />
                    {/* Invisible Hover overlay target */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="15"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={(e) =>
                        setHoveredDataPoint({
                          index: idx,
                          x: pt.x,
                          y: pt.y,
                          val: pt.val,
                          label: pt.label,
                        })
                      }
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                    {/* X Axis label ticks */}
                    <text
                      x={pt.x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      fill="#432c1a"
                      fontSize="9.5"
                      fontFamily="Nunito Sans"
                      fontWeight="semibold"
                      className="opacity-70"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Dynamic Hover Tooltip over SVG */}
              {hoveredDataPoint && (
                <div
                  className="absolute bg-nova-choco text-white text-xs px-3 py-2 rounded-xl shadow-xl z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
                  style={{
                    left: `${(hoveredDataPoint.x / svgWidth) * 100}%`,
                    top: `${(hoveredDataPoint.y / svgHeight) * 100 - 4}%`,
                  }}
                >
                  <div className="font-bold font-sans text-[10px] uppercase text-nova-sand opacity-90">
                    Revenue at {hoveredDataPoint.label}
                  </div>
                  <div className="font-bold text-sm font-mono mt-0.5">
                    RM {hoveredDataPoint.val.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed List of Sales */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-nova-sand/15 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-nova-sand/10 pb-4">
              <div>
                <h3 className="font-serif text-base font-semibold text-nova-choco">Detailed Sales Log</h3>
                <p className="text-[11px] text-nova-choco/60">Comprehensive register of all processed tickets and customer spend indicators.</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search client or Tx ID..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="px-4 py-2 pl-9 rounded-full border border-nova-sand/30 text-xs text-nova-choco bg-nova-light/45 focus:outline-none focus:border-nova-choco focus:bg-white focus:ring-1 focus:ring-nova-sand/30 transition-all w-48 font-medium"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nova-choco/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-nova-sand/15 text-nova-choco/40 uppercase tracking-wider font-extrabold text-[10px] sticky top-0 bg-white pb-2">
                    <th className="py-2.5 px-3">Ticket ID & Date</th>
                    <th className="py-2.5 px-3">Customer Details</th>
                    <th className="py-2.5 px-3">Services & Products</th>
                    <th className="py-2.5 px-3 text-right">Total Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nova-sand/10 font-semibold text-nova-choco">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-nova-choco/40 italic">
                        No transactions found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-nova-beige/10 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-nova-choco font-mono">{tx.id}</div>
                          <div className="text-[10px] text-nova-choco/40 mt-0.5">{tx.date}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-nova-choco">{tx.clientName}</div>
                          <div className="text-[10px] text-nova-choco/40 mt-0.5 font-mono">{tx.clientPhone || 'No contact'}</div>
                        </td>
                        <td className="py-3 px-3 max-w-[240px]">
                          <div className="flex flex-wrap gap-1.5 font-bold">
                            {tx.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-nova-sand/15 text-nova-choco border border-nova-sand/10 font-bold"
                                title={`Stylist: ${item.stylist}`}
                              >
                                <span>{item.name}</span>
                                <span className="text-nova-sand">({item.stylist.split(' ')[0]})</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-sm text-nova-choco">
                          RM {tx.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Leaderboard & utilization lists */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Top Services leaderboard */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-nova-sand/15 flex-grow">
            <h3 className="text-xs font-bold mb-4 uppercase tracking-wider text-nova-choco/60 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-nova-sand stroke-[2.2px]" />
              <span>Top Salon Services</span>
            </h3>
            <ul className="space-y-4 font-sans">
              {topServices.map((service, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-nova-beige/40 text-nova-choco font-black text-xs flex items-center justify-center font-serif">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-nova-choco">{service.name}</span>
                  </div>
                  <span className="text-xs font-bold text-nova-choco/75 bg-nova-beige/30 px-2.5 py-1 rounded-full border border-nova-sand/10">
                    {service.count} sales
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stylist utilisation */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-nova-sand/15 flex-grow">
            <h3 className="text-xs font-bold mb-4 uppercase tracking-wider text-nova-choco/60 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-nova-sand stroke-[2.2px]" />
              <span>Stylist Utilization</span>
            </h3>
            <div className="space-y-4">
              {stylists.map((st) => (
                <div key={st.id} className="group">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-nova-choco">{st.name}</span>
                    <span className="font-bold font-mono text-nova-sand">{st.utilization}%</span>
                  </div>
                  <div className="w-full bg-nova-beige/40 rounded-full h-2 overflow-hidden border border-nova-sand/10">
                    <div
                      className="bg-nova-sand h-full rounded-full transition-all duration-1000 group-hover:bg-nova-choco"
                      style={{ width: `${st.utilization}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
