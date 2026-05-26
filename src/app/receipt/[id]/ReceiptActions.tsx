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

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Handle multi-page receipts
      let yOffset = margin;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - margin * 2);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = (sliceHeight / imgWidth) * canvas.width;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);

        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, yOffset, imgWidth, sliceHeight);

        sourceY += sliceCanvas.height;
        remainingHeight -= sliceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset = margin;
        }
      }

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
