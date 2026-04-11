import styles from "./page.module.scss";
import PortfolioSectionLoader from "../components/PortfolioSectionLoader.client";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ContactsSection from "../components/ContactsSection";

export default function Home() {
  return (
    <>
      <div className="seo-snippet srOnly">
        <h1>
          CTRL.moscow — студия разработки интерактивных музейных инсталляций и
          мультимедийных экспозиций
        </h1>

        <p>
          Создаём интерактивные стенды, цифровые экспозиции, иммерсивные
          пространства, мультимедийный контент, 3D-графику, видео и программные
          решения для музеев, выставок, форумов и общественных пространств.
        </p>

        <p>
          Разрабатываем полный цикл проектов: концепция, сценарий
          взаимодействия, дизайн интерфейсов, 3D-моделирование, анимация,
          производство контента, программирование интерактивных систем и
          интеграция оборудования.
        </p>

        <p>
          Специализируемся на сложных технологических проектах: мультитач-экраны,
          интерактивные столы и стены, сенсорные инсталляции, VR/AR-решения,
          генеративный контент, визуализация данных и образовательные
          интерактивные экспозиции.
        </p>

        <p>
          Создаём решения, которые вовлекают посетителей, превращают информацию
          в живой опыт и делают музейные пространства современными, понятными и
          запоминающимися.
        </p>

        <p>
          CTRL.moscow — интерактивные технологии, мультимедийные экспозиции,
          3D-графика и креативные решения для музеев, выставок и культурных
          проектов.
        </p>
      </div>

      <div className={styles.stage} data-scroll="stage">
        <HeroSection />
        <AboutSection />
      </div>
      <PortfolioSectionLoader />
      <ContactsSection />
    </>
  );
}
