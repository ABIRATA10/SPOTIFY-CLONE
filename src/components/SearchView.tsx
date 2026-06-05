export default function SearchView() {
  return (
    <div className="flex-1 bg-[#121212] overflow-y-auto custom-scrollbar pb-24 p-6">
      <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Browse all</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {/* Placeholder cards for genres */}
        {[
          { name: "Podcasts", color: "bg-[#27856a]" },
          { name: "Made For You", color: "bg-[#1e3264]" },
          { name: "Charts", color: "bg-[#8d67ab]" },
          { name: "New Releases", color: "bg-[#e8115b]" },
          { name: "Discover", color: "bg-[#8d67ab]" },
          { name: "Live Events", color: "bg-[#7358ff]" },
          { name: "Pop", color: "bg-[#148a08]" },
          { name: "Hip-Hop", color: "bg-[#bc5900]" },
        ].map((genre, i) => (
          <div key={i} className={`${genre.color} rounded-lg h-48 p-4 relative overflow-hidden cursor-pointer`}>
            <span className="text-white font-bold text-xl">{genre.name}</span>
            <div className="absolute -bottom-2 -right-4 w-24 h-24 bg-black/20 rotate-[25deg] shadow-lg rounded-tl-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
