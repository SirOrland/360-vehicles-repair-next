"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import type { Session } from "next-auth";

interface Props {
  session: Session | null;
}

export default function Header({ session }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const role = session?.user?.role;
  const userName = session?.user?.name;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActive = (path: string) => pathname === path ? "active" : "";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <header className="main-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link href="/">
              <i className="fas fa-car-side" />
              <span>360 Vehicles Repair</span>
            </Link>
          </div>

          <nav className="main-nav">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <i className="fas fa-bars" />
            </button>

            <ul className={`nav-menu${mobileOpen ? " show" : ""}`} id="navMenu">
              {!session ? (
                <>
                  <li><Link href="/" className={isActive("/")}>Home</Link></li>
                  <li><Link href="/services" className={isActive("/services")}>Services</Link></li>
                  <li><Link href="/about" className={isActive("/about")}>About</Link></li>
                  <li><Link href="/contact" className={isActive("/contact")}>Contact</Link></li>
                  <li><Link href="/faq" className={isActive("/faq")}>FAQ</Link></li>
                  <li><Link href="/auth/login" className="btn-login">Login</Link></li>
                  <li><Link href="/auth/register" className="btn-register">Sign Up</Link></li>
                </>
              ) : (
                <>
                  {role === "Customer" && (
                    <>
                      <li><Link href="/customer/dashboard" className={isActive("/customer/dashboard")}>Dashboard</Link></li>
                      <li><Link href="/customer/book-appointment" className={isActive("/customer/book-appointment")}>Book Service</Link></li>
                      <li><Link href="/customer/my-appointments" className={isActive("/customer/my-appointments")}>My Appointments</Link></li>
                      <li><Link href="/customer/my-vehicles" className={isActive("/customer/my-vehicles")}>My Vehicles</Link></li>
                    </>
                  )}
                  {role === "Mechanic" && (
                    <>
                      <li><Link href="/mechanic/dashboard" className={isActive("/mechanic/dashboard")}>Dashboard</Link></li>
                      <li><Link href="/mechanic/jobs" className={isActive("/mechanic/jobs")}>My Jobs</Link></li>
                    </>
                  )}
                  {role === "Admin" && (
                    <>
                      <li><Link href="/admin/dashboard" className={isActive("/admin/dashboard")}>Dashboard</Link></li>
                      <li><Link href="/admin/appointments" className={isActive("/admin/appointments")}>Appointments</Link></li>
                      <li><Link href="/admin/users" className={isActive("/admin/users")}>Users</Link></li>
                      <li><Link href="/admin/inventory" className={isActive("/admin/inventory")}>Inventory</Link></li>
                      <li><Link href="/admin/reports" className={isActive("/admin/reports")}>Reports</Link></li>
                    </>
                  )}

                  <li className="user-menu" ref={dropdownRef}>
                    <a
                      href="#"
                      className="user-dropdown-toggle"
                      onClick={(e) => { e.preventDefault(); setDropdownOpen(!dropdownOpen); }}
                    >
                      <i className="fas fa-user-circle" />
                      <span>{userName}</span>
                      <i className="fas fa-chevron-down" />
                    </a>
                    <ul className={`user-dropdown${dropdownOpen ? " show" : ""}`}>
                      <li>
                        <Link href={`/${role?.toLowerCase()}/profile`} onClick={() => setDropdownOpen(false)}>
                          <i className="fas fa-user" /> Profile
                        </Link>
                      </li>
                      <li>
                        <Link href={`/${role?.toLowerCase()}/notifications`} onClick={() => setDropdownOpen(false)}>
                          <i className="fas fa-bell" /> Notifications
                        </Link>
                      </li>
                      <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                          <i className="fas fa-sign-out-alt" /> Logout
                        </a>
                      </li>
                    </ul>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
