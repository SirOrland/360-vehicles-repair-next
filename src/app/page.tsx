import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const session = await auth();
  const services = await prisma.service.findMany({
    where: { status: "Active" },
    take: 6,
  });

  return (
    <>
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <h1><i className="fas fa-car-side" /> 360 Vehicles Mechanic Repair LLC</h1>
          <p>Your Trusted Automotive Repair Partner — Quality Service, Honest Pricing, Expert Mechanics</p>
          {!session ? (
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth/register" className="btn btn-primary btn-lg">
                <i className="fas fa-user-plus" /> Get Started
              </Link>
              <Link href="/services" className="btn btn-outline btn-lg">
                <i className="fas fa-tools" /> View Services
              </Link>
            </div>
          ) : (
            <Link href="/customer/book-appointment" className="btn btn-primary btn-lg">
              <i className="fas fa-calendar-plus" /> Book Appointment
            </Link>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: "4rem 0", backgroundColor: "var(--white)" }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "1rem" }}>Why Choose Us?</h2>
            <p style={{ color: "var(--light-text)", fontSize: "1.125rem" }}>We provide exceptional automotive repair services with a commitment to quality</p>
          </div>
          <div className="row">
            {[
              { icon: "fa-certificate", title: "Certified Mechanics", text: "Our team consists of ASE-certified technicians with years of experience" },
              { icon: "fa-dollar-sign", title: "Honest Pricing", text: "Transparent pricing with no hidden fees — you only pay for what you need" },
              { icon: "fa-clock", title: "Fast Service", text: "Quick turnaround times without compromising on quality" },
              { icon: "fa-shield-alt", title: "Warranty Coverage", text: "All repairs backed by our comprehensive warranty program" },
              { icon: "fa-tools", title: "Modern Equipment", text: "State-of-the-art diagnostic tools and repair equipment" },
              { icon: "fa-smile", title: "Customer Satisfaction", text: "Dedicated to providing excellent customer service and satisfaction" },
            ].map((item) => (
              <div className="col-4" key={item.title}>
                <div className="card text-center">
                  <div style={{ fontSize: "3rem", color: "var(--secondary-color)", marginBottom: "1rem" }}>
                    <i className={`fas ${item.icon}`} />
                  </div>
                  <h3 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}>{item.title}</h3>
                  <p style={{ color: "var(--light-text)" }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "4rem 0", backgroundColor: "var(--light-bg)" }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "1rem" }}>Our Services</h2>
            <p style={{ color: "var(--light-text)", fontSize: "1.125rem" }}>Comprehensive automotive repair and maintenance services</p>
          </div>
          <div className="row">
            {services.map((service) => (
              <div className="col-4" key={service.id}>
                <div className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, var(--accent-color), var(--secondary-color))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem" }}>
                      <i className="fas fa-wrench" />
                    </div>
                    <h3 style={{ color: "var(--primary-color)", margin: 0 }}>{service.serviceName}</h3>
                  </div>
                  <p style={{ color: "var(--light-text)", marginBottom: "1rem" }}>{service.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--secondary-color)", fontWeight: 600, fontSize: "1.25rem" }}>
                      {formatCurrency(service.basePrice?.toString())}
                    </span>
                    <span style={{ color: "var(--light-text)", fontSize: "0.875rem" }}>
                      <i className="fas fa-clock" /> ~{service.estimatedDuration} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/services" className="btn btn-primary">
              <i className="fas fa-list" /> View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "4rem 0", backgroundColor: "var(--white)" }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "1rem" }}>How It Works</h2>
            <p style={{ color: "var(--light-text)", fontSize: "1.125rem" }}>Simple steps to get your vehicle serviced</p>
          </div>
          <div className="row">
            {[
              { num: 1, title: "Create Account", text: "Sign up for free and add your vehicle information" },
              { num: 2, title: "Book Service", text: "Choose a service and select your preferred date and time" },
              { num: 3, title: "Get Service", text: "Bring your vehicle and our experts will take care of it" },
              { num: 4, title: "Drive Away", text: "Pick up your vehicle and enjoy the smooth ride" },
            ].map((step) => (
              <div className="col-3" key={step.num}>
                <div className="card text-center">
                  <div style={{ width: 80, height: 80, background: "var(--secondary-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "white", fontSize: "2rem", fontWeight: "bold" }}>
                    {step.num}
                  </div>
                  <h3 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}>{step.title}</h3>
                  <p style={{ color: "var(--light-text)" }}>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "4rem 0", background: "linear-gradient(135deg, var(--primary-color), var(--accent-color))", color: "white" }}>
        <div className="container text-center">
          <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Ready to Get Started?</h2>
          <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>Book your appointment today and experience quality automotive service</p>
          {!session ? (
            <Link href="/auth/register" className="btn btn-lg" style={{ backgroundColor: "white", color: "var(--primary-color)" }}>
              <i className="fas fa-user-plus" /> Sign Up Now
            </Link>
          ) : (
            <Link href="/customer/book-appointment" className="btn btn-lg" style={{ backgroundColor: "white", color: "var(--primary-color)" }}>
              <i className="fas fa-calendar-plus" /> Book Appointment
            </Link>
          )}
        </div>
      </section>

      {/* Contact */}
      <section style={{ padding: "4rem 0", backgroundColor: "var(--light-bg)" }}>
        <div className="container">
          <div className="row">
            {[
              { icon: "fa-map-marker-alt", title: "Visit Us", lines: ["123 Main Street", "City, State 12345"] },
              { icon: "fa-phone", title: "Call Us", lines: ["(555) 123-4567", "Mon–Fri: 8AM–6PM"] },
              { icon: "fa-envelope", title: "Email Us", lines: ["info@360vehicles.com", "We reply within 24 hours"] },
            ].map((item) => (
              <div className="col-4" key={item.title}>
                <div className="card text-center">
                  <div style={{ fontSize: "2.5rem", color: "var(--secondary-color)", marginBottom: "1rem" }}>
                    <i className={`fas ${item.icon}`} />
                  </div>
                  <h3 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}>{item.title}</h3>
                  <p style={{ color: "var(--light-text)" }}>
                    {item.lines.map((l, i) => <span key={i}>{l}{i < item.lines.length - 1 && <br />}</span>)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
