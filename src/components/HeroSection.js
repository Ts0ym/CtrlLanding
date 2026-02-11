import styles from "./HeroSection.module.scss";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section id="home" className={styles.hero} data-scroll="hero">
      <div className={styles.headline}>
        <p className={styles.headlineLine}>
          <span data-anim="hero-headline-line" data-scroll="hero-out">
            Интерактив
          </span>
        </p>
        <p className={styles.headlineLine}>
          <span data-anim="hero-headline-line" data-scroll="hero-out">
            Interaction Design
          </span>
        </p>
        <p className={styles.headlineLineCn}>
          <span data-anim="hero-headline-line" data-scroll="hero-out">
            交互设计
          </span>
        </p>
      </div>

      <div className={styles.logoWrap} aria-hidden="true">
        <div className={styles.logoMask} data-anim="logo-mask">
          <Image
            className={styles.logo}
            data-anim="logo"
            data-scroll="hero-out"
            src="/svg/ctrl..svg"
            alt=""
            width={1200}
            height={220}
            sizes="(max-width: 640px) 92vw, 46vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
