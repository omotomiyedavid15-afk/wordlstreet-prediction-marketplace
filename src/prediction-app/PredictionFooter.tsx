import { Link } from "react-router";
import { ArrowUpIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Button, IconButton } from "../ui/Button";
import { worldstreetLogo } from "../ui/logos";
import "./predictionFooter.css";

const sandbox = (import.meta.env.VITE_SANDBOX_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const categories = ["Politics", "Sports", "Crypto", "Finance", "Culture", "Economics", "Weather"];
const scrollToTop = () => window.scrollTo({ top: 0, behavior: "instant" });
const ecosystem = [
  ["Core Finance", "/domains/finance/wallet-banking"],
  ["Crypto Trading", "/domains/finance/crypto-trading"],
  ["Marketplace", "/domains/marketplace/discovery"],
  ["Academy", "/domains/academy/learning"],
  ["Community", "/domains/academy/community"],
  ["Xstream", "/domains/xstream/discovery"],
  ["Vivid AI", "/domains/vivid/assistant"],
];

export function PredictionFooter({ onVivid }: { onVivid: () => void }) {
  return <footer className="prediction-footer" aria-label="WorldStreet footer">
    <section className="prediction-footer-inner">
      <header className="prediction-footer-brand-row">
        <Link className="prediction-footer-brand" to="/" onClick={scrollToTop} aria-label="WorldStreet Predict home">
          <img src={worldstreetLogo} alt=""/><strong>WorldStreet</strong><em>Predict</em>
        </Link>
        <IconButton icon={ArrowUpIcon} label="Back to top" onClick={scrollToTop}/>
      </header>
      <section className="prediction-footer-columns">
        <nav aria-label="Footer markets"><h2>Markets /</h2><ul>
          <li><Link to="/" onClick={scrollToTop}>Trending</Link></li>
          {categories.map(category => <li key={category}><Link to={`/?category=${category}`} onClick={scrollToTop}>{category === "Economics" ? "Economy" : category}</Link></li>)}
        </ul></nav>
        <nav aria-label="Footer discover"><h2>Discover /</h2><ul>
          <li><Link to="/?view=live" onClick={scrollToTop}>Live markets</Link></li>
          <li><Link to="/?sort=new" onClick={scrollToTop}>New markets</Link></li>
          <li><Link to="/?sort=volume" onClick={scrollToTop}>Highest volume</Link></li>
          <li><Link to="/?category=Esports" onClick={scrollToTop}>Esports</Link></li>
          <li><Link to="/?category=Tech" onClick={scrollToTop}>Tech &amp; science</Link></li>
          <li><Link to="/?category=Social%20media" onClick={scrollToTop}>Social media</Link></li>
          <li><Link to="/leaderboard">Leaderboard</Link></li>
        </ul></nav>
        <nav aria-label="WorldStreet ecosystem"><h2>Ecosystem /</h2><ul>
          {ecosystem.map(([label, path]) => <li key={path}><a href={`${sandbox}${path}`}>{label}<ArrowUpRightIcon aria-hidden="true"/></a></li>)}
        </ul></nav>
        <nav aria-label="Footer account and resources"><h2>Your WorldStreet /</h2><ul>
          <li><Link to="/portfolio">Portfolio</Link></li>
          <li><Link to="/activity">Activity</Link></li>
          <li><a href={`${sandbox}/domains/academy/learning`}>Learning centre<ArrowUpRightIcon aria-hidden="true"/></a></li>
          <li><a href={`${sandbox}/`}>Design system<ArrowUpRightIcon aria-hidden="true"/></a></li>
          <li><a href={`${sandbox}/changelog`}>What's new<ArrowUpRightIcon aria-hidden="true"/></a></li>
        </ul><Button variant="ghost" onClick={onVivid}>Ask Vivid</Button></nav>
      </section>
      <section className="prediction-footer-bottom">
        <p>Sample markets. Simulated trades. No real funds.</p>
        <small>&copy; {new Date().getFullYear()} WorldStreet</small>
      </section>
    </section>
    <section className="prediction-footer-fade" aria-hidden="true"/>
  </footer>;
}
