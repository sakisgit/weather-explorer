/**
 * Root layout.
 *
 * Desktop: the map fills the screen and a side panel sits on the left.
 * Mobile:  the map takes the top part and the panel stacks underneath it.
 *
 * The map and panel are placeholders for now; they get real content in Steps 2-3.
 */
function App() {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="order-2 flex h-1/2 w-full flex-col border-slate-800 bg-slate-900 md:order-1 md:h-full md:w-96 md:border-r">
        <header className="border-b border-slate-800 p-4">
          <h1 className="text-lg font-semibold">Weather Explorer</h1>
          <p className="text-sm text-slate-400">Explore the weather anywhere in the world</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-400">
          Search, place details and saved places will live here.
        </div>
      </aside>

      <main className="relative order-1 h-1/2 flex-1 md:order-2 md:h-full">
        <div className="flex h-full items-center justify-center bg-slate-800 text-slate-500">
          Map goes here
        </div>
      </main>
    </div>
  )
}

export default App
