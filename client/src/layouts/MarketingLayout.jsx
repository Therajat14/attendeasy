import MarketingNav from "../components/common/MarketingNav";
import MarketingFooter from "../components/common/MarketingFooter";

export default function MarketingLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-ink-950">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
