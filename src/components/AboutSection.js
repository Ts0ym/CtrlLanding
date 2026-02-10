import pageStyles from "../app/page.module.scss";
import styles from "./AboutSection.module.scss";

export default function AboutSection() {
  return (
    <section id="about" className={styles.about} data-scroll="about">
      <div className={`${styles.aboutHeadline} ${pageStyles.sectionHeadline}`}>
        <p>
          <span data-scroll="about-in">О нас</span>
        </p>
        <p>
          <span data-scroll="about-in">About Us</span>
        </p>
        <p>
          <span data-scroll="about-in" className={pageStyles.sectionHeadlineCn}>
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
  );
}
