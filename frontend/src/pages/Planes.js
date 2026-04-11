import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Planes() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    dias: '',
    precio: ''
  });

  useEffect(() => {
    fetchPlanes();
  }, []);

  const fetchPlanes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/planes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlanes(response.data);
    } catch (error) {
      console.error('Error al cargar planes');
      toast.error('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.dias || !formData.precio) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${BACKEND_URL}/api/planes/${editingId}`, {
          nombre: formData.nombre,
          dias: parseInt(formData.dias),
          precio: parseFloat(formData.precio)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Plan actualizado');
        setPlanes((prev) => prev.map((plan) =>
          plan.id === editingId
            ? { ...plan, nombre: formData.nombre, dias: parseInt(formData.dias), precio: parseFloat(formData.precio) }
            : plan
        ));
      } else {
        const response = await axios.post(`${BACKEND_URL}/api/planes`, {
          nombre: formData.nombre,
          dias: parseInt(formData.dias),
          precio: parseFloat(formData.precio)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Plan creado');
        setPlanes((prev) => [...prev, response.data]);
      }

      setFormData({ nombre: '', dias: '', precio: '' });
      setEditingId(null);
      setShowForm(false);
      fetchPlanes().catch((err) => {
        console.error('Error al actualizar la lista de planes', err);
      });
    } catch (error) {
      console.error('Error guardar plan', error);
      toast.error(error.response?.data?.detail || 'Error al guardar plan');
    }
  };

  const handleEdit = (plan) => {
    setFormData({
      nombre: plan.nombre,
      dias: plan.dias,
      precio: plan.precio
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este plan?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/planes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Plan eliminado');
      fetchPlanes();
    } catch (error) {
      toast.error('Error al eliminar plan');
    }
  };

  const handleCancel = () => {
    setFormData({ nombre: '', dias: '', precio: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuración de Planes</CardTitle>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="bg-slate-50 p-4 rounded-lg mb-6 border">
              <h3 className="font-medium mb-4">{editingId ? 'Editar Plan' : 'Nuevo Plan'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nombre del Plan</label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Mensual"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duración (días)</label>
                    <Input
                      type="number"
                      value={formData.dias}
                      onChange={(e) => setFormData({ ...formData, dias: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Precio ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Guardar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {planes.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay planes configurados</p>
            ) : (
              planes.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 bg-slate-50 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{plan.nombre}</h3>
                    <p className="text-sm text-slate-600">
                      {plan.dias} días • ${plan.precio.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Planes;
