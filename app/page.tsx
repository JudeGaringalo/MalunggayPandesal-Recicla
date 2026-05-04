import Scanner from './components/Scanner';

export default function Home() {
  return (
    // We remove all padding and flex layouts here so the scanner can take over completely
    <main className="min-h-screen bg-black">
      <Scanner />
    </main>
  );
}