import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, UserPlus, Users, Trash2 } from 'lucide-react';
import api from '../api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    login: '',
    password: '',
    role: 'user'
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Устанавливаем токен перед запросом
    const token = localStorage.getItem('token');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/admin/users', formData);
      setMessage({ type: 'success', text: 'Пользователь успешно создан!' });
      setFormData({ firstName: '', lastName: '', login: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка при создании' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Панель Администратора</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {user.firstName} {user.lastName} <span className="text-slate-400">(@{user.login})</span>
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8 grid lg:grid-cols-3 gap-8">
        {/* Форма создания */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserPlus className="text-indigo-500" size={20} />
              Новый пользователь
            </h2>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm mb-6 border font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Имя</label>
                <input required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="Иван" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Фамилия</label>
                <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="Иванов" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Логин</label>
                <input required name="login" value={formData.login} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="ivanov_i" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Пароль</label>
                <input required type="text" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="Временный пароль" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Роль доступа</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none font-medium text-slate-700">
                  <option value="user">Пользователь (Ученый)</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-sm mt-6 flex justify-center items-center gap-2 active:scale-[0.98]">
                {loading ? 'Создание...' : <><UserPlus size={20}/> Создать профиль</>}
              </button>
            </form>
          </div>
        </div>

        {/* Список пользователей */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Users className="text-indigo-500" size={20} />
              Зарегистрированные пользователи <span className="bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded-full text-sm ml-2">{usersList.length}</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="font-semibold py-4 px-6">Сотрудник</th>
                    <th className="font-semibold py-4 px-6">Логин</th>
                    <th className="font-semibold py-4 px-6">Уровень доступа</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors last:border-0">
                      <td className="py-4 px-6 text-slate-700 font-semibold">{u.firstName} {u.lastName}</td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-sm bg-slate-50/50 rounded-lg inline-block my-2 ml-4">{u.login}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role === 'admin' ? 'АДМИН' : 'ПОЛЬЗОВАТЕЛЬ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                     <tr>
                       <td colSpan="3" className="py-12 text-center text-slate-400 font-medium">Загрузка данных...</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
