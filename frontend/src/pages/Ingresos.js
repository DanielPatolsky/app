import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Ingresos() {
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentYear = new Date().getFullYear();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: selectedMonth, year: selectedYear }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ingresosMesMetric = {
    title: `Ingresos ${monthNames[selectedMonth - 1]} ${selectedYear}`,
    value: `$${stats?.ingresos_mes?.toFixed(2) || '0.00'}`,
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    testid: 'metric-ingresos-mes'
  };

  return (
    <div className="max-w-7xl mx-auto w-full" data-testid="ingresos-page">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Ingresos</h1>
        <p className="text-slate-600 mt-1">Vista de ingresos del gimnasio</p>
      </div>

      {/* Ingresos del Mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div data-testid={ingresosMesMetric.testid} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`${ingresosMesMetric.bg} ${ingresosMesMetric.color} p-3 rounded-lg`}>
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">{ingresosMesMetric.title}</p>
          <p className="text-2xl font-bold text-slate-900">{ingresosMesMetric.value}</p>
        </div>
      </div>

      {/* Ingresos por día */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Ingresos por día</h2>
            <p className="text-sm text-slate-500">Total ingresado por día del mes seleccionado</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.ingresos_por_dia || []} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="dia"
                tick={{ fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                interval={0}
                label={{ value: 'Día del mes', position: 'insideBottom', dy: 18, fill: '#475569' }}
              />
              <Tooltip formatter={(value, name) => [typeof value === 'number' ? `$${value.toFixed(2)}` : value, name]} labelFormatter={(label) => `Día ${label}`} />
              <Bar dataKey="ingresos" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Día</th>
                <th className="px-4 py-3">Ingresos</th>
                <th className="px-4 py-3">Pagos</th>
              </tr>
            </thead>
            <tbody>
              {stats?.ingresos_por_dia?.map((item) => (
                <tr key={item.dia} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.dia}</td>
                  <td className="px-4 py-3">${item.ingresos.toFixed(2)}</td>
                  <td className="px-4 py-3">{item.pagos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Ingresos;