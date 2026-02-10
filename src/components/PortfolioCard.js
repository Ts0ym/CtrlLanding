import styles from "./PortfolioCard.module.scss";

export default function PortfolioCard({ card, onClick }) {
  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.cardButton}
        onClick={onClick}
        aria-label="Open project"
      >
        <div className={styles.imageWrap}>
          <img className={styles.image} src={card.imageSrc} alt="" loading="lazy" />
        </div>
        <div className={styles.meta}>
          <p className={styles.date}>{card.date}</p>
          <p className={styles.title}>{card.title}</p>
        </div>
      </button>
    </article>
  );
}

