import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  ArrowTrendingUpIcon, Bars3Icon, ChevronDownIcon, ChevronRightIcon,
  InformationCircleIcon, MagnifyingGlassIcon, MoonIcon, SunIcon,
  AdjustmentsVerticalIcon, BoltIcon, SparklesIcon, BuildingLibraryIcon,
  TrophyIcon, CurrencyDollarIcon, ComputerDesktopIcon, ChartBarIcon,
  CpuChipIcon, MusicalNoteIcon, GlobeAltIcon, CloudIcon, ChatBubbleLeftRightIcon,
  BellIcon, ArrowDownTrayIcon, WalletIcon,
} from "@heroicons/react/24/outline";
import { worldstreetLogo } from "../ui/logos";
import { Button, IconButton } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { ActionMenu } from "../ui/Dropdown";
import { Modal } from "../ui/Modal";
import { usePrediction } from "./PredictionContext";
import { usePerps } from "./PerpsContext";
import { perpGroups } from "./perpsData";
import "./predictionHeader.css";

const topics = [
  { label: "Politics", icon: BuildingLibraryIcon }, { label: "Sports", icon: TrophyIcon },
  { label: "Crypto", icon: CurrencyDollarIcon }, { label: "Esports", icon: ComputerDesktopIcon },
  { label: "Finance", icon: ChartBarIcon }, { label: "Tech", icon: CpuChipIcon },
  { label: "Culture", icon: MusicalNoteIcon }, { label: "Economy", icon: GlobeAltIcon },
  { label: "Weather", icon: CloudIcon }, { label: "Social media", icon: ChatBubbleLeftRightIcon },
];

