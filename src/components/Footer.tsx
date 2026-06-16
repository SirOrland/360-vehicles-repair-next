import Link from "next/link";

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>
              <i className="fas fa-car-side" style={{ color: "var(--secondary-color)" }} />{" "}
              360 Vehicles Repair
            </h3>
            <p style={{ opacity: 0.8, marginBottom: "1rem" }}>
              Your trusted automotive repair partner. Quality service, honest pricing, expert mechanics.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter" /></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><Link href="/services">Oil Change</Link></li>
              <li><Link href="/services">Brake Service</Link></li>
              <li><Link href="/services">Engine Diagnostic</Link></li>
              <li><Link href="/services">Tire Rotation</Link></li>
              <li><Link href="/services">AC Service</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact Info</h4>
            <ul className="contact-info">
              <li>
                <i className="fas fa-map-marker-alt" />
                <span>Al Sawari 9 St - Musaffah - M13 - Abu Dhabi - United Arab Emirates</span>
              </li>
              <li>
                <i className="fas fa-envelope" />
                <span>technicalservices.360serv@outlook.com</span>
              </li>
              <li>
                <i className="fas fa-clock" />
                <span>Open Daily — 8:00 AM – 5:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Google Maps */}
        <div style={{ margin: "1.5rem 0", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          <iframe
            src="https://maps.google.com/maps?q=24.369264,54.4958458&z=16&output=embed"
            width="100%"
            height="220"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="360 Vehicles Repair Location"
          />
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} 360 Vehicles Mechanic Repair LLC. All rights reserved.</p>
          <div className="footer-links">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
