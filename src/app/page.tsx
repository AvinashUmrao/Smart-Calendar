import Calendar from '@/components/Calendar';

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-100 dark:bg-stone-950 p-4 md:p-8 lg:p-12 flex items-center justify-center transition-colors duration-300">
      <Calendar />
    </main>
  );
}
