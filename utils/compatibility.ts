import { Build, CompatibilityIssue, PART_CATEGORY } from '../types';

export const checkCompatibility = (build: Build): CompatibilityIssue[] => {
  const issues: CompatibilityIssue[] = [];
  const { parts } = build;

  const cpu = parts[PART_CATEGORY.CPU];
  const mobo = parts[PART_CATEGORY.MAINBOARD];
  const ram = parts[PART_CATEGORY.RAM];
  const psu = parts[PART_CATEGORY.PSU];
  const gpu = parts[PART_CATEGORY.GPU];

  // 1. Socket Check
  if (cpu && mobo) {
    if (cpu.specs.socket !== mobo.specs.socket) {
      issues.push({
        severity: 'error',
        message: `Incompatible Socket: CPU (${cpu.specs.socket}) vs Mobo (${mobo.specs.socket})`,
        component: 'CPU/Mainboard'
      });
    }
  }

  // 2. RAM Type Check
  if (mobo && ram) {
    if (mobo.specs.memoryType !== ram.specs.memoryType) {
      issues.push({
        severity: 'error',
        message: `Incompatible RAM: Mobo supports ${mobo.specs.memoryType}, RAM is ${ram.specs.memoryType}`,
        component: 'RAM'
      });
    }
  }

  // 3. Power Check
  const estimatedWattage = build.totalWattage;
  if (psu) {
    const psuWattage = psu.specs.wattage || 0;
    // Buffer of 10-20% is recommended
    if (estimatedWattage > psuWattage) {
      issues.push({
        severity: 'error',
        message: `Insufficient Power: Build uses ~${estimatedWattage}W, PSU is ${psuWattage}W`,
        component: 'PSU'
      });
    } else if (estimatedWattage > psuWattage * 0.9) {
      issues.push({
        severity: 'warning',
        message: `Power load is high (~${Math.round((estimatedWattage/psuWattage)*100)}%). Consider upgrading PSU.`,
        component: 'PSU'
      });
    }
  }

  // 4. ECC Check for Servers
  if (build.type === 'Server' || build.type === 'Workstation') {
    if (cpu && cpu.specs.ecc && ram && !ram.specs.ecc) {
      issues.push({
        severity: 'warning',
        message: `CPU supports ECC but selected RAM is non-ECC. Recommended for ${build.type}.`,
        component: 'RAM'
      });
    }
  }

  return issues;
};
