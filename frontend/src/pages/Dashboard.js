import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, UserX, DollarSign, Calendar, Bell, BellOff, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAlertas, setLoadingAlertas] = useState(true);
  const [enviandoAlertas, setEnviandoAlertas] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAlertas();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/alertas/estado`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertas(response.data);
    } catch (error) {
      console.error('Error al cargar alertas');
    } finally {
      setLoadingAlertas(false);
    }
  };

  const handleEnviarAlertas = async () => {
    setEnviandoAlertas(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/alertas/enviar-ahora`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { enviadas, errores, sin_telefono } = response.data;
      if (enviadas > 0) {
        toast.success(`✅ ${enviadas} alertas enviadas por WhatsApp`);
      }
      if (sin_telefono > 0) {
        toast.warning(`⚠️ ${sin_telefono} socios sin número de teléfono`);
      }
      if (errores > 0) {
        toast.error(`❌ ${errores} errores al enviar`);
      }
      if (enviadas === 0 && errores === 0 && sin_telefono === 0) {
        toast.info('No hay socios para alertar en este momento');
      }
    } catch (error) {
      toast.error('Error al enviar las alertas');
    } finally {
      setEnviandoAlertas(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = [
    { title: 'Total Socios', value: stats?.total_socios || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', testid: 'metric-total-socios' },
    { title: 'Socios Activos', value: stats?.socios_activos || 0, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', testid: 'metric-socios-activos' },
    { title: 'Socios Vencidos', value: stats?.socios_vencidos || 0, icon: UserX, color: 'text-red-600', bg: 'bg-red-50', testid: 'metric-socios-vencidos' },
    { title: 'Ingresos del Mes', value: `$${stats?.ingresos_mes?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', testid: 'metric-ingresos-mes' },
  ];

  const totalAlertas = (alertas?.proximos_a_vencer?.length || 0) + (alertas?.vencidos?.length || 0);

  return (
    <div className="max-w-7xl mx-auto w-full" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-600 mt-1">Vista general de tu gimnasio</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} data-testid={metric.testid} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${metric.bg} ${metric.color} p-3 rounded-lg`}>
                  <Icon size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{metric.title}</p>
              <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Próximos Vencimientos */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              <h2 className="text-xl font-semibold text-slate-900">Próximos Vencimientos</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">Socios que vencen en los próximos 7 días</p>
          </div>
          <div className="p-6" data-testid="proximos-vencimientos">
            {stats?.proximos_vencimientos?.length > 0 ? (
              <div className="space-y-3">
                {stats.proximos_vencimientos.map((socio, index) => (
                  <div key={socio.socio_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors" data-testid={`vencimiento-${index}`}>
                    <div>
                      <p className="font-medium text-slate-900">{socio.nombre}</p>
                      <p className="text-sm text-slate-500">{socio.socio_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {format(new Date(socio.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                      </p>
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${socio.dias_restantes === 0 ? 'bg-red-100 text-red-800' : socio.dias_restantes <= 3 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {socio.dias_restantes === 0 ? 'Vence hoy' : `${socio.dias_restantes} días`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500">No hay vencimientos próximos</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Alertas WhatsApp */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-purple-600" size={20} />
                <h2 className="text-xl font-semibold text-slate-900">Alertas WhatsApp</h2>
              </div>
              {totalAlertas > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                  {totalAlertas}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Se envían automáticamente cada día a las 9:00 AM
            </p>
          </div>

          <div className="p-6">
            {/* Estado Twilio */}
            <div className={`flex items-center gap-2 text-sm mb-4 px-3 py-2 rounded-lg ${alertas?.twilio_configurado ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {alertas?.twilio_configurado
                ? <><CheckCircle size={16} /> Twilio configurado — envíos activos</>
                : <><AlertTriangle size={16} /> Twilio no configurado — los mensajes no se envían</>
              }
            </div>

            {loadingAlertas ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <>
                {/* Vencidos */}
                {alertas?.vencidos?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                      Cuota vencida ({alertas.vencidos.length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {alertas.vencidos.map((s) => (
                        <div key={s.socio_id} className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg text-sm">
                          <div>
                            <span className="font-medium text-slate-800">{s.nombre}</span>
                            <span className="text-slate-500 ml-2 text-xs">{s.socio_id}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            {s.telefono ? <Phone size={12} className="text-green-500" /> : <BellOff size={12} className="text-slate-400" />}
                            <span className="text-xs text-red-600 font-medium">{Math.abs(s.dias_restantes)}d vencido</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Próximos a vencer */}
                {alertas?.proximos_a_vencer?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">
                      Próximos a vencer ({alertas.proximos_a_vencer.length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {alertas.proximos_a_vencer.map((s) => (
                        <div key={s.socio_id} className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-lg text-sm">
                          <div>
                            <span className="font-medium text-slate-800">{s.nombre}</span>
                            <span className="text-slate-500 ml-2 text-xs">{s.socio_id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {s.telefono ? <Phone size={12} className="text-green-500" /> : <BellOff size={12} className="text-slate-400" />}
                            <span className="text-xs text-orange-600 font-medium">
                              {s.dias_restantes === 0 ? 'Hoy' : `${s.dias_restantes}d`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalAlertas === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle className="mx-auto text-green-400 mb-2" size={40} />
                    <p className="text-slate-500 text-sm">Todo al día, no hay alertas pendientes</p>
                  </div>
                )}

                {/* Botón enviar ahora */}
                <button
                  onClick={handleEnviarAlertas}
                  disabled={enviandoAlertas || totalAlertas === 0}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Bell size={16} />
                  {enviandoAlertas ? 'Enviando...' : `Enviar alertas ahora ${totalAlertas > 0 ? `(${totalAlertas})` : ''}`}
                </button>

                {!alertas?.twilio_configurado && (
                  <p className="text-xs text-center text-slate-400 mt-2">
                    Configurá TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en el .env del backend para activar los envíos
                  </p>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
