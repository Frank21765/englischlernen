import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { BookOpen, GraduationCap, Library, PenLine, Puzzle, Sparkles } from "lucide-react";

const subNav = [
  { to: "/training/lektionen", label: "Lektionen", icon: Sparkles, match: "/training/lektionen" },
  { to: "/training/wortpuzzle", label: "Wortpuzzle", icon: Puzzle, match: "/training/wortpuzzle" },
  { to: "/training/quiz", label: "Quiz", icon: GraduationCap, match: "/training/quiz" },
  { to: "/training/lueckentext", label: "Lückentext", icon: PenLine, match: "/training/lueckentext" },
  { to: "/training/grammatik", label: "Grammatik", icon: Library, match: "/training/grammatik" },
  { to: "/vokabeln", label: "Vokabeln", icon: BookOpen, match: "/vokabeln" },
];

export default function Training() {
  const location = useLocation();
  if (location.pathname === "/training" || location.pathname === "/training/") {
    return <Navigate to="/training/lektionen" replace />;
  }
  return (
    <div className="space-y-4">
      <nav className="grid grid-cols-2 gap-2 md:flex md:gap-1 md:overflow-x-auto md:pb-1 md:-mx-1 md:px-1">
        {subNav.map(({ to, label, icon: Icon, match }) => (
          <NavLink
            key={to}
            to={to}
            className={() => {
              const isActive = location.pathname === match || location.pathname.startsWith(`${match}/`);
              return `flex items-center justify-center md:justify-start gap-2 rounded-2xl md:rounded-full px-4 py-3.5 md:px-3.5 md:py-1.5 text-base md:text-sm font-semibold leading-tight text-center md:whitespace-nowrap transition-smooth ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`;
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="md:truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
