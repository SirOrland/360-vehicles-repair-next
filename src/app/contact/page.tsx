import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact - 360 Vehicles Repair LLC" };

export default function ContactPage() {
  return (
    <div className="container">
      <div style={{ padding: "3rem 0" }}>
        <div className="text-center mb-4">
          <h1 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "1rem" }}>
            <i className="fas fa-envelope" /> Contact Us
          </h1>
          <p style={{ color: "var(--light-text)", fontSize: "1.125rem" }}>
            Get in touch with our team
          </p>
        </div>

        <div className="row">
          <div className="col-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Send Us a Message</h3>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-6">
                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-user" /> Full Name</label>
                        <input type="text" className="form-control" placeholder="Your name" />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-envelope" /> Email Address</label>
                        <input type="email" className="form-control" placeholder="your@email.com" />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><i className="fas fa-phone" /> Phone Number</label>
                    <input type="tel" className="form-control" placeholder="(555) 000-0000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><i className="fas fa-tag" /> Subject</label>
                    <input type="text" className="form-control" placeholder="How can we help?" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><i className="fas fa-comment" /> Message</label>
                    <textarea className="form-control" rows={5} placeholder="Describe your concern or question..." />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-paper-plane" /> Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card">
              <h3 style={{ color: "var(--primary-color)", marginBottom: "1.5rem" }}>Contact Information</h3>
              {[
                { icon: "fa-map-marker-alt", title: "Address", lines: ["123 Main Street", "City, State 12345"] },
                { icon: "fa-phone", title: "Phone", lines: ["(555) 123-4567"] },
                { icon: "fa-envelope", title: "Email", lines: ["info@360vehicles.com"] },
                { icon: "fa-clock", title: "Business Hours", lines: ["Mon–Fri: 8:00 AM – 6:00 PM", "Saturday: 9:00 AM – 4:00 PM", "Sunday: Closed"] },
              ].map((item) => (
                <div key={item.title} style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: 40, height: 40, background: "var(--secondary-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                      <i className={`fas ${item.icon}`} />
                    </div>
                    <strong style={{ color: "var(--primary-color)" }}>{item.title}</strong>
                  </div>
                  {item.lines.map((l, i) => (
                    <p key={i} style={{ color: "var(--light-text)", marginLeft: "3.25rem", margin: "0 0 0 3.25rem" }}>{l}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
