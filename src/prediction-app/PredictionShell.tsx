import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import {
  PresentationChartLineIcon,
  WalletIcon,
  TrophyIcon,
  ClockIcon
} from "@heroicons/react/24/solid";
import { PredictionHeader } from "./PredictionHeader";
import { PredictionFooter } from "./PredictionFooter";
import { Toast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { MobileNavBar } from "../ui/Nav";
import { usePrediction } from "./PredictionContext";
import { VividComposer, VividThread, type VividMessage } from "../domains/vivid/Vivid";

const dockItems = [
  { id: "markets", label: "Markets", icon: PresentationChartLineIcon },
  { id: "portfolio", label: "Positions", icon: WalletIcon },
  { id: "leaderboard", label: "Rankings", icon: TrophyIcon },
  { id: "activity", label: "Feed", icon: ClockIcon }
];

const sampleVividMessages: VividMessage[] = [
  {
    id: "msg-1",
    from: "user",
    at: "10:42 AM",
    content: "What is the historical probability trend for Bitcoin closing above $100k?"
  },
  {
    id: "msg-2",
    from: "vivid",
    at: "10:42 AM",
    content: "Based on options market implied volatility and past halving cycle momentum, probability has climbed from 52% to 68% over the past month. Settlement source is Coinbase BTC-USD closing price."
  }
];

export function PredictionShell() {
  const { balance, toast, setToast } = usePrediction();
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (document.documentElement.dataset.theme as "dark" | "light") || "dark";
  });

  const [vividOpen, setVividOpen] = useState(false);
  const [dock, setDock] = useState(() => {
    if (location.pathname.includes("/portfolio")) return "portfolio";
    if (location.pathname.includes("/leaderboard")) return "leaderboard";
    if (location.pathname.includes("/activity")) return "activity";
    return "markets";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("ws-theme", next);
    } catch {}
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleDockSelect = (id: string) => {
    setDock(id);
    if (id === "markets") navigate("/");
    else if (id === "portfolio") navigate("/portfolio");
    else if (id === "leaderboard") navigate("/leaderboard");
    else if (id === "activity") navigate("/activity");
  };

  return (
    <div className="prediction-shell min-h-dvh bg-surface-canvas text-text-primary">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[60] focus-visible:rounded-lg focus-visible:bg-surface-raised focus-visible:px-3 focus-visible:py-2 focus-visible:text-[13px]"
      >
        Skip to main content
      </a>

      <PredictionHeader balance={balance} theme={theme} onTheme={toggleTheme} onVivid={() => setVividOpen(true)} />

      {/* Main Outlet */}
      <main id="main-content" className="prediction-main mx-auto w-full max-w-[1400px] px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-16">
        <Outlet />
      </main>

      {/* Footer */}
      <PredictionFooter onVivid={() => setVividOpen(true)} />

      {/* Mobile Bottom Dock */}
      <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center md:hidden">
        <MobileNavBar items={dockItems} activeId={dock} domain="prediction" onSelect={handleDockSelect} />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-4 bottom-24 z-[60] w-[min(360px,calc(100vw-32px))] sm:right-6 sm:bottom-6">
          <Toast
            key={toast.key}
            tone={toast.tone === "danger" ? "error" : toast.tone}
            title={toast.message}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}

      {/* Vivid AI Assistant Drawer / Modal */}
      <Modal
        open={vividOpen}
        onClose={() => setVividOpen(false)}
        title="Vivid AI — Market Intelligence"
        description="Ask Vivid about historical probabilities, market liquidity, macro signals, or contract resolution criteria."
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1">
          <VividThread messages={sampleVividMessages} />
          <VividComposer onSend={() => {}} />
        </div>
      </Modal>
    </div>
  );
}
