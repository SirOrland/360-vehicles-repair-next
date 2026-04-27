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
                <span>123 Main Street, City, State 12345</span>
              </li>
              <li>
                <i className="fas fa-phone" />
                <span>(555) 123-4567</span>
              </li>
              <li>
                <i className="fas fa-envelope" />
                <span>info@360vehicles.com</span>
              </li>
              <li>
                <i className="fas fa-clock" />
                <span>Mon–Fri: 8AM–6PM</span>
              </li>
            </ul>
          </div>
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
