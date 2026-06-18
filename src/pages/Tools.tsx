import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Tool } from '../db/db';
import { Search, Upload, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Tools() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const [formData, setFormData] = useState<Omit<Tool, 'id'>>({
    name: '',
    description: '',
    parametersSchema: '{}',
    requiredFields: '',
    returnType: ''
  });

  const tools = useLiveQuery(() =>
    db.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    ).toArray(),
    [searchTerm]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const toolsToAdd: Omit<Tool, 'id'>[] = data.map((row: any) => ({
          name: row['Tool Name'] || row.name || '',
          description: row['Description'] || row.description || '',
          parametersSchema: row['Parameters Schema (JSON)'] || row.parametersSchema || '{}',
          requiredFields: row['Required Fields'] || row.requiredFields || '',
          returnType: row['Return Type'] || row.returnType || ''
        })).filter(t => t.name);

        if (toolsToAdd.length > 0) {
          await db.tools.bulkAdd(toolsToAdd);
          alert(`Successfully added ${toolsToAdd.length} tools.`);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        alert('Failed to parse the uploaded file. Ensure it has the correct columns.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      await db.tools.delete(id);
    }
  };

  const handleOpenModal = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        description: tool.description,
        parametersSchema: tool.parametersSchema,
        requiredFields: tool.requiredFields,
        returnType: tool.returnType
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: '',
        description: '',
        parametersSchema: '{}',
        requiredFields: '',
        returnType: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Tool Name is required.");
      return;
    }

    // basic JSON validation
    try {
      JSON.parse(formData.parametersSchema);
    } catch(err) {
      alert("Parameters Schema must be valid JSON.");
      return;
    }

    if (editingTool?.id) {
      await db.tools.update(editingTool.id, formData);
    } else {
      await db.tools.add(formData);
    }
    handleCloseModal();
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Tool Management</h2>
          <p className="text-slate-500 mt-1">Manage external functions available for the LLM.</p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md shadow-sm hover:bg-slate-50 cursor-pointer transition-colors font-medium">
            <Upload className="w-4 h-4" />
            Upload CSV/XLS
            <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add New Tool
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-medium">
              <tr>
                <th className="px-6 py-3">Tool Name</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Schema</th>
                <th className="px-6 py-3">Required</th>
                <th className="px-6 py-3">Return</th>
                <th className="px-6 py-3 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tools?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No tools found. Upload a file or add a new one.
                  </td>
                </tr>
              ) : (
                tools?.map(tool => (
                  <tr key={tool.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-900 font-semibold">{tool.name}</td>
                    <td className="px-6 py-4 truncate max-w-xs" title={tool.description}>{tool.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-800 border border-slate-200 truncate max-w-[150px]" title={tool.parametersSchema}>
                        {tool.parametersSchema}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{tool.requiredFields}</td>
                    <td className="px-6 py-4 text-xs font-mono">{tool.returnType}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        <button className="hover:text-blue-600 transition-colors p-1" title="Edit" onClick={() => handleOpenModal(tool)}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="hover:text-red-600 transition-colors p-1" title="Delete" onClick={() => tool.id && handleDelete(tool.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">
                {editingTool ? 'Edit Tool' : 'Add New Tool'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tool Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. getUserProfile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describes what the tool does"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parameters Schema (JSON)</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                  rows={5}
                  value={formData.parametersSchema}
                  onChange={e => setFormData({...formData, parametersSchema: e.target.value})}
                  placeholder='{"paramName": {"type": "string"}}'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required Fields</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.requiredFields}
                    onChange={e => setFormData({...formData, requiredFields: e.target.value})}
                    placeholder="e.g. paramName, otherParam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Return Type</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.returnType}
                    onChange={e => setFormData({...formData, returnType: e.target.value})}
                    placeholder="e.g. string"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
