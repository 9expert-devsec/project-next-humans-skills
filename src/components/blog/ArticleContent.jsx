import styles from "./ArticleContent.module.css";

export default function ArticleContent({ html = "" }) {
  const safe = String(html || "");

  return (
    <article
      className={styles.content + " article-content"}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
