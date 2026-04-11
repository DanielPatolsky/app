import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { AlertTriangle, Clock, UserX, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function HistorialAlertas() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configMensajes, setConfigMensajes] = useState([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchHistorial();
    fetchConfigMensajes();
  }, []);

  const fetchHistorial = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/alertas/enviadas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorial(response.data);
    } catch (error) {
      console.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigMensajes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/config/mensajes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigMensajes(response.data);
    } catch (error) {
      console.error('Error al cargar config mensajes');
    }
  };

  const handleReenviar = async (enviadaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/alertas/enviadas/${enviadaId}/reenviar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.open(response.data.whatsapp_link, '_blank', 'noopener,noreferrer');
      toast.success('Mensaje reenviado');
      await fetchHistorial(); // Recargar historial
    } catch (error) {
      toast.error('Error al reenviar');
    }
  };

  const handleSaveConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${BACKEND_URL}/api/config/mensajes`, configMensajes, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Mensajes actualizados');
      setEditing(false);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const updateMensaje = (tipo, mensaje) => {
    setConfigMensajes(prev => prev.map(c => c.tipo === tipo ? { ...c, mensaje } : c));
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'vencido': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'proximo': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'inactivo': return <UserX className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (tipo) => {
    switch (tipo) {
      case 'vencido': return 'destructive';
      case 'proximo': return 'secondary';
      case 'inactivo': return 'outline';
      default: return 'default';
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'vencido': return 'Vencido';
      case 'proximo': return 'Próximo vencimiento';
      case 'inactivo': return 'Inactivo';
      default: return tipo;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Historial de Alertas Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Alertas Enviadas ({historial.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay alertas enviadas aún</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historial.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(item.tipo)}
                      <span className="font-medium">{item.nombre} {item.apellido} (ID: {item.socio_id})</span>
                      <Badge variant={getBadgeVariant(item.tipo)}>
                        {getTipoLabel(item.tipo)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {new Date(item.fecha_envio).toLocaleString('es-ES')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReenviar(item.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reenviar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configurar Mensajes</CardTitle>
            <Button
              onClick={editing ? handleSaveConfig : () => setEditing(true)}
              size="sm"
            >
              {editing ? <><Save className="h-3 w-3 mr-1" /> Guardar</> : 'Editar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {configMensajes.map((config) => (
            <div key={config.tipo} className="space-y-2">
              <label className="font-medium capitalize">{config.tipo}</label>
              <Textarea
                value={config.mensaje}
                onChange={(e) => updateMensaje(config.tipo, e.target.value)}
                disabled={!editing}
                placeholder="Mensaje personalizado..."
                rows={3}
              />
              <p className="text-xs text-slate-500">
                Placeholders: {'{nombre}'} para nombre, {'{fecha}'} para fecha, {'{dias}'} para días
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default HistorialAlertas;