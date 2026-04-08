import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Clock, UserX, MessageCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function AlertasPanel() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAlertas();
  }, []);

  const fetchAlertas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/alertas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertas(response.data);
    } catch (error) {
      console.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarAlertas = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/alertas/generar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAlertas();
      toast.success('Alertas generadas exitosamente');
    } catch (error) {
      toast.error('Error al generar alertas');
    } finally {
      setGenerating(false);
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas ({alertas.length})
          </CardTitle>
          <Button
            onClick={handleGenerarAlertas}
            disabled={generating}
            size="sm"
          >
            {generating ? 'Generando...' : 'Generar Alertas'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No hay alertas activas</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="border rounded-lg p-3 bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(alerta.tipo)}
                    <span className="font-medium">{alerta.nombre}</span>
                    <Badge variant={getBadgeVariant(alerta.tipo)}>
                      {getTipoLabel(alerta.tipo)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={alerta.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {alerta.mensaje}
                </p>
                {alerta.dias_restantes !== null && (
                  <p className="text-xs text-slate-500 mt-1">
                    {alerta.dias_restantes < 0
                      ? `Vencido hace ${Math.abs(alerta.dias_restantes)} días`
                      : alerta.dias_restantes === 0
                      ? 'Vence hoy'
                      : `Vence en ${alerta.dias_restantes} días`
                    }
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertasPanel;