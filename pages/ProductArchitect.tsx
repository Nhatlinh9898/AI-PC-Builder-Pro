import React, { useState } from 'react';
import { 
  Folder, FolderOpen, Box, ChevronRight, ChevronDown, Plus, Trash2, 
  Edit2, Save, FileText, Wand2, ArrowLeft, LayoutList, Layers, Network 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ComponentNode } from '../types';
import { generateCompositeContent } from '../services/geminiService';

// --- INITIAL MOCK DATA ---
const INITIAL_TREE: ComponentNode[] = [
  {
    id: 'root-1',
    name: 'Ultimate Gaming PC (Assembly)',
    type: 'product',
    description: 'Top-tier custom gaming rig.',
    specs: { 'Platform': 'Desktop', 'Grade': 'Enthusiast' },
    children: [
      {
        id: 'node-1',
        name: 'Core Computing Unit',
        type: 'assembly',
        description: 'Main processing components.',
        specs: {},
        children: [
          { id: 'part-1', name: 'Intel Core i9-14900K', type: 'part', description: '24-Core CPU', specs: { 'Cores': '24', 'Speed': '6.0GHz' }, children: [] },
          { id: 'part-2', name: 'ASUS ROG Maximus Z790', type: 'part', description: 'E-ATX Motherboard', specs: { 'Socket': 'LGA1700', 'Chipset': 'Z790' }, children: [] },
        ]
      },
      {
        id: 'node-2',
        name: 'Graphics Subsystem',
        type: 'assembly',
        description: 'Visual rendering unit.',
        specs: {},
        children: [
          { id: 'part-3', name: 'NVIDIA RTX 4090', type: 'part', description: '24GB Flagship GPU', specs: { 'VRAM': '24GB', 'Cores': '16384' }, children: [] }
        ]
      }
    ]
  }
];

