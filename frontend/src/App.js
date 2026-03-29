import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function App() {
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState(() => JSON.parse(localStorage.getItem("watchlist") || "[]"));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("history") || "[]"));
  const [darkMode, setDarkMode] = useState(false);
  const [historical, setHistorical] = useState([]);

  const theme = {
    bg: darkMode ? "#0f172a" : "#ffffff",
    card: darkMode ? "#1e293b" : "#f1f5f9",
    text: darkMode ? "#f1f5f9" : "#1e293b",
    subtext: darkMode ? "#94a3b8" : "#64748b",
    border: darkMode ? "#334155" : "#e2e8f0",
    input: darkMode ? "#1e293b" : "#ffffff",
  };

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const fetchStock = async (sym) => {
    const ticker = (sym || symbol).toUpperCase();
    if (!ticker) return;
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`http://localhost:8080/api/stock/${ticker}`);
      setStockData(res.data);
      setSymbol(ticker);

      // fetch historical data (30 days)
      const histRes = await axios.get(
        `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&outputsize=30&apikey=${process.env.REACT_APP_API_KEY || ""}`
      );
      if (histRes.data.values) {
        const chartPoints = histRes.data.values.reverse().map(d => ({
          date: d.datetime.slice(5),
          price: parseFloat(d.close),
        }));
        setHistorical(chartPoints);
      }

      setHistory(prev => {
        const filtered = prev.filter(h => h !== ticker);
        return [ticker, ...filtered].slice(0, 6);
      });
    } catch (err) {
      setError("Stock not found. Try AAPL, TSLA, GOOGL...");
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = () => {
    if (!stockData) return;
    const sym = stockData.symbol;
    setWatchlist(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const change = stockData ? parseFloat(stockData.change) : 0;
  const isInWatchlist = stockData && watchlist.includes(stockData.symbol);

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, transition: "all 0.3s", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 750, margin: "0 auto", padding: "30px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, color: theme.text }}>📈 Stock Price Tracker</h1>
          <button onClick={() => setDarkMode(!darkMode)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, cursor: "pointer", fontSize: 16 }}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && fetchStock()}
            placeholder="Enter ticker (e.g. AAPL)"
            style={{ flex: 1, padding: 10, fontSize: 16, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text }}
          />
          <button onClick={() => fetchStock()}
            style={{ padding: "10px 20px", fontSize: 16, background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: theme.subtext, fontSize: 13 }}>🔍 Recent: </span>
            {history.map(h => (
              <button key={h} onClick={() => fetchStock(h)}
                style={{ marginRight: 6, padding: "4px 10px", borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, cursor: "pointer", fontSize: 13 }}>
                {h}
              </button>
            ))}
          </div>
        )}

        {/* Watchlist */}
        {watchlist.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ color: theme.subtext, fontSize: 13 }}>⭐ Watchlist: </span>
            {watchlist.map(w => (
              <button key={w} onClick={() => fetchStock(w)}
                style={{ marginRight: 6, padding: "4px 10px", borderRadius: 20, border: "1px solid #4f46e5", background: darkMode ? "#1e1b4b" : "#ede9fe", color: "#4f46e5", cursor: "pointer", fontSize: 13 }}>
                {w}
              </button>
            ))}
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Stock Data */}
        {stockData && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, color: theme.text }}>{stockData.name} ({stockData.symbol})</h2>
                <p style={{ color: theme.subtext, margin: "4px 0" }}>Exchange: {stockData.exchange} | Currency: {stockData.currency}</p>
              </div>
              <button onClick={toggleWatchlist}
                style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.border}`, background: isInWatchlist ? "#4f46e5" : theme.card, color: isInWatchlist ? "white" : theme.text, cursor: "pointer", fontSize: 14 }}>
                {isInWatchlist ? "⭐ Saved" : "☆ Watchlist"}
              </button>
            </div>

            {/* Price Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "16px 0" }}>
              {[["Open", stockData.open], ["High", stockData.high], ["Low", stockData.low], ["Close", stockData.close]].map(([label, val]) => (
                <div key={label} style={{ background: theme.card, padding: 15, borderRadius: 10 }}>
                  <div style={{ color: theme.subtext, fontSize: 13 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: theme.text }}>${parseFloat(val).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Change */}
            <p style={{ fontSize: 18 }}>
              Change: <strong style={{ color: change >= 0 ? "#16a34a" : "#dc2626" }}>
                {stockData.change} ({stockData.percent_change}%)
              </strong>
            </p>
            <p style={{ color: theme.subtext, fontSize: 13 }}>
              Volume: {parseInt(stockData.volume).toLocaleString()} | Market Open: {stockData.is_market_open ? "✅ Yes" : "❌ No"}
            </p>

            {/* Historical Chart */}
            {historical.length > 0 && (
              <div>
                <h3 style={{ color: theme.text }}>📊 30-Day Price History</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historical}>
                    <XAxis dataKey="date" tick={{ fill: theme.subtext, fontSize: 11 }} interval={4} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: theme.subtext, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: theme.card, border: "none", color: theme.text }} />
                    <Line type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;