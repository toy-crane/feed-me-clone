import { Converter } from "@/components/core/Converter";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <h1 className="text-sm font-bold">URL to Markdown</h1>
      </header>
      <section className="flex flex-col gap-2">
        <p className="text-center text-base">웹 페이지를 Markdown으로</p>
        <p className="text-center text-xs text-muted-foreground">
          URL을 붙여넣고 화살표를 누르세요
        </p>
      </section>
      <Converter />
    </main>
  );
}
