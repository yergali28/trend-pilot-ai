import messages from "../messages/ru.json";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">{messages["app.title"]}</h1>
    </main>
  );
}
