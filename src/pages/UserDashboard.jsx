import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from "recharts";
import { Upload, Activity, Cpu, LogOut, ChartBar, PieChart as PieIcon, LineChart as LineIcon, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null);

  // Fetch training metadata for charts
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const response = await api.get("/ml/meta");
        setMeta(response.data);
      } catch (err) {
        console.error("Failed to fetch ML meta:", err);
      }
    };
    fetchMeta();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/zip": [".npz", ".zip"], "audio/*": [".wav", ".mp3", ".ogg"] },
    multiple: false,
  });

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await api.post("/ml/predict-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Ошибка анализа. Проверьте ML-сервис.");
    } finally {
      setLoading(false);
    }
  };

  // Chart 1 Data: Training History
  const historyData = meta?.history?.epochs.map((epoch, i) => ({
    epoch,
    accuracy: (meta.history.accuracy[i] * 100).toFixed(1),
    val_accuracy: (meta.history.val_accuracy[i] * 100).toFixed(1)
  })) || [];

  // Chart 2 Data: Class Distribution
  const distributionData = meta?.train_counts ? Object.entries(meta.train_counts).map(([name, count]) => ({
    name,
    value: count
  })).sort((a, b) => b.value - a.value).slice(0, 8) : [];

  // Chart 4 Data: Top 5 Classes for Current File
  const top5Data = result?.top_5_classes.map(item => ({
    name: item.class_name,
    prob: (item.probability * 100).toFixed(1)
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-blue-200 shadow-lg">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight italic">XENO_ANALYZER v2.0</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] -mt-0.5">Deep Space SIGINT Research</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 leading-tight">{user?.firstName} {user?.lastName}</p>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">Scientific Officer</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Column 1: Upload & Status */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Input Signal</h2>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-200 hover:border-blue-300"}`}>
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-600 mb-1">Drop audio node here</p>
                <p className="text-[10px] text-slate-400 uppercase font-black">WAV / MP3 / NPZ SUPPORTED</p>
              </div>
              
              {file && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{file.name}</span>
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
              )}

              <button
                onClick={handlePredict}
                disabled={!file || loading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 transform transition-all text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-blue-200"
              >
                {loading ? "Decrypting..." : "Process Signal"}
              </button>
            </section>

            {/* Prediction Result Block */}
            {result && (
              <section className="bg-blue-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-blue-900/40 animate-in zoom-in duration-300">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-4">Identification Matrix</p>
                <div className="space-y-2">
                  <h3 className="text-4xl font-black tracking-tighter leading-none break-words">{result.predicted_class}</h3>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-white h-full transition-all duration-1000" style={{ width: `${result.confidence * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-black">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-[10px] opacity-40 font-bold italic pt-2">Matched with index Alpha-{result.class_index}</p>
                </div>
              </section>
            )}
          </div>

          {/* Column 2 & 3: Analytics Dashboard */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            
            {/* Chart 1: Epochs (History) */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <LineIcon size={16} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Model Evolution (Epochs)</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="epoch" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="accuracy" name="Train Accuracy" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="val_accuracy" name="Validation Accuracy" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Train Distribution */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <PieIcon size={16} className="text-pink-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Class Distribution</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {distributionData.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-[10px] font-bold text-slate-500">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 4: Top 5 Probabilities */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <ChartBar size={16} className="text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Top Probability Vectors</h3>
              </div>
              <div className="h-48">
                {result ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top5Data} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="prob" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 grayscale">
                    <Activity size={32} />
                    <p className="text-[8px] font-black uppercase tracking-widest mt-2">No active signal</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