export function PredictionHeader({ balance, theme, onTheme, onVivid }: {
  balance: number; theme: string; onTheme: () => void; onVivid: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { positions } = usePrediction();
  const { account: perpAccount } = usePerps();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [dialog, setDialog] = useState<"help" | "deposit" | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const rail = useRef<HTMLElement>(null);
  const category = params.get("category");
  const view = params.get("view") ?? "";
  const perps = location.pathname.startsWith("/perps");
  const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const portfolioValue = perps ? perpAccount.positions.reduce((sum,p)=>sum+p.margin*p.rate,0) : positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const accountPath = perps ? `${location.pathname === "/perps" ? "/perps/BTC" : location.pathname}#perp-account` : "/portfolio";

  useEffect(() => { setQuery(params.get("q") ?? ""); }, [params]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLElement && (event.target.matches("input,textarea,select") || event.target.isContentEditable))) {
        event.preventDefault(); search.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);

  return <header className="pm-app-header">
    <section className="pm-header-top" aria-label="Account and search">
      <Link className="pm-header-brand" to="/" aria-label="WorldStreet predictions home">
        <img src={worldstreetLogo} alt="" /><strong>WorldStreet</strong>
      </Link>
      <nav className="pm-header-primary-nav" aria-label="Main navigation">
        <Button variant="ghost" aria-current={location.pathname === "/" && !view ? "page" : undefined} onClick={() => navigate("/")}>Markets</Button>
        <Button variant="ghost" prefixIcon={AdjustmentsVerticalIcon} aria-current={perps ? "page" : undefined} onClick={() => navigate("/perps")}>Perps</Button>
        <Button variant="ghost" prefixIcon={BoltIcon} aria-current={view === "live" ? "page" : undefined} onClick={() => navigate("/?view=live")}>Live</Button>
        <ActionMenu label="More views" trigger={props => <Button {...props} variant="ghost" suffixIcon={ChevronDownIcon}>More</Button>} items={[
          { label: "New markets", icon: SparklesIcon, onSelect: () => navigate("/?view=new") },
          { label: "Breaking markets", icon: BoltIcon, onSelect: () => navigate("/?view=breaking") },
          { label: "Leaderboard", icon: TrophyIcon, onSelect: () => navigate("/leaderboard") },
          { label: "How it works", icon: InformationCircleIcon, onSelect: () => setDialog("help") },
        ]}/>
      </nav>
      <form className="pm-header-search" role="search" onSubmit={event => {
        event.preventDefault();
        navigate((perps?"/perps":"/")+(query.trim() ? "?q=" + encodeURIComponent(query.trim()) : ""));
      }}>
        <InputField inputRef={search} type="search" label="Search prediction markets" hideLabel hideMessage
          leadingIcon={MagnifyingGlassIcon} placeholder="Search markets..." shortcut="/" clearable
          value={query} onChange={event => setQuery(event.target.value)} onClear={() => { setQuery(""); navigate(perps?"/perps":"/"); }} />
      </form>
      <section className="pm-header-actions" aria-label="Account actions">
        <Link className="pm-header-stat" to={accountPath}>{perps?"Margin":"Portfolio"}<strong>{money(portfolioValue)}</strong></Link>
        <Link className="pm-header-stat" to={accountPath}>Cash<strong>{money(perps?perpAccount.balances.USD:balance)}</strong></Link>
        <Button variant="primary" prefixIcon={ArrowDownTrayIcon} onClick={() => setDialog("deposit")}>Deposit</Button>
        <IconButton className="pm-header-notifications" variant="secondary" icon={BellIcon} label="Activity" onClick={() => navigate("/activity")} />
        <ActionMenu label="Account menu" trigger={props => <IconButton {...props} icon={Bars3Icon} label="Account menu" tooltip={false} />} items={[
          { label: "Portfolio", icon: WalletIcon, onSelect: () => navigate("/portfolio") },
          { label: "Leaderboard", icon: TrophyIcon, onSelect: () => navigate("/leaderboard") },
          { label: "How it works", icon: InformationCircleIcon, onSelect: () => setDialog("help") },
          { label: "Ask Vivid", icon: SparklesIcon, onSelect: onVivid },
          { label: theme === "dark" ? "Light theme" : "Dark theme", icon: theme === "dark" ? SunIcon : MoonIcon, onSelect: onTheme },
        ]} />
      </section>
    </section>
    {perps?<nav className="pm-header-bottom pm-perp-categories" aria-label="Perpetual categories">{["All",...perpGroups].map(group=><Button key={group} variant="ghost" aria-current={(params.get("group")??(location.pathname.split("/")[2]?"":"All"))===group?"page":undefined} onClick={()=>navigate(group==="All"?"/perps":"/perps?group="+group)}>{group}</Button>)}</nav>:<section className="pm-header-bottom" aria-label="Market discovery">
      <Button variant="ghost" prefixIcon={ArrowTrendingUpIcon} aria-current={location.pathname === "/" && !category && !params.get("q") && !view ? "page" : undefined} onClick={() => navigate("/")}>Trending</Button>
      <nav ref={rail} className="pm-header-topics" aria-label="Market categories">
        {topics.map(topic => <Button key={topic.label} variant="ghost" prefixIcon={topic.icon}
          aria-current={category === topic.label ? "page" : undefined}
          onClick={() => navigate("/?category=" + encodeURIComponent(topic.label))}>{topic.label}</Button>)}
      </nav>
      <IconButton className="pm-header-scroll" icon={ChevronRightIcon} label="Scroll categories" onClick={() => rail.current?.scrollBy({ left: 240, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })} />
      <ActionMenu label="More categories" trigger={props => <IconButton {...props} icon={ChevronDownIcon} label="All categories" tooltip={false}/>}
        items={topics.map(topic => ({ label: topic.label, icon: topic.icon, checked: category === topic.label, onSelect: () => navigate("/?category=" + encodeURIComponent(topic.label)) }))} />
    </section>}
    <Modal open={dialog === "help"} onClose={() => setDialog(null)} title="How prediction markets work" size="sm">
      <p>Choose a market, review its resolution rules, then buy an outcome. A 60-cent share implies a 60% probability. Winning shares settle at $1; losing shares settle at $0.</p>
      <p>This workspace uses sample markets and simulated trades.</p>
    </Modal>
    <Modal open={dialog === "deposit"} onClose={() => setDialog(null)} title="Deposit funds" size="sm">
      <p>Deposits are not connected in this sandbox. Your available demo cash is {money(perps?perpAccount.balances.USD:balance)}; no real money will be moved.</p>
      <Button variant="primary" onClick={() => { setDialog(null); navigate(accountPath); }}>View account</Button>
    </Modal>
  </header>;
}
