import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { PredictionProvider } from "./PredictionContext";
import { PredictionShell } from "./PredictionShell";
import { PredictionHome } from "./PredictionHome";
import { MarketDetailPage } from "./MarketDetailPage";
import { PortfolioPage } from "./PortfolioPage";
import { LeaderboardPage } from "./LeaderboardPage";
import { ActivityPage } from "./ActivityPage";
import { PerpsProvider } from "./PerpsContext";
import { PerpsPage } from "./PerpsPage";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "../styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PredictionProvider>
      <PerpsProvider><BrowserRouter>
        <Routes>
          <Route element={<PredictionShell />}>
            <Route index element={<PredictionHome />} />
            <Route path="market/:id" element={<MarketDetailPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="perps" element={<PerpsPage />} />
            <Route path="perps/:symbol" element={<PerpsPage />} />
            <Route path="*" element={<PredictionHome />} />
          </Route>
        </Routes>
      </BrowserRouter></PerpsProvider>
    </PredictionProvider>
  </StrictMode>
);
