"use client";

export default function ReceiptActions() {
  return (
    <div className="no-print" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
      <button className="btn btn-primary" onClick={() => window.print()}>
        <i className="fas fa-print" /> Print Receipt
      </button>
      <button className="btn btn-secondary" onClick={() => {
        document.title = document.title; // keep title for PDF filename
        window.print();
      }}>
        <i className="fas fa-download" /> Download PDF
      </button>
    </div>
  );
}
