import { useState, useEffect } from 'react';
import { db } from '../db/db';
import { Download, Copy, Check } from 'lucide-react';

export default function Export() {
  const [jsonStr, setJsonStr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function buildDataset() {
      const allTools = await db.tools.toArray();
      const allMappings = await db.promptMappings.toArray();

      const toolsMap = allTools.reduce((acc, t) => {
        let params = {};
        try { params = JSON.parse(t.parametersSchema); } catch (e) {}

        let required: string[] = [];
        if (t.requiredFields && t.requiredFields !== 'N/A') {
          if (t.requiredFields.startsWith('[')) {
            try { required = JSON.parse(t.requiredFields); } catch(e) {}
          } else {
            required = t.requiredFields.split(',').map(s => s.trim());
          }
        }

        acc[t.name] = {
          function: {
            name: t.name,
            description: t.description,
            parameters: {
              type: "OBJECT",
              properties: params,
              ...(required.length > 0 ? { required } : {})
            }
          }
        };
        return acc;
      }, {} as any);

      const dataset = allMappings.map(m => {
        let args = {};
        try { args = JSON.parse(m.toolArgs); } catch (e) {}

        // Gather all tools involved (in a real scenario, you might want all available tools per row,
        // but here we just include the one it maps to, or a subset. We'll include all tools for simplicity,
        // as the prompt implies the model has access to a list of tools)

        return {
          metadata: m.intentCategory || "eval",
          tools: Object.values(toolsMap),
          messages: [
            {
              role: "developer",
              content: "Current date and time given in YYYY-MM-DDTHH:MM:SS format: " + new Date().toISOString().split('.')[0] + "\nYou are a model that can do function calling with the following functions\n"
            },
            {
              role: "user",
              content: m.promptText
            },
            {
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    name: m.toolName,
                    arguments: args
                  }
                }
              ]
            }
          ]
        };
      });

      setJsonStr(JSON.stringify(dataset, null, 2));
    }
    buildDataset();
  }, []);

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm_training_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Export Dataset</h2>
          <p className="text-slate-500 mt-1">Review and download your formatted JSONL/JSON dataset for training.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md shadow-sm hover:bg-slate-50 transition-colors font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!jsonStr || jsonStr === '[]'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
          <span className="text-xs font-mono text-slate-400">dataset_preview.json</span>
        </div>
        <div className="p-4 overflow-auto flex-1 custom-scrollbar">
          <pre className="text-sm font-mono text-slate-300">
            {jsonStr || 'Loading dataset...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
