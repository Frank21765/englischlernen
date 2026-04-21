import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { GraduationCap, Library, PenLine, Sparkles } from "lucide-react";

const subNav = [
  { to: "/uben/lektionen", label: "Lektionen", icon: Sparkles, match: "/uben/lektionen" },
  { to: "/uben/quiz", label: "Quiz", icon: GraduationCap, match: "/uben/quiz" },
  { to: "/uben/grammatik", label: "Grammatik", icon: Library, match: "/uben/grammatik" },
  { to: "/uben/lueckentext", label: "Lückentext", icon: PenLine, match: "/uben/lueckentext" },
];

export default function Uben() {
  const location = useLocation();
  if (location.pathname === "/uben" || location.pathname === "/uben/") {
    return <Navigate to="/uben/lektionen" replace />;
  }
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {subNav.map(({ to, label, icon: Icon, match }) => (
          <NavLink
            key={to}
            to={to}
            className={() => {
              const isActive = location.pathname === match || location.pathname.startsWith(`${match}/`);
              return `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-smooth ${
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
