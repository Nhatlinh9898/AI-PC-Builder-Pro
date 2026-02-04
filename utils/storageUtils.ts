import { Build, SavedBuild } from "../types";

const STORAGE_KEY = 'ai_pc_builder_saves';

export const saveBuildToStorage = (build: Build, name: string): SavedBuild => {
  const saves = getSavedBuilds();
  
  const newSave: SavedBuild = {
    ...build,
    id: `build-${Date.now()}`,
    name: name || `My Custom Build ${new Date().toLocaleDateString()}`,
    createdAt: Date.now(),
  };

  saves.push(newSave);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  return newSave;
};

export const getSavedBuilds = (): SavedBuild[] => {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to parse saved builds", e);
    return [];
  }
};

export const deleteSavedBuild = (id: string) => {
  const saves = getSavedBuilds().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
};

export const exportBuildToJSON = (build: Build) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(build, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `pc_build_${Date.now()}.json`);
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};