import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import PagoModal from '../components/PagoModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [filteredPagos, setFilteredPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPagos();
  }, [pagos, searchTerm]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [pagosRes, sociosRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/pagos`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/socios`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPagos(pagosRes.data);
      setSocios(sociosRes.data);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filterPagos = () => {
    let filtered = pagos;

    if (searchTerm) {
      filtered = filtered.filter((p) => {
        const socio = socios.find((s) => s.socio_id === p.socio_id);
        return (
          p.socio_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (socio && socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
    }

    setFilteredPagos(filtered);
  };

  const getSocioNombre = (socioId) => {
    const socio = socios.find((s) => s.socio_id === socioId);
    return socio ? socio.nombre : 'Desconocido';
  };

  const handleModalClose = () => {
    setModalOpen(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full" data-testid="pagos-page">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Pagos</h1>
          <p className="text-slate-600 mt-1">Registra y gestiona los pagos de tus socios</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          data-testid="register-pago-button"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md shadow-sm font-medium flex items-center gap-2 transition-colors"
        >
          <DollarSign size={20} />
          Registrar Pago
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o ID de socio..."
            data-testid="search-pagos-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filteredPagos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="pagos-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Fecha</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Socio</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Monto</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vencimiento</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPagos.map((pago, index) => (
                  <tr key={pago.id} className="hover:bg-slate-50 transition-colors" data-testid={`pago-row-${index}`}>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {format(new Date(pago.fecha_pago), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      <div className="font-medium">{getSocioNombre(pago.socio_id)}</div>
                      <div className="text-slate-500 text-xs">{pago.socio_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium capitalize">
                        {pago.tipo_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      ${pago.monto.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(pago.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {pago.metodo_pago}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No se encontraron pagos</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <PagoModal
          socios={socios}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default Pagos;