import styles from "./page.module.scss";
import PortfolioSection from "../components/PortfolioSection.client";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ContactsSection from "../components/ContactsSection";
import portfolioItems from "../data/portfolioItems";

export default function Home() {
  const cards = portfolioItems;

  return (
    <>
      <div className={styles.stage} data-scroll="stage">
        <HeroSection />
        <AboutSection />
      </div>
      <PortfolioSection cards={cards} />
      <ContactsSection />
    </>
  );
}
