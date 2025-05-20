// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css'; // 既存のスタイルを流用または新規作成

export default function TitlePage() {
  return (
    <div className={styles.container}>
      <Head>
        <title>KIGAあい〇るますたー</title>
        <meta name="description" content="KIGAと出逢い、夢に翔ける" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h1 className={styles.title} style={{ fontSize: '4rem', marginBottom: '2rem' }}>
          KIGAアイ〇ルマスター
        </h1>
        <p className={styles.description} style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>
          KIGAと出逢い、夢に翔ける
        </p>
        <div style={{ display: 'flex', gap: '20px' }}> {/* ボタンを横並びにするためにflexを追加 */}
          <Link
            href="/mentor-select"
            className={styles.startButton}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.5rem',
              textDecoration: 'none', // 下線を消す
              color: 'white', // 文字色 (startButtonのスタイルによる)
            }}
          >
            ゲームスタート
          </Link>
          <Link
            href="/tutorial" // ★ リンク先が /tutorial であることを確認
            className={styles.startButton} // 同じスタイルを適用する場合
            style={{
              padding: '1rem 2rem',
              fontSize: '1.5rem',
              backgroundColor: '#6c757d', // 色を変更
              textDecoration: 'none', // 下線を消す
              color: 'white' // 文字色
            }}
          >
            チュートリアル
          </Link>
        </div>
        {/* 将来的にはここに「ランキング」や「オプション」などのボタンも追加できる */}
      </main>
    </div>
  );
}