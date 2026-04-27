import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us - 360 Vehicles Repair LLC" };

export default function AboutPage() {
  return (
    <div className="container">
      <div style={{ padding: "3rem 0" }}>
        <div className="text-center mb-4">
          <h1 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "1rem" }}>
            <i className="fas fa-info-circle" /> About Us
          </h1>
          <p style={{ color: "var(--light-text)", fontSize: "1.125rem" }}>
            Learn more about 360 Vehicles Mechanic Repair LLC
          </p>
        </div>

        <div className="row">
          <div className="col-8">
            <div className="card">
              <h2 style={{ color: "var(--primary-color)", marginBottom: "1rem" }}>Our Story</h2>
              <p style={{ color: "var(--light-text)", marginBottom: "1rem", lineHeight: 1.8 }}>
                360 Vehicles Mechanic Repair LLC has been serving the community with top-quality automotive repair services. Our team of certified mechanics is dedicated to providing honest, transparent service at fair prices.
              </p>
              <p style={{ color: "var(--light-text)", marginBottom: "1rem", lineHeight: 1.8 }}>
                We believe in building lasting relationships with our customers through trust, quality workmanship, and excellent customer service. Every vehicle that comes through our doors receives the same high level of care and attention.
              </p>
              <p style={{ color: "var(--light-text)", lineHeight: 1.8 }}>
                Whether you need a simple oil change or a complex engine repair, our team has the expertise and equipment to get the job done right the first time.
              </p>
            </div>

            <div className="card">
              <h2 style={{ color: "var(--primary-color)", marginBottom: "1.5rem" }}>Our Values</h2>
              <div className="row">
                {[
                  { icon: "fa-handshake", title: "Integrity", text: "We are honest about what your vehicle needs and provide transparent pricing." },
                  { icon: "fa-star", title: "Quality", text: "We use quality parts and follow manufacturer specifications for all repairs." },
                  { icon: "fa-users", title: "Customer First", text: "Your satisfaction is our top priority. We listen and communicate clearly." },
                  { icon: "fa-award", title: "Excellence", text: "We continuously improve our skills and stay current with automotive technology." },
                ].map((v) => (
                  <div className="col-6" key={v.title}>
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                      <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, var(--accent-color), var(--secondary-color))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.25rem", flexShrink: 0 }}>
                        <i className={`fas ${v.icon}`} />
                      </div>
                      <div>
                        <h4 style={{ color: "var(--primary-color)", marginBottom: "0.25rem" }}>{v.title}</h4>
                        <p style={{ color: "var(--light-text)", fontSize: "0.9rem" }}>{v.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card">
              <h3 style={{ color: "var(--primary-color)", marginBottom: "1.5rem" }}>Quick Facts</h3>
              {[
                { icon: "fa-tools", label: "Services Offered", value: "10+" },
                { icon: "fa-certificate", label: "Certified Mechanics", value: "ASE Certified" },
                { icon: "fa-clock", label: "Business Hours", value: "Mon–Fri 8AM–6PM" },
                { icon: "fa-map-marker-alt", label: "Location", value: "123 Main Street" },
                { icon: "fa-phone", label: "Phone", value: "(555) 123-4567" },
                { icon: "fa-envelope", label: "Email", value: "info@360vehicles.com" },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid var(--light-bg)" }}>
                  <i className={`fas ${f.icon}`} style={{ color: "var(--secondary-color)", width: 20 }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--light-text)" }}>{f.label}</div>
                    <div style={{ fontWeight: 600, color: "var(--primary-color)" }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: "linear-gradient(135deg, var(--primary-color), var(--accent-color))", color: "white" }}>
              <h3 style={{ marginBottom: "1rem" }}>Ready to Visit?</h3>
              <p style={{ opacity: 0.9, marginBottom: "1.5rem" }}>Schedule your appointment online or give us a call.</p>
              <a href="/auth/register" className="btn" style={{ backgroundColor: "white", color: "var(--primary-color)", display: "block", textAlign: "center" }}>
                <i className="fas fa-calendar-plus" /> Book Appointment
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
