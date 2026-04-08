import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import SocioModal from '../components/SocioModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Socios() {
  const [socios, setSocios] = useState([]);
  const [filteredSocios, setFilteredSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { fetchSocios(); }, []);
  useEffect(() => { filterSocios(); }, [socios, searchTerm, filterEstado]);

  const fetchSocios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/socios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSocios(response.data);
    } catch (error) {
      toast.error('Error al cargar los socios');
    } finally {
      setLoading(false);
    }
  };

  const filterSocios = () => {
    let filtered = socios;
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.socio_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterEstado !== 'todos') {
      filtered = filtered.filter((s) => s.estado === filterEstado);
    }
    setFilteredSocios(filtered);
  };

  const handleDelete = async (socioId) => {
    if (!window.confirm('¿Estás seguro de eliminar este socio? Esta acción no se puede deshacer.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/socios/${socioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Socio eliminado correctamente');
      fetchSocios();
    } catch (error) {
      toast.error('Error al eliminar el socio');
    }
  };

  const handleEdit = (socio) => {
    setEditingSocio(socio);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingSocio(null);
    fetchSocios();
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/exportar/socios`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.setAttribute('download', `gimnasio_socios_${fecha}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel descargado correctamente');
    } catch (error) {
      toast.error('Error al exportar el Excel');
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full" data-testid="socios-page">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Socios</h1>
          <p className="text-slate-600 mt-1">Gestiona los miembros de tu gimnasio</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-md shadow-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            {exportando ? 'Exportando...' : 'Exportar Excel'}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            data-testid="add-socio-button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md shadow-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nuevo Socio
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, ID o email..."
              data-testid="search-socios-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            data-testid="filter-estado-select"
            className="px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="vencido">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filteredSocios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="socios-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Nombre</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Contacto</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Estado</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Vencimiento</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSocios.map((socio, index) => (
                  <tr key={socio.socio_id} className="hover:bg-slate-50 transition-colors" data-testid={`socio-row-${index}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{socio.socio_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{socio.nombre}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {socio.email && <div>{socio.email}</div>}
                      {socio.telefono && <div className="text-slate-500">{socio.telefono}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${socio.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} data-testid={`socio-estado-${index}`}>
                        {socio.estado === 'activo' ? 'Activo' : 'Vencido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {socio.fecha_vencimiento ? format(new Date(socio.fecha_vencimiento), 'dd/MM/yyyy', { locale: es }) : 'Sin pagos'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(socio)} data-testid={`edit-socio-${index}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(socio.socio_id)} data-testid={`delete-socio-${index}`} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No se encontraron socios</p>
          </div>
        )}
      </div>

      {modalOpen && <SocioModal socio={editingSocio} onClose={handleModalClose} />}
    </div>
  );
}

export default Socios;
