"use client";

import { useState } from "react";

export default function ReceiptActions({ receiptNo }: { receiptNo: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = document.getElementById("receipt-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Use content height as the page height so the receipt always fits on one page
      const margin = 10;
      const pageWidth = 210; // A4 width in mm
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = imgHeight + margin * 2;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageWidth, pageHeight] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, imgWidth, imgHeight);
      pdf.save(`${receiptNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback to print dialog
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="no-print" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
      <button className="btn btn-primary" onClick={() => window.print()}>
        <i className="fas fa-print" /> Print Receipt
      </button>
      <button className="btn btn-secondary" onClick={handleDownload} disabled={downloading}>
        {downloading
          ? <><i className="fas fa-spinner fa-spin" /> Generating PDF…</>
          : <><i className="fas fa-download" /> Download PDF</>}
      </button>
    </div>
  );
}