const ProductArchitect: React.FC = () => {
  const [tree, setTree] = useState<ComponentNode[]>(INITIAL_TREE);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('root-1');
  const [generating, setGenerating] = useState(false);
  const [editingNode, setEditingNode] = useState<Partial<ComponentNode> | null>(null);

  // --- RECURSIVE HELPERS ---
  const findNode = (nodes: ComponentNode[], id: string): ComponentNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const updateNodeInTree = (nodes: ComponentNode[], id: string, updater: (n: ComponentNode) => ComponentNode): ComponentNode[] => {
    return nodes.map(node => {
      if (node.id === id) return updater(node);
      if (node.children.length > 0) {
        return { ...node, children: updateNodeInTree(node.children, id, updater) };
      }
      return node;
    });
  };

  const deleteNodeInTree = (nodes: ComponentNode[], id: string): ComponentNode[] => {
    return nodes.filter(n => n.id !== id).map(node => ({
      ...node,
      children: deleteNodeInTree(node.children, id)
    }));
  };

  const addChildToNode = (nodes: ComponentNode[], parentId: string, newChild: ComponentNode): ComponentNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, newChild], isExpanded: true };
      }
      if (node.children.length > 0) {
        return { ...node, children: addChildToNode(node.children, parentId, newChild) };
      }
      return node;
    });
  };

  // --- ACTIONS ---
  const handleToggleExpand = (id: string) => {
    setTree(prev => updateNodeInTree(prev, id, n => ({ ...n, isExpanded: !n.isExpanded })));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      setTree(prev => deleteNodeInTree(prev, id));
      if (selectedNodeId === id) setSelectedNodeId(null);
    }
  };

  const handleAddChild = (parentId: string) => {
    const newChild: ComponentNode = {
      id: `new-${Date.now()}`,
      name: 'New Component',
      type: 'part',
      description: 'Description here...',
      specs: {},
      children: []
    };
    setTree(prev => addChildToNode(prev, parentId, newChild));
  };

  const handleGenerateContent = async (node: ComponentNode) => {
    setGenerating(true);
    try {
      const result = await generateCompositeContent(node);
      if (result && result.composite_content) {
        const { title, marketing_description, technical_summary } = result.composite_content;
        setTree(prev => updateNodeInTree(prev, node.id, n => ({
          ...n,
          name: title || n.name,
          description: marketing_description + '\n\n' + technical_summary
        })));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  // --- UI COMPONENTS ---
  
  const TreeNode: React.FC<{ node: ComponentNode; depth: number }> = ({ node, depth }) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div>
        <div 
          className={`
            flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-sm transition-colors
            ${isSelected ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); handleToggleExpand(node.id); }}
            className={`p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 ${!hasChildren ? 'invisible' : ''}`}
          >
            {node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {node.type === 'product' ? <Layers size={16} className="text-purple-500" /> : 
           node.type === 'assembly' ? <Folder size={16} className="text-blue-500" /> : 
           <Box size={16} className="text-slate-400" />}
          
          <span className="truncate">{node.name}</span>
        </div>
        
        {node.isExpanded && hasChildren && (
          <div className="border-l border-slate-200 dark:border-slate-800 ml-4">
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const activeNode = selectedNodeId ? findNode(tree, selectedNodeId) : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
         <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                 <Link to="/" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <ArrowLeft className="text-slate-500" size={20} />
                 </Link>
                 <div className="flex items-center gap-2">
                    <Network className="text-brand-600" />
                    <h1 className="text-xl font-bold">Product Architect</h1>
                 </div>
             </div>
             <div>
                 <Button variant="ghost" size="sm" onClick={() => setTree(INITIAL_TREE)}>Reset Demo</Button>
             </div>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)]">
        
        {/* Sidebar: Tree Explorer */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <span className="text-xs font-bold uppercase text-slate-500">Hierarchy</span>
                <button 
                    onClick={() => {
                        const newRoot: ComponentNode = { id: `root-${Date.now()}`, name: 'New Product', type: 'product', description: '', specs: {}, children: [] };
                        setTree(prev => [...prev, newRoot]);
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Add Root Product"
                >
                    <Plus size={16}/>
                </button>
            </div>
            <div className="p-2 space-y-1">
                {tree.map(node => <TreeNode key={node.id} node={node} depth={0} />)}
            </div>
        </aside>

        {/* Main Content: Node Management */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-8">
            {activeNode ? (
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm text-slate-500 mb-4">
                        <LayoutList size={14} className="mr-2"/>
                        <span>Explorer</span>
                        <ChevronRight size={14} className="mx-2"/>
                        <span className="font-semibold text-slate-900 dark:text-white">{activeNode.name}</span>
                    </div>

                    {/* Node Header & Editor */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1 mr-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <input 
                                        type="text" 
                                        value={activeNode.name}
                                        onChange={(e) => setTree(prev => updateNodeInTree(prev, activeNode.id, n => ({ ...n, name: e.target.value })))}
                                        className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none w-full"
                                    />
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                        activeNode.type === 'product' ? 'bg-purple-100 text-purple-700' :
                                        activeNode.type === 'assembly' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {activeNode.type}
                                    </span>
                                </div>
                                <textarea 
                                    value={activeNode.description}
                                    onChange={(e) => setTree(prev => updateNodeInTree(prev, activeNode.id, n => ({ ...n, description: e.target.value })))}
                                    className="w-full text-slate-600 dark:text-slate-400 bg-transparent resize-none focus:outline-none border border-transparent hover:border-slate-200 rounded p-2 text-sm h-24"
                                    placeholder="Add a description..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button 
                                    onClick={() => handleGenerateContent(activeNode)} 
                                    disabled={generating}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none shadow-md"
                                >
                                    {generating ? <Wand2 className="animate-spin mr-2" size={16}/> : <Wand2 className="mr-2" size={16}/>}
                                    AI Generate
                                </Button>
                                <Button variant="secondary" onClick={() => handleDelete(activeNode.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200">
                                    <Trash2 className="mr-2" size={16}/> Delete Node
                                </Button>
                            </div>
                        </div>

                        {/* Specs Key-Value Editor (Simple Mock) */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Specifications</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(activeNode.specs).map(([k, v], i) => (
                                    <div key={i} className="flex flex-col bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] uppercase text-slate-400 font-bold">{k}</span>
                                        <span className="text-sm font-medium">{v}</span>
                                    </div>
                                ))}
                                <button 
                                    className="flex items-center justify-center p-2 rounded border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-brand-500 hover:border-brand-500 transition-colors text-sm"
                                    onClick={() => {
                                        const key = prompt("Enter Spec Name (e.g. Color):");
                                        if (key) {
                                            const val = prompt("Enter Value:");
                                            if (val) {
                                                setTree(prev => updateNodeInTree(prev, activeNode.id, n => ({
                                                    ...n, specs: { ...n.specs, [key]: val }
                                                })));
                                            }
                                        }
                                    }}
                                >
                                    <Plus size={16} className="mr-1"/> Add Spec
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Children / Branch Management Table */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Branch Components</h3>
                            <Button size="sm" onClick={() => handleAddChild(activeNode.id)}>
                                <Plus size={16} className="mr-1"/> Add Child
                            </Button>
                        </div>

                        {activeNode.children.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                                <Box size={48} className="mx-auto mb-3 opacity-20" />
                                <p>This node is a leaf (no children).</p>
                                <p className="text-sm">Add children to convert it into an assembly.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {activeNode.children.map(child => (
                                            <tr key={child.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="p-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                    {child.type === 'part' ? <Box size={14} className="text-slate-400"/> : <FolderOpen size={14} className="text-blue-400"/>}
                                                    {child.name}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        child.type === 'product' ? 'bg-purple-100 text-purple-700' :
                                                        child.type === 'assembly' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {child.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500 max-w-xs truncate">{child.description}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => setSelectedNodeId(child.id)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" 
                                                            title="Drill Down"
                                                        >
                                                            <FolderOpen size={16}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(child.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            title="Remove"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Network size={64} className="mb-4 opacity-20"/>
                    <p className="text-lg font-medium">Select a node from the hierarchy to begin.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default ProductArchitect;