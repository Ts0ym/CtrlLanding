import pageStyles from "../app/page.module.scss";
import styles from "./ContactsSection.module.scss";

export default function ContactsSection() {
  return (
    <section id="contact" className={styles.contacts}>
      <div
        className={`${styles.contactsHeadline} ${pageStyles.sectionHeadline}`}
        data-anim="contacts-headline"
      >
        <p>Контакты</p>
        <p>Contact Us</p>
        <p className={pageStyles.sectionHeadlineCn}>联系我们</p>
      </div>

      <div className={styles.contactsBody} aria-label="Contacts">
        <div className={styles.contactRule} aria-hidden="true" />
        <div className={styles.contactGroup}>
          <div className={styles.contactText}>
            <p>Владивосток</p>
            <p>1-я Морская, 10</p>
            <p>
              <a className={styles.contactNumber} href="tel:+79146789667">
                +7 (914) 678 9667
              </a>
            </p>
            <p>email@email.com</p>
          </div>
          <div className={styles.contactRule} aria-hidden="true" />
        </div>

        <div className={styles.contactGroup}>
          <div className={styles.contactText}>
            <p>Москва</p>
            <p>Волоколамское шоссе, 24</p>
            <p>
              <a className={styles.contactNumber} href="tel:+79146789667">
                +7 (914) 678 9667
              </a>
            </p>
            <p>email@email.com</p>
          </div>
          <div className={styles.contactRule} aria-hidden="true" />
        </div>

        <div className={`${styles.contactText} ${styles.contactTextCn}`}>
          <p>上海</p>
          <p className={styles.contactNumber}>瑞金二路225弄</p>
          <p>
           Weixin: anishchenko_ivan
          </p>
          <p>email@email.com</p>
        </div>
      </div>
    </section>
  );
}
