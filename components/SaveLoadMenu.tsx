import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, X, Download } from 'lucide-react';
import { useBuild } from '../context/BuildContext';
import { saveBuildToStorage, getSavedBuilds, deleteSavedBuild, exportBuildToJSON } from '../utils/storageUtils';
import { SavedBuild } from '../types';
import Button from './ui/Button';

interface SaveLoadMenuProps {
  onClose: () => void;
  type: 'save' | 'load';
}

const SaveLoadMenu: React.FC<SaveLoadMenuProps> = ({ onClose, type }) => {
  const { build, setFullBuild } = useBuild();
  const [saves, setSaves] = useState<SavedBuild[]>([]);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    setSaves(getSavedBuilds().sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveBuildToStorage(build, saveName);
    onClose();
    alert('Build Saved Successfully!');
  };

  const handleLoad = (saved: SavedBuild) => {
    // Remove metadata fields before loading into context
    const { id, name, createdAt, ...buildData } = saved;
    setFullBuild(buildData);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedBuild(id);
    setSaves(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {type === 'save' ? <Save size={20} /> : <FolderOpen size={20} />}
            {type === 'save' ? 'Save Configuration' : 'Load Saved Build'}
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-6">
          {type === 'save' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Build Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="e.g. Dream Gaming Rig 2024"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="text-sm text-slate-500">
                Summary: {build.type}, ${build.totalPrice}
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!saveName.trim()}>
                Save to Local Storage
              </Button>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                 <Button variant="secondary" className="w-full" onClick={() => exportBuildToJSON(build)}>
                    <Download size={16} className="mr-2"/> Export as JSON
                 </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {saves.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No saved builds found.</div>
              ) : (
                saves.map((save) => (
                  <div
                    key={save.id}
                    onClick={() => handleLoad(save)}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-500 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{save.name}</div>
                        <div className="text-xs text-slate-500">
                           {new Date(save.createdAt).toLocaleDateString()} • {save.type} • ${save.totalPrice}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(save.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadMenu;