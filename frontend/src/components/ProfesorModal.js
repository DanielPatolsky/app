import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function ProfesorModal({ profesor, onClose }) {
  const [formData, setFormData] = useState({
    profesor_id: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    dni: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profesor) {
      setFormData({
        profesor_id: profesor.profesor_id || '',
        nombre: profesor.nombre || '',
        apellido: profesor.apellido || '',
        email: profesor.email || '',
        telefono: profesor.telefono || '',
        direccion: profesor.direccion || '',
        dni: profesor.dni || ''
      });
    }
  }, [profesor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (profesor) {
        await axios.put(`${BACKEND_URL}/api/profesores/${profesor.profesor_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Profesor actualizado correctamente');
      } else {
        await axios.post(`${BACKEND_URL}/api/profesores`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Profesor creado correctamente');
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar el profesor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" data-testid="profesor-modal">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {profesor ? 'Editar Profesor' : 'Nuevo Profesor'}
          </h2>
          <button
            onClick={onClose}
            data-testid="close-modal-button"
            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {profesor && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número de profesor
              </label>
              <input
                type="text"
                data-testid="profesor-id-input"
                value={formData.profesor_id}
                onChange={(e) => setFormData({ ...formData, profesor_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              data-testid="profesor-nombre-input"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Apellido *
            </label>
            <input
              type="text"
              data-testid="profesor-apellido-input"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              data-testid="profesor-email-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              data-testid="profesor-telefono-input"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              data-testid="profesor-direccion-input"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              DNI *
            </label>
            <input
              type="text"
              data-testid="profesor-dni-input"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-button"
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="submit-profesor-button"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfesorModal;
