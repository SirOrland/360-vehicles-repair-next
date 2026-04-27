import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ - 360 Vehicles Repair LLC" };

const faqs = [
  { q: "How do I book an appointment?", a: "Create an account, add your vehicle, then click 'Book Service' and select your preferred service, date, and time. Our team will confirm within 24 hours." },
  { q: "What payment methods do you accept?", a: "We accept cash, credit cards, and debit cards. Payment is collected at the time of service completion." },
  { q: "How long will my repair take?", a: "Service times vary by type. Simple services like oil changes take 30 minutes; complex repairs may take several hours. We'll give you an estimated time when you book." },
  { q: "Do you offer a warranty on repairs?", a: "Yes. All repairs come with a warranty. Parts are covered by the manufacturer's warranty and labor is warranted for 90 days." },
  { q: "Can I wait while my car is being serviced?", a: "Yes, we have a comfortable waiting area with Wi-Fi. For longer repairs, we can arrange a ride or provide updates via notification." },
  { q: "What types of vehicles do you service?", a: "We service all makes and models, including domestic, import, and luxury vehicles." },
  { q: "Do I need an appointment or can I walk in?", a: "Appointments are preferred to minimize your wait time, but we do accept walk-ins based on availability." },
  { q: "How will I be notified about my appointment status?", a: "You'll receive real-time notifications in your account dashboard whenever your appointment status changes." },
];

export default function FaqPage() {
  return (
    <div className="container">
      <div style={{ padding: "3rem 0" }}>
        <div className="text-center mb-4">
          <h1 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "1rem" }}>
            <i className="fas fa-question-circle" /> Frequently Asked Questions
          </h1>
          <p style={{ color: "var(--light-text)", fontSize: "1.125rem" }}>
            Find answers to common questions about our services
          </p>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {faqs.map((faq, i) => (
            <div className="card" key={i}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ width: 40, height: 40, background: "var(--secondary-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, flexShrink: 0, fontSize: "1.1rem" }}>
                  Q
                </div>
                <div>
                  <h3 style={{ color: "var(--primary-color)", marginBottom: "0.75rem" }}>{faq.q}</h3>
                  <p style={{ color: "var(--light-text)", lineHeight: 1.7 }}>{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <p style={{ color: "var(--light-text)", marginBottom: "1rem" }}>Still have questions?</p>
          <a href="/contact" className="btn btn-primary">
            <i className="fas fa-envelope" /> Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
