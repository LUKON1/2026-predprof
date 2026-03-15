import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Upload, Activity, Cpu, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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

    const token = localStorage.getItem('token');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const formData = new FormData();
    formData.append("audio", file); // В будущем поменяем на archive когда питон будет готов принимать npz

    try {
      const response = await api.post("/ml/predict-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Ошибка. Проверьте запущен ли Python ML Service.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    {
      class_name: `Класс 1`,
      probability: result ? (result.prediction === 1 ? result.confidence : 0.05) * 100 : 0,
    },
    {
      class_name: `Класс 2`,
      probability: result ? (result.prediction === 2 ? result.confidence : 0.05) * 100 : 0,
    },
    {
      class_name: `Класс 3`,
      probability: result ? (result.prediction === 3 ? result.confidence : 0.1) * 100 : 0,
    },
    {
      class_name: `Класс 4`,
      probability: result ? (result.prediction === 4 ? result.confidence : 0.15) * 100 : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Шапка Ученого */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Alien Signal Analyzer</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Сотрудник научно-исследовательского центра
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <div className="w-8 h-8 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 leading-tight">{user?.firstName} {user?.lastName}</p>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">УЧЕНЫЙ</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-semibold p-2 rounded-xl hover:bg-red-50 transition-colors"
            title="Выйти"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Левая колонка - Загрузка */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Загрузка данных (.npz)</h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 scale-[1.02]"
                  : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
              }`}>
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                <Upload size={32} />
              </div>
              {isDragActive ? (
                <p className="text-blue-600 font-bold text-lg">Бросайте архив сюда...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-700 font-bold text-lg">Выбрать или перетащить файл</p>
                  <p className="text-slate-400 text-sm font-medium">Формат валидационного сета .NPZ</p>
                </div>
              )}
            </div>

            {file && (
              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-blue-900 font-semibold truncate flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {file.name}
                </span>
                <span className="text-blue-600/70 font-mono text-sm font-bold bg-blue-100/50 px-2 py-1 rounded-md">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}

            <button
              onClick={handlePredict}
              disabled={!file || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex justify-center items-center gap-3 shadow-md hover:shadow-lg disabled:shadow-none mt-4 active:scale-[0.98]">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 
                  Анализ архива...
                </>
              ) : (
                "Классифицировать сигналы"
              )}
            </button>
          </div>

          {/* Правая колонка - Результаты */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Предварительные результаты</h2>

            {result ? (
              <div className="space-y-6 flex-1 flex flex-col animate-in fade-in duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
                    <p className="text-blue-600/80 text-xs font-bold uppercase tracking-widest mb-2">
                      Распознанный класс
                    </p>
                    <p className="text-5xl font-black text-blue-900">{result.prediction}</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center flex flex-col justify-center">
                     <p className="text-indigo-600/80 text-xs font-bold uppercase tracking-widest mb-2">
                      Уверенность AI
                    </p>
                    <p className="text-3xl font-bold text-indigo-900">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="flex-1 mt-4 min-h-[200px]">
                  <p className="text-sm text-slate-500 mb-4 font-bold tracking-wide">
                    ВЕРОЯТНОСТИ КЛАССОВ:
                  </p>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="class_name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} unit="%" tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          fontWeight: "bold",
                          color: "#1e293b"
                        }}
                      />
                      <Bar dataKey="probability" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex border-2 border-dashed border-slate-100 rounded-2xl flex-col items-center justify-center text-slate-400 space-y-4">
                <Activity className="h-16 w-16 opacity-20 text-slate-600" />
                <p className="font-medium text-slate-500">Ожидание файла валидации</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
