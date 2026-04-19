import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { History, Settings, Trophy } from "lucide-react";

const subNav = [
  { to: "/profil/erfolge", label: "Erfolge", icon: Trophy },
  { to: "/profil/statistik", label: "Statistik", icon: History },
  { to: "/profil/einstellungen", label: "Einstellungen", icon: Settings },
];

export default function Profil() {
  const location = useLocation();
  if (location.pathname === "/profil" || location.pathname === "/profil/") {
    return <Navigate to="/profil/erfolge" replace />;
  }
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {subNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-smooth ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
