import { jsPDF } from "jspdf";
import { Build } from "../types";

export const generateBuildPDF = (build: Build) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(14, 165, 233); // Brand color
  doc.text("PC Build Configuration", 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Type: ${build.type}`, 20, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);

  // Table Header
  let y = 50;
  doc.setFont(undefined, 'bold');
  doc.text("Component", 20, y);
  doc.text("Item Name", 60, y);
  doc.text("Price", 170, y);
  doc.line(20, y + 2, 190, y + 2);
  
  y += 10;
  doc.setFont(undefined, 'normal');

  // Items
  Object.values(build.parts).forEach((part) => {
    if (!part) return;
    
    // Check page break
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(part.category, 20, y);
    // Truncate long names
    const name = part.name.length > 40 ? part.name.substring(0, 37) + '...' : part.name;
    doc.text(name, 60, y);
    doc.text(`$${part.price}`, 170, y);
    y += 10;
  });

  // Footer / Totals
  doc.line(20, y, 190, y);
  y += 10;
  doc.setFont(undefined, 'bold');
  doc.text(`Total Price: $${build.totalPrice}`, 140, y);
  doc.text(`Est. Wattage: ${build.totalWattage}W`, 140, y + 6);

  doc.save("my-pc-build.pdf");
};
