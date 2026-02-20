import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function PagoModal({ socios, onClose }) {
  const [formData, setFormData] = useState({
    socio_id: '',
    monto: '',
    tipo_plan: 'mensual',
    metodo_pago: 'Efectivo'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/pagos`,
        {
          ...formData,
          monto: parseFloat(formData.monto)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Pago registrado correctamente');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" data-testid="pago-modal">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Registrar Pago</h2>
          <button
            onClick={onClose}
            data-testid="close-pago-modal-button"
            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Socio *
            </label>
            <select
              value={formData.socio_id}
              onChange={(e) => setFormData({...formData, socio_id: e.target.value})}
              data-testid="pago-socio-select"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              required
            >
              <option value="">Seleccionar socio</option>
              {socios.map((socio) => (
                <option key={socio.socio_id} value={socio.socio_id}>
                  {socio.socio_id} - {socio.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Plan *
            </label>
            <select
              value={formData.tipo_plan}
              onChange={(e) => setFormData({...formData, tipo_plan: e.target.value})}
              data-testid="pago-tipo-plan-select"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              required
            >
              <option value="mensual">Mensual (30 días)</option>
              <option value="trimestral">Trimestral (90 días)</option>
              <option value="semestral">Semestral (180 días)</option>
              <option value="anual">Anual (365 días)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monto *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              data-testid="pago-monto-input"
              value={formData.monto}
              onChange={(e) => setFormData({...formData, monto: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Método de Pago
            </label>
            <select
              value={formData.metodo_pago}
              onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
              data-testid="pago-metodo-select"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-pago-button"
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="submit-pago-button"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PagoModal;