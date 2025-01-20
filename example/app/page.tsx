import Link from "next/link";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
      ></link>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>Demos:</h1>
        <ul>
          <li>
            <Link href="/subscribe">Subscribe Form</Link>
          </li>
          <li>
            <Link href="/update-user/9">User update</Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
