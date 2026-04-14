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
  const [costosMes, setCostosMes] = useState(0);
  const [costosInput, setCostosInput] = useState('');
  const [editingCostosInput, setEditingCostosInput] = useState('');
  const [isEditingCostos, setIsEditingCostos] = useState(false);
  const [savingCostos, setSavingCostos] = useState(false);
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [statsResponse, costosResponse] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: selectedMonth, year: selectedYear }
        }),
        axios.get(`${BACKEND_URL}/api/dashboard/costos`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: selectedMonth, year: selectedYear }
        })
      ]);
      setStats(statsResponse.data);
      setCostosMes(costosResponse.data.costos_mes ?? 0);
      setCostosInput('');
      setEditingCostosInput(costosResponse.data.costos_mes?.toString() || '');
    } catch (error) {
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCostos = async (sumar = true) => {
    setSavingCostos(true);
    try {
      const token = localStorage.getItem('token');
      const parsedValue = parseInt(costosInput, 10);
      if (Number.isNaN(parsedValue) || parsedValue < 0) {
        throw new Error('Ingrese un valor válido para los costos');
      }
      await axios.post(`${BACKEND_URL}/api/dashboard/costos`, {
        mes: selectedMonth,
        anio: selectedYear,
        costos_mes: parsedValue,
        sumar
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Costos guardados');
      await fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Error al guardar los costos');
    } finally {
      setSavingCostos(false);
    }
  };

  const handleEditTotalCostos = async () => {
    setSavingCostos(true);
    try {
      const token = localStorage.getItem('token');
      const parsedValue = parseInt(editingCostosInput, 10);
      if (Number.isNaN(parsedValue) || parsedValue < 0) {
        throw new Error('Ingrese un valor válido para el monto total');
      }
      await axios.post(`${BACKEND_URL}/api/dashboard/costos`, {
        mes: selectedMonth,
        anio: selectedYear,
        costos_mes: parsedValue,
        sumar: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Total de costos actualizado');
      setIsEditingCostos(false);
      await fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Error al actualizar el total');
    } finally {
      setSavingCostos(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ingresosMes = stats?.ingresos_mes ?? 0;
  const gananciaNeta = ingresosMes - costosMes;
  const ingresosMesMetric = {
    title: `Ingresos ${monthNames[selectedMonth - 1]} ${selectedYear}`,
    value: `$${ingresosMes.toFixed(2)}`,
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    testid: 'metric-ingresos-mes'
  };
  const gananciaNetaMetric = {
    title: `Ganancia neta ${monthNames[selectedMonth - 1]} ${selectedYear}`,
    value: `${gananciaNeta < 0 ? '-$' : '$'}${Math.abs(gananciaNeta).toFixed(2)}`,
    icon: DollarSign,
    color: gananciaNeta < 0 ? 'text-rose-600' : 'text-emerald-600',
    bg: gananciaNeta < 0 ? 'bg-rose-50' : 'bg-emerald-50',
    testid: 'metric-ganancia-neta'
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

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Costos {monthNames[selectedMonth - 1]} {selectedYear}</p>
          <p className="text-2xl font-bold text-slate-900">${costosMes}</p>
          <div className="mt-5">
            <label className="text-sm text-slate-500">Agregar costos</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                type="number"
                min="0"
                step="1"
                value={costosInput}
                onChange={(e) => setCostosInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full sm:w-32 px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-2 focus:ring-rose-100 focus:border-rose-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => handleSaveCostos(true)}
                disabled={savingCostos}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {savingCostos ? 'Guardando...' : 'Sumar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingCostos(true);
                  setEditingCostosInput(costosMes.toString());
                }}
                disabled={savingCostos}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Editar total
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Presiona <strong>Sumar</strong> para acumular al total o <strong>Editar total</strong> para reemplazarlo.</p>
          </div>
          {isEditingCostos && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Editar total de costos</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editingCostosInput}
                  onChange={(e) => setEditingCostosInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full sm:w-32 px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleEditTotalCostos}
                  disabled={savingCostos}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {savingCostos ? 'Guardando...' : 'Guardar total'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingCostos(false)}
                  disabled={savingCostos}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-slate-400 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`${gananciaNetaMetric.bg} ${gananciaNetaMetric.color} p-3 rounded-lg`}>
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">{gananciaNetaMetric.title}</p>
          <p className="text-2xl font-bold text-slate-900">{gananciaNetaMetric.value}</p>
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