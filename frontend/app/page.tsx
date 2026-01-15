"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { API_URL } from "../lib/config";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Loader2,
  Upload,
  Trash2,
  Download,
  History,
  Menu,
  Mic,
  SlidersHorizontal,
  Zap,
  Volume2,
  StopCircle,
  FileText,
  X,
  Send,
  BarChartIcon,
} from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";
import WorldBackground from "../components/WorldBackground";

export default function Home() {
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Sidebar starts closed
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [simMode, setSimMode] = useState(false);
  const [simFactor, setSimFactor] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chart Toggle State
  const [wantsChart, setWantsChart] = useState(false);

  // Report State
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const COLORS = [
    "#6366f1",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#f59e0b",
    "#f43f5e",
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chartData && mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: mainScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chartData]);

  useEffect(() => {
    setSimFactor(0);
    setSimMode(false);
    stopSpeaking();
  }, [chartData]);

  const simulatedData = useMemo(() => {
    if (!chartData || !chartData.data) return [];
    if (simFactor === 0) return chartData.data;
    return chartData.data.map((item: any) => ({
      ...item,
      value: Math.round(item.value * (1 + simFactor / 100)),
      original: item.value,
    }));
  }, [chartData, simFactor]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (e) {}
  };

  const speakSummary = () => {
    if (!chartData?.summary) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(chartData.summary);
    window.speechSynthesis.speak(utterance);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
  };
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.onstart = () => setQuery("Listening...");
      recognition.onresult = (event: any) =>
        setQuery(event.results[0][0].transcript);
      recognition.start();
    } else {
      alert("Browser not supported.");
    }
  };

  const handleClear = async () => {
    stopSpeaking();
    setQuery("");
    setChartData(null);
    setFile(null);
    await fetch(`${API_URL}/reset`, { method: "POST" });
    setHistory([]);
  };

  const handleDownload = async () => {
    if (chartRef.current) {
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "DataBrief-chart.png";
      link.href = dataUrl;
      link.click();
    }
  };

  const handleSearch = async (overrideQuery?: string) => {
    const activeQuery = overrideQuery || query;
    if (!activeQuery && !file) return;

    stopSpeaking();
    if (wantsChart) setChartData(null);
    setLoading(true);

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }

    const formData = new FormData();
    formData.append("query", activeQuery || "Analyze this data");
    formData.append("needs_chart", wantsChart ? "true" : "false");
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data?.error) {
        alert(data.error);
      } else {
        if (wantsChart) {
          setChartData(data);
        } else {
          setChartData({
            summary: data.summary,
            title: "Analysis Result",
            suggestions: [],
          });
        }
        fetchHistory();
      }
    } catch (error) {
      alert("Failed to analyze.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSession = async () => {
    if (history.length === 0) {
      alert("No session data to summarize yet!");
      return;
    }
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/summary`);
      const data = await res.json();
      if (data.error) {
        alert("Could not generate summary.");
      } else {
        setReportData(data);
        setShowReport(true);
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
        };
        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            colors: ["#6366f1", "#ec4899", "#14b8a6"],
            origin: { x: Math.random(), y: Math.random() - 0.2 },
          });
        }, 250);
      }
    } catch (e) {
      alert("Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(26);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text("DataBrief AI", 20, 25);
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Automated Executive Briefing", 20, 32);
    doc.text(new Date().toLocaleDateString(), pageWidth - 20, 25, {
      align: "right",
    });
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 40, pageWidth - 20, 40);
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(reportData.title, 20, 65);
    let yPos = 85;
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("KEY INSIGHTS", 20, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    reportData.key_findings.forEach((item: string) => {
      const lines = doc.splitTextToSize(`•  ${item}`, pageWidth - 40);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 7 + 4;
    });
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text("STRATEGIC MOVES", 20, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    reportData.suggestions.forEach((item: string) => {
      const lines = doc.splitTextToSize(`➜  ${item}`, pageWidth - 40);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 7 + 4;
    });
    doc.save("DataBrief-Executive-Report.pdf");
  };

  const closeAndClear = async () => {
    setShowReport(false);
    handleClear();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const unit = chartData.unit || "";
      const isCurrency = ["$", "₹", "€", "£", "¥"].includes(unit);
      const formattedValue = isCurrency
        ? `${unit}${item.value.toLocaleString()}`
        : `${item.value.toLocaleString()} ${unit}`;

      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-50">
          <p className="font-bold text-gray-700 mb-1">{label}</p>
          <div className="text-sm space-y-1">
            <p className="text-indigo-600 font-semibold">
              Value: {formattedValue}
            </p>
            {simMode && (
              <p
                className={`text-xs font-bold ${
                  simFactor > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {simFactor > 0 ? "▲" : "▼"} {simFactor}% Impact
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!chartData || !chartData.data) return null;
    const { chart_type } = chartData;
    const data = simulatedData;

    if (chart_type === "pie")
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    if (chart_type === "line")
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis dataKey="name" />
            <YAxis
              width={60}
              tickFormatter={(value) => {
                const unit = chartData.unit || "";
                const isCurrency = ["$", "₹", "€", "£", "¥"].includes(unit);
                if (value >= 1000)
                  return isCurrency
                    ? `${unit}${(value / 1000).toFixed(1)}k`
                    : `${(value / 1000).toFixed(1)}k`;
                return isCurrency ? `${unit}${value}` : value;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={4}
              dot={{ r: 6, fill: "#6366f1" }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis dataKey="name" />
          <YAxis
            width={60}
            tickFormatter={(value) => {
              const unit = chartData.unit || "";
              const isCurrency = ["$", "₹", "€", "£", "¥"].includes(unit);
              if (value >= 1000)
                return isCurrency
                  ? `${unit}${(value / 1000).toFixed(1)}k`
                  : `${(value / 1000).toFixed(1)}k`;
              return isCurrency ? `${unit}${value}` : value;
            }}
          />
          <Tooltip cursor={{ fill: "#f3f4f6" }} content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
            {data.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden font-sans text-gray-900">
      <WorldBackground isSnowing={true} />

      {/* MOBILE BACKDROP - Closes Sidebar when clicked */}
      {isSidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* SIDEBAR - Pushes content on Desktop, Overlays on Mobile */}
      <aside
        className={`
          ${isSidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full"}
          fixed md:relative z-50 h-full
          bg-white border-r border-gray-200 shadow-2xl transition-all duration-300 ease-in-out flex flex-col shrink-0 overflow-hidden
        `}
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 min-w-[320px]">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={20} className="text-indigo-600" /> History
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white min-w-[320px]">
          {history.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-10">
              No history yet.
            </p>
          )}
          {history.map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm shadow-sm border ${
                item.role === "user"
                  ? "bg-white border-gray-200 text-gray-800"
                  : "bg-indigo-50 border-indigo-100 text-indigo-900"
              }`}
            >
              <div className="opacity-70 text-xs font-bold mb-1 uppercase tracking-wider">
                {item.role}
              </div>
              {item.content}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT - FLEX COLUMN LAYOUT */}
      <main className="flex-1 flex flex-col h-full relative w-full bg-transparent min-w-0">
        {/* Header - Fixed Height */}
        <header className="bg-white/80 backdrop-blur-md border-b border-white/20 px-6 py-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100/50 rounded-lg text-black transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-extrabold text-black flex items-center gap-2">
              DataBrief AI
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFinishSession}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-black hover:text-blue-950 hover:bg-white/10 rounded-lg transition-colors"
              title="Generate Report"
            >
              {reportLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <FileText size={18} />
              )}
              <span className="hidden sm:inline">Report</span>
            </button>
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Clear Chat"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Content (Takes up all middle space) */}
        <div
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 w-full scroll-smooth"
        >
          {chartData && (
            <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Chart Card */}
              <div className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/50">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                      {chartData.title}
                    </h2>
                    {simMode && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                          Simulation Mode Active
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  {chartData.data && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSimMode(!simMode)}
                        className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                          simMode
                            ? "bg-indigo-600 text-white shadow-indigo-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {simMode ? (
                          <Zap size={16} fill="white" />
                        ) : (
                          <SlidersHorizontal size={16} />
                        )}
                        {simMode ? "Simulator ON" : "Simulator"}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                        title="Download Chart"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Simulator Slider */}
                {simMode && (
                  <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
                    <div className="flex justify-between text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">
                      <span>Decrease (-50%)</span>
                      <span>Increase (+50%)</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={simFactor}
                      onChange={(e) => setSimFactor(Number(e.target.value))}
                      className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700"
                    />
                    <div className="text-center mt-2 font-mono text-indigo-700 font-bold text-lg">
                      {simFactor > 0 ? "+" : ""}
                      {simFactor}% Impact
                    </div>
                  </div>
                )}

                {/* The Chart */}
                {chartData.data && (
                  <div
                    ref={chartRef}
                    className="bg-white p-2 rounded-xl border border-gray-50"
                  >
                    <div className="w-full h-64 sm:h-96">{renderChart()}</div>
                  </div>
                )}
              </div>

              {/* Analysis Text Card */}
              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/40 flex gap-4 items-start">
                <button
                  onClick={isSpeaking ? stopSpeaking : speakSummary}
                  className={`mt-1 p-3 rounded-full transition-all shrink-0 shadow-sm ${
                    isSpeaking
                      ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200"
                      : "bg-white text-gray-500 hover:text-indigo-600 hover:shadow-md"
                  }`}
                >
                  {isSpeaking ? (
                    <StopCircle size={24} />
                  ) : (
                    <Volume2 size={24} />
                  )}
                </button>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                    AI Insights
                  </h3>
                  <p className="text-gray-800 leading-relaxed text-base sm:text-lg">
                    {chartData.summary}
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              {chartData.suggestions && (
                <div className="flex flex-wrap gap-2 justify-center pb-4">
                  {chartData.suggestions.map((question: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(question);
                        handleSearch(question);
                      }}
                      className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-600 text-sm font-medium rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      ✨ {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* INPUT AREA (Pinned to Bottom, No Overlap, No Glaze) */}
        <div className="p-4 w-full max-w-4xl mx-auto z-30 shrink-0">
          <div className="flex flex-col gap-3">
            {/* Action Pills */}
            <div className="flex flex-wrap items-center gap-2 pl-2 mb-1">
              <label className="group flex items-center gap-2 cursor-pointer text-xs font-bold text-black hover:text-indigo-400 transition-colors bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-300 shadow-sm">
                <Upload
                  size={14}
                  className="group-hover:scale-110 transition-transform"
                />
                {file ? (
                  <span className="text-indigo-600">{file.name}</span>
                ) : (
                  "Attach CSV"
                )}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
              </label>
              {file && (
                <button
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              <button
                onClick={() => setWantsChart(!wantsChart)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-all shadow-sm select-none ${
                  wantsChart
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200"
                    : "bg-white text-black border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {wantsChart ? (
                  <Zap size={14} fill="white" />
                ) : (
                  <BarChartIcon size={14} />
                )}
                {wantsChart ? "Chart: ON" : "Generate Chart"}
              </button>
            </div>

            {/* Input Field - Clean White Bar */}
            <div className="flex gap-2 items-center bg-white rounded-2xl p-2 border border-gray-300 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition-all">
              <input
                type="text"
                placeholder="Ask about crypto, stocks, or upload data..."
                className="flex-1 p-3 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={startListening}
                className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Mic size={20} />
              </button>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="bg-indigo-600 text-white p-3 rounded-xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReport(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 transition-transform hover:rotate-90"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Executive Briefing
              </h2>
              <div className="mt-2 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase">
                {reportData.title}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3">
                  Key Insights
                </h3>
                <ul className="space-y-3">
                  {reportData.key_findings?.map((f: string, i: number) => (
                    <li key={i} className="flex gap-3 text-gray-700 text-sm">
                      <span className="text-indigo-500 font-bold">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-black text-green-600 uppercase tracking-widest mb-3">
                  Strategic Moves
                </h3>
                <ul className="space-y-3">
                  {reportData.suggestions?.map((s: string, i: number) => (
                    <li key={i} className="flex gap-3 text-gray-700 text-sm">
                      <span className="text-green-600 font-bold">➜</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={downloadPDF}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Download size={18} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copyright */}
      <div className="fixed bottom-2 right-4 z-50 text-[10px] font-mono text-gray-300 pointer-events-none mix-blend-difference select-none">
        © @rohit1915-08
      </div>
    </div>
  );
}
