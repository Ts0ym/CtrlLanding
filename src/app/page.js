import styles from "./page.module.scss";
import PortfolioSection from "../components/PortfolioSection.client";
import portfolioItems from "../data/portfolioItems";

export default function Home() {
  const cards = portfolioItems;

  return (
    <>
      <div className={styles.stage} data-scroll="stage">
        <section id="home" className={styles.hero} data-scroll="hero">
          <div className={styles.headline}>
            <p>
              <span data-anim="hero-headline-line" data-scroll="hero-out">
                Интерактив
              </span>
            </p>
            <p>
              <span data-anim="hero-headline-line" data-scroll="hero-out">
                Interaction Design
              </span>
            </p>
            <p>
              <span data-anim="hero-headline-line" data-scroll="hero-out">
                交互设计
              </span>
            </p>
          </div>

          <div className={styles.logoWrap} aria-hidden="true">
            <div className={styles.logoMask} data-anim="logo-mask">
              <img
                className={styles.logo}
                data-anim="logo"
                data-scroll="hero-out"
                src="/svg/ctrl..svg"
                alt=""
              />
            </div>
          </div>
        </section>

        <section id="about" className={styles.about} data-scroll="about">
          <div className={`${styles.aboutHeadline} ${styles.sectionHeadline}`}>
            <p>
              <span data-scroll="about-in">О нас</span>
            </p>
            <p>
              <span data-scroll="about-in">About Us</span>
            </p>
            <p>
              <span data-scroll="about-in" className={styles.sectionHeadlineCn}>
                关于我们
              </span>
            </p>
          </div>

          <div className={styles.aboutBody}>
            <p>
              <span data-scroll="about-in">
                {"                           "}
                Мы создаем иммерсивный опыт: видео, инсталляции, мэппинг
                и&nbsp;мультимедиа для выставок.
                {"\n"}
                {"                           "}
                We create immersive experiences: video, installations, mapping, and
                exhibition multimedia.
              </span>
            </p>
            <p>
              <span data-scroll="about-in" className={styles.aboutCn}>
                {"                               "}
                我们打造沉浸式体验：涵盖视频、互动装置、投影映射及多媒体展览。
              </span>
            </p>
          </div>
        </section>
      </div>

      <PortfolioSection cards={cards} />

      <section id="contact" className={styles.contacts}>
        <div
          className={`${styles.contactsHeadline} ${styles.sectionHeadline}`}
          data-anim="contacts-headline"
        >
          <p>Контакты</p>
          <p>Contact Us</p>
          <p className={styles.sectionHeadlineCn}>联系我们</p>
        </div>

        <div className={styles.contactsBody} aria-label="Contacts">
          <div className={styles.contactGroup}>
            <div className={styles.contactText}>
              <p>Владивосток</p>
              <p>1-я Морская, 10</p>
              <p>+7 (999) 123-12-12</p>
              <p>email@email.com</p>
            </div>
            <div className={styles.contactRule} aria-hidden="true" />
          </div>

          <div className={styles.contactGroup}>
            <div className={styles.contactText}>
              <p>Москва</p>
              <p>1-я Морская, 10</p>
              <p>+7 (999) 123-12-12</p>
              <p>email@email.com</p>
            </div>
            <div className={styles.contactRule} aria-hidden="true" />
          </div>

          <div className={`${styles.contactText} ${styles.contactTextCn}`}>
            <p>上海</p>
            <p>1-я Морская, 10</p>
            <p>+7 (999) 123-12-12</p>
            <p>email@email.com</p>
          </div>
        </div>
      </section>
    </>
  );
}
