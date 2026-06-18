import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PromptMapping } from '../db/db';
import { Search, Upload, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Prompts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<PromptMapping | null>(null);

  const [formData, setFormData] = useState<Omit<PromptMapping, 'id'>>({
    promptText: '',
    toolName: '',
    toolArgs: '{}',
    intentCategory: ''
  });

  const mappings = useLiveQuery(() =>
    db.promptMappings.filter(m =>
      m.promptText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.toolName.toLowerCase().includes(searchTerm.toLowerCase())
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapsToAdd: Omit<PromptMapping, 'id'>[] = data.map((row: any) => ({
          promptText: String(row['User Prompt'] || row.promptText || '') || '',
          toolName: String(row['Tool Name'] || row.toolName || '') || '',
          toolArgs: row['Tool Args JSON'] || row.toolArgs || '{}',
          intentCategory: String(row['Intent Category'] || row.intentCategory || '') || ''
        })).filter(m => m.promptText);

        if (mapsToAdd.length > 0) {
          await db.promptMappings.bulkAdd(mapsToAdd);
          alert(`Successfully added ${mapsToAdd.length} prompts.`);
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
    if (confirm('Are you sure you want to delete this prompt mapping?')) {
      await db.promptMappings.delete(id);
    }
  };

  const handleOpenModal = (mapping?: PromptMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFormData({
        promptText: mapping.promptText,
        toolName: mapping.toolName,
        toolArgs: mapping.toolArgs,
        intentCategory: mapping.intentCategory
      });
    } else {
      setEditingMapping(null);
      setFormData({
        promptText: '',
        toolName: '',
        toolArgs: '{}',
        intentCategory: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMapping(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.promptText || !formData.toolName) {
      alert("Prompt Text and Tool Name are required.");
      return;
    }

    try {
      JSON.parse(formData.toolArgs);
    } catch {
      alert("Tool Args must be valid JSON.");
      return;
    }

    if (editingMapping?.id) {
      await db.promptMappings.update(editingMapping.id, formData);
    } else {
      await db.promptMappings.add(formData);
    }
    handleCloseModal();
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Prompt Mappings</h2>
          <p className="text-slate-500 mt-1">Map natural language user intents to specific tool calls.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <label className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md shadow-sm hover:bg-slate-50 cursor-pointer transition-colors font-medium w-full sm:w-auto">
            <Upload className="w-4 h-4" />
            Upload CSV/XLS
            <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Prompt
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search prompts or tools..."
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
                <th className="px-6 py-3 w-1/3">User Prompt</th>
                <th className="px-6 py-3">Tool Name</th>
                <th className="px-6 py-3">Tool Args (JSON)</th>
                <th className="px-6 py-3">Intent</th>
                <th className="px-6 py-3 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No prompt mappings found. Upload a file or add a new one.
                  </td>
                </tr>
              ) : (
                mappings?.map(map => (
                  <tr key={map.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 leading-relaxed pr-8">"{map.promptText}"</td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-700">{map.toolName}</td>
                    <td className="px-6 py-4">
                      <pre className="text-[11px] font-mono bg-slate-100 text-slate-700 p-2 rounded overflow-x-auto max-w-[250px]">
                        {map.toolArgs}
                      </pre>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {map.intentCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex justify-end gap-2 text-slate-400">
                        <button className="hover:text-blue-600 transition-colors p-1" title="Edit" onClick={() => handleOpenModal(map)}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="hover:text-red-600 transition-colors p-1" title="Delete" onClick={() => map.id && handleDelete(map.id)}>
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
                {editingMapping ? 'Edit Prompt Mapping' : 'Add New Prompt Mapping'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User Prompt *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.promptText}
                  onChange={e => setFormData({...formData, promptText: e.target.value})}
                  placeholder="e.g. When will my career graph finally start moving upward?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tool Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.toolName}
                    onChange={e => setFormData({...formData, toolName: e.target.value})}
                    placeholder="e.g. getAstrologicalVerdicts"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Intent Category</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.intentCategory}
                    onChange={e => setFormData({...formData, intentCategory: e.target.value})}
                    placeholder="e.g. TIMING"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tool Args (JSON)</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                  rows={5}
                  value={formData.toolArgs}
                  onChange={e => setFormData({...formData, toolArgs: e.target.value})}
                  placeholder='{"domain": "CAREER"}'
                />
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
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
