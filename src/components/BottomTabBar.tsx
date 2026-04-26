import { useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, MessageCircle, Sparkles, User } from "lucide-react";

const tabs = [
  { to: "/start", label: "Start", icon: Sparkles, match: ["/start"] },
  {
    to: "/training",
    label: "Training",
    icon: Dumbbell,
    match: ["/training", "/quiz", "/grammatik", "/lueckentext", "/vokabeln"],
  },
  { to: "/chat?new=1", label: "Coach", icon: MessageCircle, match: ["/chat"] },
  {
    to: "/profil",
    label: "Profil",
    icon: User,
    match: ["/profil", "/erfolge", "/statistik", "/einstellungen", "/admin"],
  },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  return (
    <nav
      aria-label="Hauptnavigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, match }) => {
          const isActive = match.some((m) => path === m || path.startsWith(m + "/"));
          const isCoach = to.startsWith("/chat");
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => {
                  if (isCoach) {
                    navigate(`/chat?new=1&t=${Date.now()}`);
                  } else {
                    navigate(to);
                  }
                }}
                className={`relative w-full flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-smooth ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-gradient-lacquer shadow-glow"
                  />
                )}
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
