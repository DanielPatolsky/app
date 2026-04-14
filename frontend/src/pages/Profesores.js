import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import ProfesorModal from '../components/ProfesorModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Profesores() {
  const [profesores, setProfesores] = useState([]);
  const [filteredProfesores, setFilteredProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfesor, setEditingProfesor] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [sociosOptions, setSociosOptions] = useState([]);
  const [assignSocioId, setAssignSocioId] = useState('');
  const [socioQuery, setSocioQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [expandedProfesorId, setExpandedProfesorId] = useState(null);
  const [sociosSearch, setSociosSearch] = useState({});

  useEffect(() => { fetchProfesores(); fetchSociosOptions(); }, []);
  useEffect(() => { filterProfesores(); }, [profesores, searchTerm]);

  const fetchProfesores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/profesores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfesores(response.data);
    } catch (error) {
      toast.error('Error al cargar los profesores');
    } finally {
      setLoading(false);
    }
  };

  const fetchSociosOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/socios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSociosOptions(response.data);
    } catch (error) {
      toast.error('Error al cargar los socios');
    }
  };

  const openAssignModal = (profesor) => {
    setSelectedProfesor(profesor);
    setAssignSocioId('');
    setSocioQuery('');
    setShowSuggestions(false);
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedProfesor(null);
    setAssignSocioId('');
    setSocioQuery('');
    setShowSuggestions(false);
  };

  const eligibleSociosOptions = sociosOptions.filter((socio) => {
    if (socio.estado !== 'vencido') return true;

    if (!socio.fecha_vencimiento) return false;
    const fechaVenc = new Date(socio.fecha_vencimiento);
    if (Number.isNaN(fechaVenc.getTime())) return false;

    const diasVencido = (Date.now() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24);
    return diasVencido <= 5;
  });

  const filteredSocios = eligibleSociosOptions.filter((socio) =>
    `${socio.socio_id} - ${socio.nombre} ${socio.apellido}`.toLowerCase().includes(socioQuery.toLowerCase())
  );

  const selectSocio = (socio) => {
    setAssignSocioId(socio.socio_id);
    setSocioQuery(`${socio.socio_id} - ${socio.nombre} ${socio.apellido}`);
    setShowSuggestions(false);
  };

  const toggleExpandProfesor = (profesorId) => {
    setExpandedProfesorId((current) => (current === profesorId ? null : profesorId));
  };

  const handleSociosSearch = (profesorId, value) => {
    setSociosSearch((prev) => ({ ...prev, [profesorId]: value }));
  };

  const getFilteredProfesorSocios = (profesor) => {
    const searchTerm = (sociosSearch[profesor.profesor_id] || '').toLowerCase();
    const socios = Array.isArray(profesor.socios) ? profesor.socios : [];
    const sortedSocios = [...socios].sort((a, b) => a.socio_id.localeCompare(b.socio_id));
    if (!searchTerm) return sortedSocios;
    return sortedSocios.filter((socio) =>
      `${socio.socio_id} ${socio.nombre || ''} ${socio.apellido || ''}`.toLowerCase().includes(searchTerm)
    );
  };

  const handleAssignSocio = async () => {
    let socioId = assignSocioId;
    if (!socioId && socioQuery) {
      const match = sociosOptions.find((socio) =>
        socio.socio_id.toLowerCase() === socioQuery.trim().toLowerCase() ||
        `${socio.socio_id} - ${socio.nombre} ${socio.apellido}`.toLowerCase() === socioQuery.trim().toLowerCase()
      );
      if (match) {
        socioId = match.socio_id;
      }
    }

    if (!socioId) {
      toast.error('Selecciona un socio válido para asignar');
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/profesores/${selectedProfesor.profesor_id}/asociar-socio`, {
        socio_id: socioId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Socio asignado correctamente');
      closeAssignModal();
      fetchProfesores();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al asignar socio');
    } finally {
      setAssigning(false);
    }
  };

  const filterProfesores = () => {
    let filtered = profesores;
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.dni || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.profesor_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProfesores(filtered);
  };

  const handleDelete = async (profesorId) => {
    if (!window.confirm('¿Estás seguro de eliminar este profesor?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/profesores/${profesorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profesor eliminado correctamente');
      fetchProfesores();
    } catch (error) {
      toast.error('Error al eliminar el profesor');
    }
  };

  const handleEdit = (profesor) => {
    setEditingProfesor(profesor);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProfesor(null);
    fetchProfesores();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full" data-testid="profesores-page">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Profesores</h1>
          <p className="text-slate-600 mt-1">Registra y administra los profesores del gimnasio</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md shadow-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Profesor
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI, ID o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filteredProfesores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="profesores-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Nombre Completo</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Contacto</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Socios</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProfesores.map((profesor, index) => (
                  <React.Fragment key={profesor.profesor_id}>
                    <tr className="hover:bg-slate-50 transition-colors" data-testid={`profesor-row-${index}`}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{profesor.profesor_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{(profesor.nombre || '') + ' ' + (profesor.apellido || '')}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {profesor.email && <div>{profesor.email}</div>}
                        {profesor.telefono && <div className="text-slate-500">{profesor.telefono}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="text-slate-900 font-semibold">{(profesor.socios || []).length} socio(s)</div>
                        {(profesor.socios || []).length > 0 && (
                          <div className="text-slate-500 text-xs mt-1">
                            Haz clic en "Ver socios" para desplegar la lista.
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex flex-wrap justify-end items-center gap-2">
                          <button
                            onClick={() => toggleExpandProfesor(profesor.profesor_id)}
                            className="px-3 py-1 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                            title="Ver socios"
                          >
                            {expandedProfesorId === profesor.profesor_id ? 'Ocultar socios' : 'Ver socios'}
                          </button>
                          <button onClick={() => openAssignModal(profesor)} className="px-3 py-1 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors" title="Asignar socio">
                            Asignar
                          </button>
                          <button onClick={() => handleEdit(profesor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(profesor.profesor_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProfesorId === profesor.profesor_id && (
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Socios asignados</p>
                                <p className="text-sm text-slate-500">Ordenados por ID. Usa la rueda del mouse para desplazarte.</p>
                              </div>
                              <input
                                type="text"
                                value={sociosSearch[profesor.profesor_id] || ''}
                                onChange={(e) => handleSociosSearch(profesor.profesor_id, e.target.value)}
                                className="w-full md:w-72 rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                                placeholder="Buscar socio por ID o nombre"
                              />
                            </div>
                            <div className="mt-4 max-h-80 overflow-y-auto pr-2 space-y-2">
                              {getFilteredProfesorSocios(profesor).length > 0 ? (
                                getFilteredProfesorSocios(profesor).map((socio) => (
                                  <div key={socio.socio_id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                    <div className="font-medium text-slate-900">{socio.socio_id}</div>
                                    <div>{socio.nombre || 'Sin nombre'} {socio.apellido || ''}</div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500">No hay socios que coincidan con la búsqueda.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No se encontraron profesores</p>
          </div>
        )}
      </div>

      {assignModalOpen && selectedProfesor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-visible">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">Asignar socio a {selectedProfesor.nombre} {selectedProfesor.apellido}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700">Seleccionar Socio</label>
                <input
                  type="text"
                  value={socioQuery}
                  onChange={(e) => {
                    setSocioQuery(e.target.value);
                    setAssignSocioId('');
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                  placeholder="Buscar socio por nombre, apellido o ID"
                />
                {showSuggestions && socioQuery && filteredSocios.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {filteredSocios.map((socio) => (
                      <button
                        key={socio.socio_id}
                        type="button"
                        onMouseDown={() => selectSocio(socio)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {socio.socio_id} - {socio.nombre} {socio.apellido}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignSocio}
                  disabled={assigning}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300"
                >
                  {assigning ? 'Asignando...' : 'Asignar socio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && <ProfesorModal profesor={editingProfesor} onClose={handleModalClose} />}
    </div>
  );
}

export default Profesores;
